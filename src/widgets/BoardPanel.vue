<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { VueDraggable, type DraggableEvent } from 'vue-draggable-plus'
import { useWorkItemsStore } from '@/stores/workItems'
import type { StatusOption, WorkItem } from '@/types/work-item'
import type { BoardGroupBy, BoardViewConfig, ViewConfig } from '@/types/view'
import WorkItemCard from '@/components/WorkItemCard.vue'
import ActionIcon from '@/components/ActionIcon.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { usePriorityLabel } from '@/composables/usePriorityLabel'

const props = defineProps<{ instanceId: string; config?: ViewConfig }>()
const emit = defineEmits<{ 'update:config': [ViewConfig] }>()

const { t } = useI18n()
const store = useWorkItemsStore()
const priorityLabel = usePriorityLabel()

// A pseudo-column, not a real tag — collects items with zero tags when
// grouped by tag, so they aren't just silently missing from the board.
const NO_TAG_ID = '__no_tag__'

const cfg = (props.config ?? {}) as Partial<BoardViewConfig>
const groupBy = ref<BoardGroupBy>(cfg.groupBy ?? 'status')

let persistTimer: ReturnType<typeof setTimeout> | undefined
watch(groupBy, () => {
  clearTimeout(persistTimer)
  persistTimer = setTimeout(() => {
    emit('update:config', { groupBy: groupBy.value })
  }, 400)
})

interface ColumnView {
  id: string
  name: string
}

// The set of "columns" to render depends entirely on groupBy: real,
// user-managed StatusOptions for status; the priority registry (low/medium/
// high defaults plus any board-added custom ones) for priority; and the
// dynamic tag pool (plus the No tag bucket) for tag. Only status columns
// carry rename/delete/mark-done management, and only status/priority/tag
// (not the No tag bucket) support reordering — the other two modes are
// otherwise read-only groupings over existing data, not user-defined
// columns.
const columns = computed<ColumnView[]>(() => {
  if (groupBy.value === 'priority') {
    return store.sortedPriorities.map((priority) => ({
      id: priority.name,
      name: priorityLabel(priority.name),
    }))
  }
  if (groupBy.value === 'tag') {
    return [
      ...store.sortedTagNames.map((tag) => ({ id: tag, name: tag })),
      { id: NO_TAG_ID, name: t('board.noTag') },
    ]
  }
  return store.sortedStatuses
})

const statusNameById = computed(() => {
  const map = new Map<string, string>()
  for (const status of store.statuses) map.set(status.id, status.name)
  return map
})

function statusNameFor(item: WorkItem): string {
  if (!item.statusId) return t('list.noStatus')
  return statusNameById.value.get(item.statusId) ?? item.statusId
}

const localColumns = ref<Record<string, WorkItem[]>>({})
const newColumnName = ref('')
const editingColumnId = ref<string | null>(null)
const editingName = ref('')
const pendingDeleteColumnId = ref<string | null>(null)

const pendingDeleteHasItems = computed(() => {
  const columnId = pendingDeleteColumnId.value
  if (!columnId) return false
  if (groupBy.value === 'priority') return store.items.some((item) => item.priority === columnId)
  if (groupBy.value === 'tag') return store.items.some((item) => item.tags.includes(columnId))
  return store.items.some((item) => item.statusId === columnId)
})
const pendingDeleteWarningKey = computed(() => {
  if (groupBy.value === 'priority') return 'board.deletePriorityWarningMessage'
  if (groupBy.value === 'tag') return 'board.deleteTagWarningMessage'
  return 'board.deleteColumnWarningMessage'
})
const pendingDeleteMessage = computed(() =>
  pendingDeleteHasItems.value
    ? t(pendingDeleteWarningKey.value)
    : t('board.deleteColumnConfirmMessage'),
)

onMounted(() => {
  store.fetchAll()
})

// Unlike status/priority (each item belongs to exactly one bucket), a
// tag-grouped item can land in every column matching its tags at once —
// per your call, cards should show in every matching tag column rather
// than picking just one. Rebuilding from scratch on every relevant change
// keeps all buckets authoritative and self-correcting after a drag.
function rebuildLocalColumns(): void {
  const map: Record<string, WorkItem[]> = {}
  for (const column of columns.value) map[column.id] = []
  if (groupBy.value === 'priority') {
    for (const item of store.items) map[item.priority]?.push(item)
  } else if (groupBy.value === 'tag') {
    for (const item of store.items) {
      if (item.tags.length === 0) map[NO_TAG_ID]?.push(item)
      else for (const tag of item.tags) map[tag]?.push(item)
    }
  } else {
    for (const item of store.items) {
      const bucket = map[item.statusId] ?? (map[item.statusId] = [])
      bucket.push(item)
    }
  }
  localColumns.value = map
}

watch(
  () => [store.items, store.statuses, store.tags, store.priorities, groupBy.value] as const,
  rebuildLocalColumns,
  { deep: true, immediate: true },
)

// Cross-list drags in tag mode fire BOTH a remove (on the source column)
// and an add (on the target column) for the same gesture, each handed only
// a pre-drag snapshot of the item — and NOT in a guaranteed order (observed
// both orderings in testing). Two independent async updateItem calls built
// from that same stale snapshot would race each other as separate PUT
// requests — since the server just does a plain read-modify-write on
// items.json with no locking, that race actually corrupted the file
// (interleaved writes) the first time this was tested. So both handlers
// only record their side of the move into one shared pending record; the
// actual write is deferred to a macrotask (setTimeout 0), which only runs
// after the current synchronous event-dispatch stack unwinds — i.e. after
// BOTH handlers have already contributed, regardless of which fired first.
interface PendingTagMove {
  itemId: string
  originalTags: string[]
  removedTag?: string
  addedTag?: string
}
let pendingTagMove: PendingTagMove | null = null
let pendingTagMoveTimer: ReturnType<typeof setTimeout> | undefined

function schedulePendingTagMove(): void {
  clearTimeout(pendingTagMoveTimer)
  pendingTagMoveTimer = setTimeout(() => {
    const move = pendingTagMove
    pendingTagMove = null
    if (!move) return
    let nextTags = move.originalTags
    if (move.removedTag) nextTags = nextTags.filter((tag) => tag !== move.removedTag)
    if (move.addedTag && !nextTags.includes(move.addedTag)) nextTags = [...nextTags, move.addedTag]
    if (nextTags !== move.originalTags) store.updateItem(move.itemId, { tags: nextTags })
  })
}

function getOrStartPendingTagMove(item: WorkItem): PendingTagMove {
  if (!pendingTagMove || pendingTagMove.itemId !== item.id) {
    pendingTagMove = { itemId: item.id, originalTags: item.tags }
  }
  return pendingTagMove
}

async function handleAdd(columnId: string, event: DraggableEvent<WorkItem>): Promise<void> {
  const item = event.data
  if (!item) return
  if (groupBy.value === 'priority') {
    if (item.priority !== columnId) await store.updateItem(item.id, { priority: columnId })
    return
  }
  if (groupBy.value === 'tag') {
    if (columnId !== NO_TAG_ID) {
      getOrStartPendingTagMove(item).addedTag = columnId
      schedulePendingTagMove()
    }
    return
  }
  if (item.statusId !== columnId) await store.updateItem(item.id, { statusId: columnId })
}

function handleRemove(columnId: string, event: DraggableEvent<WorkItem>): void {
  if (groupBy.value !== 'tag' || columnId === NO_TAG_ID) return
  const item = event.data
  if (!item) return
  getOrStartPendingTagMove(item).removedTag = columnId
  schedulePendingTagMove()
}

function startEditColumn(status: StatusOption): void {
  editingColumnId.value = status.id
  editingName.value = status.name
}

async function saveColumnName(): Promise<void> {
  const columnId = editingColumnId.value
  if (!columnId) return
  const name = editingName.value.trim()
  if (name) {
    const updated = store.statuses.map((status) =>
      status.id === columnId ? { ...status, name } : status,
    )
    await store.updateStatuses(updated)
  }
  editingColumnId.value = null
}

async function addColumn(): Promise<void> {
  const name = newColumnName.value.trim()
  if (!name) return
  if (groupBy.value === 'tag') {
    await store.ensureTagRegistered(name)
  } else if (groupBy.value === 'priority') {
    await store.ensurePriorityRegistered(name)
  } else if (groupBy.value === 'status') {
    const maxOrder = store.statuses.reduce((max, status) => Math.max(max, status.order), -1)
    const updated = [
      ...store.statuses,
      { id: crypto.randomUUID(), name, order: maxOrder + 1, isDone: false },
    ]
    await store.updateStatuses(updated)
  }
  newColumnName.value = ''
}

// Explicit and sticky to this column's id — unlike the old order-based
// inference, adding or deleting *other* columns never moves this. Exactly
// one column can be the done column at a time, so setting it here clears
// it everywhere else.
async function setDoneColumn(columnId: string): Promise<void> {
  if (columnId === store.doneStatusId) return
  const updated = store.statuses.map((status) => ({ ...status, isDone: status.id === columnId }))
  await store.updateStatuses(updated)
}

// Reassigns order to match the dropped sequence exactly. Where that order
// is persisted depends on groupBy: status columns are real StatusOptions
// (order field on the entity), and priority/tag order is persisted on their
// respective registry entities (registering any previously-unregistered
// name in the process, since it needs a real row to hold an order once the
// user arranges it).
async function reorderColumns(newOrder: ColumnView[]): Promise<void> {
  if (groupBy.value === 'priority') {
    const byName = new Map(store.priorities.map((priority) => [priority.name, priority]))
    const updated = newOrder.map((entry, index) => ({
      id: byName.get(entry.id)?.id ?? crypto.randomUUID(),
      name: entry.id,
      order: index,
    }))
    await store.updatePriorities(updated)
    return
  }
  if (groupBy.value === 'tag') {
    const byName = new Map(store.tags.map((tag) => [tag.name, tag]))
    const updated = newOrder
      .filter((entry) => entry.id !== NO_TAG_ID)
      .map((entry, index) => ({
        id: byName.get(entry.id)?.id ?? crypto.randomUUID(),
        name: entry.id,
        order: index,
      }))
    await store.updateTags(updated)
    return
  }
  const byId = new Map(store.statuses.map((status) => [status.id, status]))
  const updated = newOrder
    .map((entry, index) => {
      const status = byId.get(entry.id)
      return status ? { ...status, order: index } : null
    })
    .filter((status): status is StatusOption => status !== null)
  await store.updateStatuses(updated)
}

function requestRemoveColumn(columnId: string): void {
  pendingDeleteColumnId.value = columnId
}

async function confirmRemoveColumn(): Promise<void> {
  const columnId = pendingDeleteColumnId.value
  if (!columnId) return
  if (groupBy.value === 'priority') {
    // Items set to this priority lose it entirely rather than silently
    // keeping a reference to a priority that no longer exists — the
    // warning dialog tells the user this is about to happen before they
    // confirm.
    const affectedItems = store.items.filter((item) => item.priority === columnId)
    await Promise.all(affectedItems.map((item) => store.updateItem(item.id, { priority: '' })))
    const updated = store.priorities.filter((priority) => priority.name !== columnId)
    await store.updatePriorities(updated)
  } else if (groupBy.value === 'tag') {
    // Unlike status/priority, tags are multi-valued per item — deleting the
    // tag just drops it from whichever items have it, not their other tags.
    const affectedItems = store.items.filter((item) => item.tags.includes(columnId))
    await Promise.all(
      affectedItems.map((item) =>
        store.updateItem(item.id, { tags: item.tags.filter((tag) => tag !== columnId) }),
      ),
    )
    const updated = store.tags.filter((tag) => tag.name !== columnId)
    await store.updateTags(updated)
  } else {
    // Items sitting in this column lose their status entirely rather than
    // silently keeping a reference to a column that no longer exists — the
    // warning dialog tells the user this is about to happen before they
    // confirm.
    const affectedItems = store.items.filter((item) => item.statusId === columnId)
    await Promise.all(affectedItems.map((item) => store.updateItem(item.id, { statusId: '' })))
    const updated = store.statuses.filter((status) => status.id !== columnId)
    await store.updateStatuses(updated)
  }
  pendingDeleteColumnId.value = null
}
</script>

<template>
  <div class="board-panel">
    <div class="toolbar">
      <label class="group-by">
        <span class="type-label">{{ t('board.groupBy') }}</span>
        <select v-model="groupBy" class="input type-body">
          <option value="status">{{ t('board.groupByStatus') }}</option>
          <option value="priority">{{ t('board.groupByPriority') }}</option>
          <option value="tag">{{ t('board.groupByTag') }}</option>
        </select>
      </label>
    </div>

    <p v-if="store.loading" class="type-body">{{ t('common.loading') }}</p>
    <p v-else-if="store.error" class="type-body error">
      {{ t('common.error', { message: store.error }) }}
    </p>
    <template v-else>
      <div class="board">
        <VueDraggable
          :model-value="columns"
          tag="div"
          class="column-list"
          filter="button, input, .column-body"
          :preventOnFilter="false"
          :animation="150"
          @update:model-value="reorderColumns"
        >
          <div v-for="column in columns" :key="column.id" class="column">
            <div class="column-header">
              <span
                v-if="groupBy !== 'tag' || column.id !== NO_TAG_ID"
                class="column-drag-handle icon-btn"
                :title="t('board.dragColumn')"
                >⠿</span
              >
              <input
                v-if="groupBy === 'status' && editingColumnId === column.id"
                v-model="editingName"
                class="input type-label column-name-input"
                @blur="saveColumnName"
                @keyup.enter="saveColumnName"
              />
              <span
                v-else
                class="type-label column-name"
                :class="{ editable: groupBy === 'status' }"
                @click="groupBy === 'status' && startEditColumn(column as StatusOption)"
              >
                {{ column.name }}
              </span>
              <div v-if="groupBy !== 'tag' || column.id !== NO_TAG_ID" class="column-actions">
                <button
                  v-if="groupBy === 'status'"
                  type="button"
                  class="icon-btn done-toggle"
                  :class="{ active: column.id === store.doneStatusId }"
                  :title="
                    column.id === store.doneStatusId
                      ? t('board.doneColumnActive')
                      : t('board.markAsDone')
                  "
                  @click="setDoneColumn(column.id)"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24">
                    <path d="M0 0h24v24H0z" fill="none" />
                    <path
                      fill="currentColor"
                      d="M12 2a10 10 0 1 0 0 20a10 10 0 0 0 0-20m-1.2 14.4l-4.2-4.2l1.4-1.4l2.8 2.8l6-6l1.4 1.4z"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  class="icon-btn"
                  :title="t('board.deleteColumnTitle')"
                  @click="requestRemoveColumn(column.id)"
                >
                  <ActionIcon type="delete" />
                </button>
              </div>
            </div>

            <VueDraggable
              :model-value="localColumns[column.id] ?? []"
              class="column-body"
              :group="{ name: 'board-columns', put: column.id !== NO_TAG_ID }"
              :animation="150"
              @update:model-value="(value: WorkItem[]) => (localColumns[column.id] = value)"
              @add="(event: DraggableEvent<WorkItem>) => handleAdd(column.id, event)"
              @remove="(event: DraggableEvent<WorkItem>) => handleRemove(column.id, event)"
            >
              <WorkItemCard
                v-for="item in localColumns[column.id] ?? []"
                :key="item.id"
                :item="item"
                :status-name="statusNameFor(item)"
                :is-completed="store.isItemCompleted(item)"
              />
            </VueDraggable>
          </div>
        </VueDraggable>

        <div class="column add-column">
          <input
            v-model="newColumnName"
            class="input type-body"
            type="text"
            :placeholder="t('board.addColumnPlaceholder')"
            @keyup.enter="addColumn"
          />
        </div>
      </div>
    </template>

    <ConfirmDialog
      :open="pendingDeleteColumnId !== null"
      :title="t('board.deleteColumnTitle')"
      :message="pendingDeleteMessage"
      @confirm="confirmRemoveColumn"
      @cancel="pendingDeleteColumnId = null"
    />
  </div>
</template>

<style scoped>
.board-panel {
  min-width: 0;
}

.toolbar {
  display: flex;
  margin-bottom: var(--space-md);
}

.group-by {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.group-by .input {
  min-width: 140px;
}

.error {
  font-weight: 700;
}

.board {
  display: flex;
  gap: var(--space-md);
  align-items: flex-start;
  overflow-x: auto;
}

/* The column-reorder VueDraggable needs a real DOM element to attach
   sortable.js to, but shouldn't itself become a flex box competing with
   .add-column for layout — display:contents makes its columns direct flex
   items of .board while the wrapper itself takes no visual space. Same
   pattern GridLayout.vue uses for its own nested draggable. */
.column-list {
  display: contents;
}

.column {
  background: var(--color-canvas-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--rounded-md);
  padding: var(--space-sm);
  min-width: 260px;
  width: 260px;
  flex-shrink: 0;
}

.column-header {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  margin-bottom: var(--space-sm);
  cursor: grab;
}

.column-header:active {
  cursor: grabbing;
}

/* The handle icon is a pure visual affordance now — the whole header is the
   drag surface (see the outer VueDraggable's `filter`, which carves out
   .column-body/button/input instead of requiring this specific handle) — so
   it stays dim until the header itself is hovered, not just the icon. */
.icon-btn.column-drag-handle {
  flex-shrink: 0;
  cursor: inherit;
  color: var(--color-ink-muted);
}

.column-header:hover .icon-btn.column-drag-handle {
  color: var(--color-ink);
}

.column-name {
  flex: 1;
  min-width: 0;
  color: var(--color-ink-secondary);
}

.column-name.editable {
  cursor: text;
}

.column-name-input {
  padding: 4px 8px;
  min-height: auto;
}

.column-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-ink-muted);
  padding: 2px;
}

.done-toggle.active {
  color: var(--color-ink);
}

.column-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  min-height: 60px;
}

.add-column {
  background: none;
  border: 1px dashed var(--color-border-strong);
  display: flex;
  align-items: center;
}
</style>

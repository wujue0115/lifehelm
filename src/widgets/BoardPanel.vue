<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { VueDraggable, type DraggableEvent } from 'vue-draggable-plus'
import { useWorkItemsStore } from '@/stores/workItems'
import type { BoardColumn, Priority, WorkItem } from '@/types/work-item'
import type { BoardGroupBy, BoardViewConfig, ViewConfig } from '@/types/view'
import WorkItemCard from '@/components/WorkItemCard.vue'
import ActionIcon from '@/components/ActionIcon.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const props = defineProps<{ instanceId: string; config?: ViewConfig }>()
const emit = defineEmits<{ 'update:config': [ViewConfig] }>()

const { t } = useI18n()
const store = useWorkItemsStore()

// A pseudo-column, not a real tag — collects items with zero tags when
// grouped by tag, so they aren't just silently missing from the board.
const NO_TAG_ID = '__no_tag__'

const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'urgent']

const cfg = (props.config ?? {}) as Partial<BoardViewConfig>
const groupBy = ref<BoardGroupBy>(cfg.groupBy ?? 'status')
// User-arranged priority column order — priority has no backing entity to
// store an order on (unlike status columns or tags), so it lives in this
// widget's own view config instead.
const priorityOrder = ref<Priority[]>(
  cfg.priorityOrder && cfg.priorityOrder.length === PRIORITIES.length ? cfg.priorityOrder : PRIORITIES,
)

let persistTimer: ReturnType<typeof setTimeout> | undefined
watch([groupBy, priorityOrder], () => {
  clearTimeout(persistTimer)
  persistTimer = setTimeout(() => {
    emit('update:config', { groupBy: groupBy.value, priorityOrder: priorityOrder.value })
  }, 400)
})

interface ColumnView {
  id: string
  name: string
}

// The set of "columns" to render depends entirely on groupBy: real,
// user-managed BoardColumns for status; the fixed 4 priority values
// (user-orderable) for priority; and the dynamic tag pool (plus the No tag
// bucket) for tag. Only status columns carry rename/delete/mark-done
// management, and only status/priority/tag (not the No tag bucket) support
// reordering — the other two modes are otherwise read-only groupings over
// existing data, not user-defined columns.
const columns = computed<ColumnView[]>(() => {
  if (groupBy.value === 'priority') {
    return priorityOrder.value.map((priority) => ({ id: priority, name: t(`priority.${priority}`) }))
  }
  if (groupBy.value === 'tag') {
    return [
      ...store.sortedTagNames.map((tag) => ({ id: tag, name: tag })),
      { id: NO_TAG_ID, name: t('board.noTag') },
    ]
  }
  return store.sortedBoard
})

const statusNameById = computed(() => {
  const map = new Map<string, string>()
  for (const column of store.board) map.set(column.id, column.name)
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

const pendingDeleteHasItems = computed(() =>
  pendingDeleteColumnId.value
    ? store.items.some((item) => item.statusId === pendingDeleteColumnId.value)
    : false,
)
const pendingDeleteMessage = computed(() =>
  pendingDeleteHasItems.value
    ? t('board.deleteColumnWarningMessage')
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

watch(() => [store.items, store.board, store.tags, groupBy.value] as const, rebuildLocalColumns, {
  deep: true,
  immediate: true,
})

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
    if (item.priority !== columnId)
      await store.updateItem(item.id, { priority: columnId as Priority })
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

function startEditColumn(column: BoardColumn): void {
  editingColumnId.value = column.id
  editingName.value = column.name
}

async function saveColumnName(): Promise<void> {
  const columnId = editingColumnId.value
  if (!columnId) return
  const name = editingName.value.trim()
  if (name) {
    const updated = store.board.map((column) =>
      column.id === columnId ? { ...column, name } : column,
    )
    await store.updateBoard(updated)
  }
  editingColumnId.value = null
}

async function addColumn(): Promise<void> {
  const name = newColumnName.value.trim()
  if (!name) return
  if (groupBy.value === 'tag') {
    await store.ensureTagRegistered(name)
  } else if (groupBy.value === 'status') {
    const maxOrder = store.board.reduce((max, column) => Math.max(max, column.order), -1)
    const updated = [
      ...store.board,
      { id: crypto.randomUUID(), name, order: maxOrder + 1, isDone: false },
    ]
    await store.updateBoard(updated)
  }
  newColumnName.value = ''
}

// Explicit and sticky to this column's id — unlike the old order-based
// inference, adding or deleting *other* columns never moves this. Exactly
// one column can be the done column at a time, so setting it here clears
// it everywhere else.
async function setDoneColumn(columnId: string): Promise<void> {
  if (columnId === store.doneColumnId) return
  const updated = store.board.map((column) => ({ ...column, isDone: column.id === columnId }))
  await store.updateBoard(updated)
}

// Reassigns order to match the dropped sequence exactly. Where that order
// is persisted depends on groupBy: status columns are real BoardColumns
// (order field on the entity), priority has no backing entity so its order
// lives in this widget's config, and tag order is persisted on the Tag
// entity (registering previously-unregistered tags in the process, since
// they need a real Tag row to hold an order once the user arranges them).
async function reorderColumns(newOrder: ColumnView[]): Promise<void> {
  if (groupBy.value === 'priority') {
    priorityOrder.value = newOrder.map((entry) => entry.id as Priority)
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
  const byId = new Map(store.board.map((column) => [column.id, column]))
  const updated = newOrder
    .map((entry, index) => {
      const column = byId.get(entry.id)
      return column ? { ...column, order: index } : null
    })
    .filter((column): column is BoardColumn => column !== null)
  await store.updateBoard(updated)
}

function requestRemoveColumn(columnId: string): void {
  pendingDeleteColumnId.value = columnId
}

async function confirmRemoveColumn(): Promise<void> {
  const columnId = pendingDeleteColumnId.value
  if (!columnId) return
  // Items sitting in this column lose their status entirely rather than
  // silently keeping a reference to a column that no longer exists — the
  // warning dialog tells the user this is about to happen before they
  // confirm.
  const affectedItems = store.items.filter((item) => item.statusId === columnId)
  await Promise.all(affectedItems.map((item) => store.updateItem(item.id, { statusId: '' })))
  const updated = store.board.filter((column) => column.id !== columnId)
  await store.updateBoard(updated)
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
                @click="groupBy === 'status' && startEditColumn(column as BoardColumn)"
              >
                {{ column.name }}
              </span>
              <div v-if="groupBy === 'status'" class="column-actions">
                <button
                  type="button"
                  class="icon-btn done-toggle"
                  :class="{ active: column.id === store.doneColumnId }"
                  :title="
                    column.id === store.doneColumnId
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

        <div v-if="groupBy !== 'priority'" class="column add-column">
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

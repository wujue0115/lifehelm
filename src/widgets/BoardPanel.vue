<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { VueDraggable, type DraggableEvent } from 'vue-draggable-plus'
import { useWorkItemsStore } from '@/stores/workItems'
import type { BoardColumn, WorkItem } from '@/types/work-item'
import type { ViewConfig } from '@/types/view'
import WorkItemCard from '@/components/WorkItemCard.vue'
import ActionIcon from '@/components/ActionIcon.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

defineProps<{ instanceId: string; config?: ViewConfig }>()

const { t } = useI18n()
const store = useWorkItemsStore()

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

function rebuildLocalColumns(): void {
  const map: Record<string, WorkItem[]> = {}
  for (const column of store.board) map[column.id] = []
  for (const item of store.items) {
    const bucket = map[item.statusId] ?? (map[item.statusId] = [])
    bucket.push(item)
  }
  localColumns.value = map
}

watch(() => store.items, rebuildLocalColumns, { deep: true, immediate: true })
watch(() => store.board, rebuildLocalColumns, { deep: true })

async function handleAdd(columnId: string, event: DraggableEvent<WorkItem>): Promise<void> {
  const item = event.data
  if (item && item.statusId !== columnId) {
    await store.updateItem(item.id, { statusId: columnId })
  }
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
  const maxOrder = store.board.reduce((max, column) => Math.max(max, column.order), -1)
  const updated = [
    ...store.board,
    { id: crypto.randomUUID(), name, order: maxOrder + 1, isDone: false },
  ]
  await store.updateBoard(updated)
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
    <p v-if="store.loading" class="type-body">{{ t('common.loading') }}</p>
    <p v-else-if="store.error" class="type-body error">
      {{ t('common.error', { message: store.error }) }}
    </p>
    <template v-else>
      <div class="board">
        <div v-for="column in store.sortedBoard" :key="column.id" class="column">
          <div class="column-header">
            <input
              v-if="editingColumnId === column.id"
              v-model="editingName"
              class="input type-label column-name-input"
              @blur="saveColumnName"
              @keyup.enter="saveColumnName"
            />
            <span v-else class="type-label column-name" @click="startEditColumn(column)">
              {{ column.name }}
            </span>
            <div class="column-actions">
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
            group="board-columns"
            :animation="150"
            @update:model-value="(value: WorkItem[]) => (localColumns[column.id] = value)"
            @add="(event: DraggableEvent<WorkItem>) => handleAdd(column.id, event)"
          >
            <WorkItemCard
              v-for="item in localColumns[column.id] ?? []"
              :key="item.id"
              :item="item"
              :is-completed="column.id === store.doneColumnId"
            />
          </VueDraggable>
        </div>

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

.error {
  font-weight: 700;
}

.board {
  display: flex;
  gap: var(--space-md);
  align-items: flex-start;
  overflow-x: auto;
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
  justify-content: space-between;
  margin-bottom: var(--space-sm);
}

.column-name {
  color: var(--color-ink-secondary);
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

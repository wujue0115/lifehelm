<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { VueDraggable, type DraggableEvent } from 'vue-draggable-plus'
import { useWorkItemsStore } from '@/stores/workItems'
import type { BoardColumn, WorkItem } from '@/types/work-item'
import WorkItemCard from '@/components/WorkItemCard.vue'

const store = useWorkItemsStore()

const localColumns = ref<Record<string, WorkItem[]>>({})
const boardError = ref<string | null>(null)
const newColumnName = ref('')
const editingColumnId = ref<string | null>(null)
const editingName = ref('')

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
  const updated = [...store.board, { id: crypto.randomUUID(), name, order: maxOrder + 1 }]
  await store.updateBoard(updated)
  newColumnName.value = ''
}

async function removeColumn(columnId: string): Promise<void> {
  boardError.value = null
  const hasItems = store.items.some((item) => item.statusId === columnId)
  if (hasItems) {
    boardError.value = '這個欄位還有工作項目，請先將項目移到其他欄位再刪除。'
    return
  }
  const updated = store.board.filter((column) => column.id !== columnId)
  await store.updateBoard(updated)
}
</script>

<template>
  <main class="board-view">
    <div class="header">
      <h1 class="type-display-lg">看板檢視</h1>
    </div>

    <p v-if="store.loading" class="type-body-md">載入中…</p>
    <p v-else-if="store.error" class="type-body-md error">錯誤：{{ store.error }}</p>
    <template v-else>
      <p v-if="boardError" class="type-body-md error">{{ boardError }}</p>
      <div class="board">
        <div v-for="column in store.sortedBoard" :key="column.id" class="column">
          <div class="column-header">
            <input
              v-if="editingColumnId === column.id"
              v-model="editingName"
              class="input type-micro-cap column-name-input"
              @blur="saveColumnName"
              @keyup.enter="saveColumnName"
            />
            <span v-else class="type-micro-cap column-name" @click="startEditColumn(column)">
              {{ column.name }}
            </span>
            <button
              type="button"
              class="icon-btn"
              title="刪除欄位"
              @click="removeColumn(column.id)"
            >
              ×
            </button>
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
            />
          </VueDraggable>
        </div>

        <div class="column add-column">
          <input
            v-model="newColumnName"
            class="input type-body-md"
            type="text"
            placeholder="+ 新增欄位"
            @keyup.enter="addColumn"
          />
        </div>
      </div>
    </template>
  </main>
</template>

<style scoped>
.board-view {
  padding: 32px;
}

.header {
  margin-bottom: 24px;
}

.error {
  font-weight: 700;
}

.board {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  overflow-x: auto;
}

.column {
  background: var(--color-canvas-cool);
  border-radius: var(--rounded-sm);
  padding: 12px;
  min-width: 260px;
  width: 260px;
  flex-shrink: 0;
}

.column-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.column-name {
  color: var(--color-ink-mute);
  cursor: text;
}

.column-name-input {
  padding: 4px 8px;
  min-height: auto;
}

.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-ink-mute);
  font-size: 18px;
  line-height: 1;
}

.column-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 60px;
}

.add-column {
  background: none;
  border: 1px dashed var(--color-hairline-on-light);
  display: flex;
  align-items: center;
}
</style>

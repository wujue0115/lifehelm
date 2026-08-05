<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useWorkItemsStore } from '@/stores/workItems'
import type { Priority } from '@/types/work-item'
import WorkItemRow from '@/components/WorkItemRow.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

type SortKey = 'title' | 'dueDate' | 'priority' | 'updatedAt'

const store = useWorkItemsStore()

const search = ref('')
const statusFilter = ref('all')
const priorityFilter = ref<Priority | 'all'>('all')
const tagFilter = ref('all')
const sortKey = ref<SortKey>('updatedAt')
const sortDir = ref<'asc' | 'desc'>('desc')
const pendingDeleteId = ref<string | null>(null)

onMounted(() => {
  store.fetchAll()
})

const statusNameById = computed(() => {
  const map = new Map<string, string>()
  for (const column of store.board) map.set(column.id, column.name)
  return map
})

const allTags = computed(() => {
  const tagSet = new Set<string>()
  for (const item of store.items) {
    for (const tag of item.tags) tagSet.add(tag)
  }
  return Array.from(tagSet).sort()
})

const priorityOrder: Record<Priority, number> = { low: 0, medium: 1, high: 2, urgent: 3 }

const filteredItems = computed(() => {
  const query = search.value.trim().toLowerCase()
  return store.items.filter((item) => {
    if (statusFilter.value !== 'all' && item.statusId !== statusFilter.value) return false
    if (priorityFilter.value !== 'all' && item.priority !== priorityFilter.value) return false
    if (tagFilter.value !== 'all' && !item.tags.includes(tagFilter.value)) return false
    if (
      query &&
      !item.title.toLowerCase().includes(query) &&
      !item.description.toLowerCase().includes(query)
    ) {
      return false
    }
    return true
  })
})

const sortedItems = computed(() => {
  const list = [...filteredItems.value]
  list.sort((a, b) => {
    let result = 0
    if (sortKey.value === 'title') result = a.title.localeCompare(b.title)
    else if (sortKey.value === 'priority')
      result = priorityOrder[a.priority] - priorityOrder[b.priority]
    else if (sortKey.value === 'dueDate') result = (a.dueDate ?? '').localeCompare(b.dueDate ?? '')
    else result = a.updatedAt.localeCompare(b.updatedAt)
    return sortDir.value === 'asc' ? result : -result
  })
  return list
})

function toggleSort(key: SortKey): void {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = 'asc'
  }
}

function requestDelete(id: string): void {
  pendingDeleteId.value = id
}

async function confirmDelete(): Promise<void> {
  if (pendingDeleteId.value) await store.deleteItem(pendingDeleteId.value)
  pendingDeleteId.value = null
}
</script>

<template>
  <main class="list-view">
    <div class="header">
      <h1 class="type-display-lg">清單檢視</h1>
      <RouterLink to="/items/new" class="btn btn-filled-cool type-button-cap"
        >+ 新增項目</RouterLink
      >
    </div>

    <div class="filters">
      <input
        v-model="search"
        class="input type-body-md"
        type="text"
        placeholder="搜尋標題或描述…"
      />
      <select v-model="statusFilter" class="input type-body-md">
        <option value="all">所有狀態</option>
        <option v-for="column in store.sortedBoard" :key="column.id" :value="column.id">
          {{ column.name }}
        </option>
      </select>
      <select v-model="priorityFilter" class="input type-body-md">
        <option value="all">所有優先級</option>
        <option value="low">低</option>
        <option value="medium">中</option>
        <option value="high">高</option>
        <option value="urgent">緊急</option>
      </select>
      <select v-model="tagFilter" class="input type-body-md">
        <option value="all">所有標籤</option>
        <option v-for="tag in allTags" :key="tag" :value="tag">{{ tag }}</option>
      </select>
    </div>

    <p v-if="store.loading" class="type-body-md">載入中…</p>
    <p v-else-if="store.error" class="type-body-md error">錯誤：{{ store.error }}</p>
    <template v-else>
      <p class="count type-caption">
        共 {{ sortedItems.length }} / {{ store.items.length }} 筆工作項目
      </p>
      <table v-if="sortedItems.length" class="table">
        <thead>
          <tr class="type-micro-cap">
            <th @click="toggleSort('title')">標題</th>
            <th>狀態</th>
            <th @click="toggleSort('priority')">優先級</th>
            <th>標籤</th>
            <th @click="toggleSort('dueDate')">日期</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <WorkItemRow
            v-for="item in sortedItems"
            :key="item.id"
            :item="item"
            :status-name="statusNameById.get(item.statusId) ?? item.statusId"
            :is-completed="store.isItemCompleted(item)"
            @delete="requestDelete"
          />
        </tbody>
      </table>
      <p v-else class="type-body-md empty">沒有符合條件的工作項目。</p>
    </template>

    <ConfirmDialog
      :open="pendingDeleteId !== null"
      title="刪除工作項目"
      message="確定要刪除這個工作項目嗎？此動作無法復原。"
      @confirm="confirmDelete"
      @cancel="pendingDeleteId = null"
    />
  </main>
</template>

<style scoped>
.list-view {
  padding: 32px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  gap: 16px;
  flex-wrap: wrap;
}

.filters {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.filters .input {
  min-width: 160px;
}

.count {
  color: var(--color-ink-mute);
  margin-bottom: 8px;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th {
  text-align: left;
  padding: 8px;
  color: var(--color-ink-mute);
  cursor: pointer;
  border-bottom: 1px solid var(--color-ink);
}

.empty {
  color: var(--color-ink-mute);
  padding: 32px 0;
  text-align: center;
}

.error {
  font-weight: 700;
}
</style>

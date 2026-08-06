<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useWorkItemsStore } from '@/stores/workItems'
import type { Priority } from '@/types/work-item'
import WorkItemRow from '@/components/WorkItemRow.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

type SortKey = 'title' | 'dueDate' | 'priority' | 'updatedAt'

const { t } = useI18n()
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
    <div class="toolbar">
      <div class="filters">
        <input
          v-model="search"
          class="input type-body"
          type="text"
          :placeholder="t('list.searchPlaceholder')"
        />
        <select v-model="statusFilter" class="input type-body">
          <option value="all">{{ t('list.allStatus') }}</option>
          <option v-for="column in store.sortedBoard" :key="column.id" :value="column.id">
            {{ column.name }}
          </option>
        </select>
        <select v-model="priorityFilter" class="input type-body">
          <option value="all">{{ t('list.allPriority') }}</option>
          <option value="low">{{ t('priority.low') }}</option>
          <option value="medium">{{ t('priority.medium') }}</option>
          <option value="high">{{ t('priority.high') }}</option>
          <option value="urgent">{{ t('priority.urgent') }}</option>
        </select>
        <select v-model="tagFilter" class="input type-body">
          <option value="all">{{ t('list.allTags') }}</option>
          <option v-for="tag in allTags" :key="tag" :value="tag">{{ tag }}</option>
        </select>
      </div>
      <RouterLink to="/items/new" class="btn btn-primary">{{ t('list.addItem') }}</RouterLink>
    </div>

    <p v-if="store.loading" class="type-body">{{ t('common.loading') }}</p>
    <p v-else-if="store.error" class="type-body error">
      {{ t('common.error', { message: store.error }) }}
    </p>
    <template v-else>
      <p class="count type-caption">
        {{ t('list.count', { filtered: sortedItems.length, total: store.items.length }) }}
      </p>
      <div class="table-card">
        <table v-if="sortedItems.length" class="table">
          <thead>
            <tr class="type-label">
              <th @click="toggleSort('title')">{{ t('list.columnTitle') }}</th>
              <th>{{ t('list.columnStatus') }}</th>
              <th @click="toggleSort('priority')">{{ t('list.columnPriority') }}</th>
              <th>{{ t('list.columnTags') }}</th>
              <th @click="toggleSort('dueDate')">{{ t('list.columnDate') }}</th>
              <th>{{ t('list.columnActions') }}</th>
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
        <p v-else class="type-body empty">{{ t('list.empty') }}</p>
      </div>
    </template>

    <ConfirmDialog
      :open="pendingDeleteId !== null"
      :title="t('list.deleteConfirmTitle')"
      :message="t('list.deleteConfirmMessage')"
      @confirm="confirmDelete"
      @cancel="pendingDeleteId = null"
    />
  </main>
</template>

<style scoped>
.list-view {
  padding: var(--space-xl);
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-md);
  gap: var(--space-md);
  flex-wrap: wrap;
}

.filters {
  display: flex;
  gap: var(--space-xs);
  flex-wrap: wrap;
}

.filters .input {
  min-width: 140px;
}

.count {
  color: var(--color-ink-secondary);
  margin-bottom: var(--space-sm);
}

.table-card {
  background: var(--color-canvas-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--rounded-md);
  overflow: hidden;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th {
  text-align: left;
  padding: 10px 12px;
  color: var(--color-ink-secondary);
  cursor: pointer;
  border-bottom: 1px solid var(--color-border-strong);
}

.empty {
  color: var(--color-ink-muted);
  padding: var(--space-xxl) 0;
  text-align: center;
}

.error {
  font-weight: 700;
}
</style>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useWorkItemsStore } from '@/stores/workItems'
import type { Priority } from '@/types/work-item'
import type { ListViewConfig, ViewConfig } from '@/types/view'
import type { TagColorKey } from '@/config/tagColors'
import WorkItemRow from '@/components/WorkItemRow.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import SortIcon from '@/components/SortIcon.vue'
import ActionIcon from '@/components/ActionIcon.vue'
import ListColorSettings from '@/components/ListColorSettings.vue'
import { usePriorityLabel } from '@/composables/usePriorityLabel'

type SortKey = 'title' | 'status' | 'priority' | 'tags' | 'dueDate' | 'updatedAt'

const DEFAULT_SORT_KEY: SortKey = 'updatedAt'
const DEFAULT_SORT_DIR: 'asc' | 'desc' = 'desc'

defineOptions({ inheritAttrs: false })

const props = defineProps<{ instanceId: string; config?: ViewConfig }>()
const emit = defineEmits<{ 'update:config': [ViewConfig] }>()

const { t } = useI18n()
const store = useWorkItemsStore()
const priorityLabel = usePriorityLabel()

const cfg = (props.config ?? {}) as Partial<ListViewConfig>
const search = ref(cfg.search ?? '')
const statusFilter = ref(cfg.statusFilter ?? 'all')
const priorityFilter = ref<Priority | 'all'>((cfg.priorityFilter as Priority | 'all') ?? 'all')
const tagFilter = ref(cfg.tagFilter ?? 'all')
const sortKey = ref<SortKey>((cfg.sortKey as SortKey) ?? DEFAULT_SORT_KEY)
const sortDir = ref<'asc' | 'desc'>(cfg.sortDir ?? DEFAULT_SORT_DIR)
const pendingDeleteId = ref<string | null>(null)
const statusColors = ref<Record<string, TagColorKey>>({ ...cfg.statusColors })
const priorityColors = ref<Partial<Record<Priority, TagColorKey>>>({ ...cfg.priorityColors })
const tagColors = ref<Record<string, TagColorKey>>({ ...cfg.tagColors })
const settingsOpen = ref(false)

onMounted(() => {
  store.fetchAll()
})

let persistTimer: ReturnType<typeof setTimeout> | undefined
function schedulePersist(): void {
  clearTimeout(persistTimer)
  persistTimer = setTimeout(() => {
    emit('update:config', {
      search: search.value,
      statusFilter: statusFilter.value,
      priorityFilter: priorityFilter.value,
      tagFilter: tagFilter.value,
      sortKey: sortKey.value,
      sortDir: sortDir.value,
      statusColors: statusColors.value,
      priorityColors: priorityColors.value,
      tagColors: tagColors.value,
    })
  }, 400)
}
watch([search, statusFilter, priorityFilter, tagFilter, sortKey, sortDir], schedulePersist)
watch([statusColors, priorityColors, tagColors], schedulePersist, { deep: true })

const statusNameById = computed(() => {
  const map = new Map<string, string>()
  for (const column of store.board) map.set(column.id, column.name)
  return map
})

const statusOrderById = computed(() => {
  const map = new Map<string, number>()
  store.sortedBoard.forEach((column, index) => map.set(column.id, index))
  return map
})

const priorityOrderById = computed(() => {
  const map = new Map<string, number>()
  store.sortedPriorities.forEach((priority, index) => map.set(priority.name, index))
  return map
})

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
    else if (sortKey.value === 'status')
      result =
        (statusOrderById.value.get(a.statusId) ?? 0) - (statusOrderById.value.get(b.statusId) ?? 0)
    else if (sortKey.value === 'priority')
      result =
        (priorityOrderById.value.get(a.priority) ?? 0) -
        (priorityOrderById.value.get(b.priority) ?? 0)
    else if (sortKey.value === 'tags')
      result = [...a.tags]
        .sort()
        .join(',')
        .localeCompare([...b.tags].sort().join(','))
    else if (sortKey.value === 'dueDate') result = (a.dueDate ?? '').localeCompare(b.dueDate ?? '')
    else result = a.updatedAt.localeCompare(b.updatedAt)
    return sortDir.value === 'asc' ? result : -result
  })
  return list
})

function toggleSort(key: SortKey): void {
  if (sortKey.value !== key) {
    sortKey.value = key
    sortDir.value = 'asc'
  } else if (sortDir.value === 'asc') {
    sortDir.value = 'desc'
  } else {
    sortKey.value = DEFAULT_SORT_KEY
    sortDir.value = DEFAULT_SORT_DIR
  }
}

function sortDirFor(key: SortKey): 'asc' | 'desc' | 'none' {
  return sortKey.value === key ? sortDir.value : 'none'
}

// Assigning a color is the moment a tag becomes significant enough to be
// worth remembering — registers it into list.json so it keeps its color
// (and shows up for future coloring) even if every item wearing it is
// later retagged or deleted.
function onTagColorsUpdate(next: Record<string, TagColorKey>): void {
  tagColors.value = next
  for (const tagName of Object.keys(next)) {
    store.ensureTagRegistered(tagName)
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
  <div class="list-panel">
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
          <option
            v-for="priority in store.sortedPriorities"
            :key="priority.id"
            :value="priority.name"
          >
            {{ priorityLabel(priority.name) }}
          </option>
        </select>
        <select v-model="tagFilter" class="input type-body">
          <option value="all">{{ t('list.allTags') }}</option>
          <option v-for="tag in store.allTags" :key="tag" :value="tag">{{ tag }}</option>
        </select>
      </div>
      <div class="toolbar-actions">
        <button
          type="button"
          class="btn-ghost action-btn"
          :title="t('list.colorSettings')"
          @click="settingsOpen = true"
        >
          <ActionIcon type="settings" />
        </button>
        <RouterLink to="/items/new" class="btn btn-primary">
          <ActionIcon type="add" />
          <span class="icon-label">{{ t('list.addItem') }}</span>
        </RouterLink>
      </div>
    </div>

    <ListColorSettings
      :open="settingsOpen"
      :statuses="store.sortedBoard"
      :priorities="store.sortedPriorities"
      :tags="store.allTags"
      :status-colors="statusColors"
      :priority-colors="priorityColors"
      :tag-colors="tagColors"
      @update:status-colors="(v) => (statusColors = v)"
      @update:priority-colors="(v) => (priorityColors = v)"
      @update:tag-colors="onTagColorsUpdate"
      @close="settingsOpen = false"
    />

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
              <th
                class="sortable"
                :aria-sort="
                  sortKey === 'title' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'
                "
                @click="toggleSort('title')"
              >
                <span class="th-label">
                  {{ t('list.columnTitle') }}
                  <SortIcon class="sort-indicator" :direction="sortDirFor('title')" />
                </span>
              </th>
              <th
                class="sortable"
                :aria-sort="
                  sortKey === 'status' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'
                "
                @click="toggleSort('status')"
              >
                <span class="th-label">
                  {{ t('list.columnStatus') }}
                  <SortIcon class="sort-indicator" :direction="sortDirFor('status')" />
                </span>
              </th>
              <th
                class="sortable"
                :aria-sort="
                  sortKey === 'priority' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'
                "
                @click="toggleSort('priority')"
              >
                <span class="th-label">
                  {{ t('list.columnPriority') }}
                  <SortIcon class="sort-indicator" :direction="sortDirFor('priority')" />
                </span>
              </th>
              <th
                class="sortable"
                :aria-sort="
                  sortKey === 'tags' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'
                "
                @click="toggleSort('tags')"
              >
                <span class="th-label">
                  {{ t('list.columnTags') }}
                  <SortIcon class="sort-indicator" :direction="sortDirFor('tags')" />
                </span>
              </th>
              <th
                class="sortable"
                :aria-sort="
                  sortKey === 'dueDate' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'
                "
                @click="toggleSort('dueDate')"
              >
                <span class="th-label">
                  {{ t('list.columnDate') }}
                  <SortIcon class="sort-indicator" :direction="sortDirFor('dueDate')" />
                </span>
              </th>
              <th>{{ t('list.columnActions') }}</th>
            </tr>
          </thead>
          <tbody>
            <WorkItemRow
              v-for="item in sortedItems"
              :key="item.id"
              :item="item"
              :status-name="
                item.statusId
                  ? (statusNameById.get(item.statusId) ?? item.statusId)
                  : t('list.noStatus')
              "
              :is-completed="store.isItemCompleted(item)"
              :status-color="statusColors[item.statusId]"
              :priority-color="priorityColors[item.priority]"
              :tag-colors="tagColors"
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
  </div>
</template>

<style scoped>
.list-panel {
  min-width: 0;
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

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  min-height: auto;
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
  border-bottom: 1px solid var(--color-border-strong);
}

.table th.sortable {
  cursor: pointer;
  user-select: none;
}

.table th.sortable:hover {
  color: var(--color-ink);
}

.th-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  line-height: 16px;
}

.sort-indicator {
  font-size: 16px;
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

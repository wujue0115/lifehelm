<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useWorkItemsStore } from '@/stores/workItems'
import type { Priority, WorkItem } from '@/types/work-item'
import type { ListViewConfig, ViewConfig } from '@/types/view'
import type { TagColorKey } from '@/config/tagColors'
import WorkItemRow from '@/components/WorkItemRow.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import SortIcon from '@/components/SortIcon.vue'
import ActionIcon from '@/components/ActionIcon.vue'
import ColorSettings from '@/components/ColorSettings.vue'
import DateFilter from '@/components/DateFilter.vue'
import MultiSelectMenu from '@/components/MultiSelectMenu.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import PriorityBadge from '@/components/PriorityBadge.vue'
import TagPill from '@/components/TagPill.vue'
import { usePriorityLabel } from '@/composables/usePriorityLabel'
import { resolveColor } from '@/utils/colors'
import { resolveDateFilterRange, itemMatchesDateRange } from '@/utils/dateFilterPresets'
import type { DateFilterPreset } from '@/utils/dateFilterPresets'

type SortKey = 'title' | 'status' | 'priority' | 'tags' | 'dueDate' | 'updatedAt'

const DEFAULT_SORT_KEY: SortKey = 'updatedAt'
const DEFAULT_SORT_DIR: 'asc' | 'desc' = 'desc'

defineOptions({ inheritAttrs: false })

const props = defineProps<{ instanceId: string; config?: ViewConfig }>()
const emit = defineEmits<{ 'update:config': [ViewConfig] }>()

const { t } = useI18n()
const store = useWorkItemsStore()
const priorityLabel = usePriorityLabel()

// Existing persisted configs may still carry the pre-multi-select 'all'
// sentinel string rather than an array (single-select's "no filter" value)
// — normalize anything that isn't already an array down to `[]`, the
// multi-select equivalent of "no restriction."
function normalizeFilterValues(value: unknown): string[] {
  return Array.isArray(value) ? value : []
}

const cfg = (props.config ?? {}) as Partial<ListViewConfig>
const search = ref(cfg.search ?? '')
const statusFilter = ref(normalizeFilterValues(cfg.statusFilter))
const priorityFilter = ref(normalizeFilterValues(cfg.priorityFilter))
const tagFilter = ref(normalizeFilterValues(cfg.tagFilter))
const dateFilterPreset = ref<DateFilterPreset>(cfg.dateFilterPreset ?? 'all')
const dateFilterCustomStart = ref(cfg.dateFilterCustomStart ?? '')
const dateFilterCustomEnd = ref(cfg.dateFilterCustomEnd ?? '')
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
      dateFilterPreset: dateFilterPreset.value,
      dateFilterCustomStart: dateFilterCustomStart.value,
      dateFilterCustomEnd: dateFilterCustomEnd.value,
      sortKey: sortKey.value,
      sortDir: sortDir.value,
      statusColors: statusColors.value,
      priorityColors: priorityColors.value,
      tagColors: tagColors.value,
    })
  }, 400)
}
watch(
  [
    search,
    statusFilter,
    priorityFilter,
    tagFilter,
    dateFilterPreset,
    dateFilterCustomStart,
    dateFilterCustomEnd,
    sortKey,
    sortDir,
  ],
  schedulePersist,
)
watch([statusColors, priorityColors, tagColors], schedulePersist, { deep: true })

const statusOrderByName = computed(() => {
  const map = new Map<string, number>()
  store.sortedStatuses.forEach((column, index) => map.set(column.name, index))
  return map
})

const priorityOrderById = computed(() => {
  const map = new Map<string, number>()
  store.sortedPriorities.forEach((priority, index) => map.set(priority.name, index))
  return map
})

const statusFilterOptions = computed(() =>
  store.sortedStatuses.map((column) => ({ value: column.name, label: column.name })),
)
const priorityFilterOptions = computed(() =>
  store.sortedPriorities.map((priority) => ({
    value: priority.name,
    label: priorityLabel(priority.name),
  })),
)
const tagFilterOptions = computed(() => store.allTags.map((tag) => ({ value: tag, label: tag })))

// Every status/priority's resolved color, keyed by name — not just the
// current row's own status/priority like resolveColor's usual call site,
// since the dropdown for inline editing (and the filter selects) need to
// render every option as its own colored badge, matching how that same
// status/priority already renders in the table body.
const statusColorMap = computed(() => {
  const map: Record<string, TagColorKey | undefined> = {}
  for (const status of store.sortedStatuses) {
    map[status.name] = resolveColor(status.name, store.statuses, statusColors.value)
  }
  return map
})
const priorityColorMap = computed(() => {
  const map: Record<string, TagColorKey | undefined> = {}
  for (const priority of store.sortedPriorities) {
    map[priority.name] = resolveColor(priority.name, store.priorities, priorityColors.value)
  }
  return map
})

// Same options minus the "all" sentinel — for editing a single item's
// status/priority inline in its own row, not filtering the whole table.
const statusOptions = computed(() =>
  store.sortedStatuses.map((column) => ({ value: column.name, label: column.name })),
)
const priorityOptions = computed(() =>
  store.sortedPriorities.map((priority) => ({
    value: priority.name,
    label: priorityLabel(priority.name),
  })),
)

const dateFilterRange = computed(() =>
  resolveDateFilterRange(dateFilterPreset.value, {
    start: dateFilterCustomStart.value,
    end: dateFilterCustomEnd.value,
  }),
)

const filteredItems = computed(() => {
  const query = search.value.trim().toLowerCase()
  return store.items.filter((item) => {
    if (statusFilter.value.length && !statusFilter.value.includes(item.status)) return false
    if (priorityFilter.value.length && !priorityFilter.value.includes(item.priority)) return false
    if (tagFilter.value.length && !tagFilter.value.some((tag) => item.tags.includes(tag)))
      return false
    if (
      dateFilterRange.value &&
      !itemMatchesDateRange(item.startDate, item.dueDate, dateFilterRange.value)
    )
      return false
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
        (statusOrderByName.value.get(a.status) ?? 0) - (statusOrderByName.value.get(b.status) ?? 0)
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

// This view's color wins over the global one — see resolveColor. Tag colors
// are merged into one map up front (rather than resolved per-row) since
// WorkItemRow takes a single tagColors map and looks up each of an item's
// tags from it.
const effectiveTagColors = computed(() => {
  const map: Record<string, TagColorKey> = {}
  for (const name of store.allTags) {
    const color = resolveColor(name, store.tags, tagColors.value)
    if (color) map[name] = color
  }
  return map
})

// Assigning a per-view color is the moment a tag becomes significant enough
// to be worth remembering — registers it into tags.json so it keeps
// existing (and shows up for future coloring) even if every item wearing it
// is later retagged or deleted. Global tag colors register themselves this
// same way inside store.setTagColor.
function onViewTagColorsUpdate(next: Record<string, TagColorKey>): void {
  tagColors.value = next
  for (const tagName of Object.keys(next)) {
    store.ensureTagRegistered(tagName)
  }
}

// Same rule as ItemDetailView's own submit / the color-settings tag flow:
// register any newly-picked tag before saving so it persists (tags.json)
// even if every item wearing it is later retagged or deleted. Sequential,
// not Promise.all — see ItemDetailView.vue's handleSubmit for why
// concurrent registrations of more than one new tag would race.
async function handleInlineUpdate(
  id: string,
  patch: Partial<Pick<WorkItem, 'status' | 'priority' | 'tags'>>,
): Promise<void> {
  if (patch.tags) {
    for (const tagName of patch.tags) {
      await store.ensureTagRegistered(tagName)
    }
  }
  await store.updateItem(id, patch)
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
        <MultiSelectMenu
          v-model="statusFilter"
          :options="statusFilterOptions"
          :all-label="t('list.allStatus')"
        >
          <template #option="{ option }">
            <StatusBadge :name="option.label" :color="statusColorMap[option.value]" />
          </template>
        </MultiSelectMenu>
        <MultiSelectMenu
          v-model="priorityFilter"
          :options="priorityFilterOptions"
          :all-label="t('list.allPriority')"
        >
          <template #option="{ option }">
            <PriorityBadge :priority="option.value" :color="priorityColorMap[option.value]" />
          </template>
        </MultiSelectMenu>
        <MultiSelectMenu
          v-model="tagFilter"
          :options="tagFilterOptions"
          :all-label="t('list.allTags')"
        >
          <template #option="{ option }">
            <TagPill :label="option.label" :color="effectiveTagColors[option.value]" />
          </template>
        </MultiSelectMenu>
        <DateFilter
          v-model:preset="dateFilterPreset"
          v-model:custom-start="dateFilterCustomStart"
          v-model:custom-end="dateFilterCustomEnd"
        />
      </div>
      <div class="toolbar-actions">
        <button
          type="button"
          class="btn btn-ghost action-btn"
          :title="t('colorSettings.trigger')"
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

    <ColorSettings
      :open="settingsOpen"
      :statuses="store.sortedStatuses"
      :priorities="store.sortedPriorities"
      :tag-names="store.allTags"
      :tag-registry="store.tags"
      :view-status-colors="statusColors"
      :view-priority-colors="priorityColors"
      :view-tag-colors="tagColors"
      @update:view-status-colors="(v) => (statusColors = v)"
      @update:view-priority-colors="(v) => (priorityColors = v)"
      @update:view-tag-colors="onViewTagColorsUpdate"
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
              :status-name="item.status || t('list.noStatus')"
              :is-completed="store.isItemCompleted(item)"
              :status-color="resolveColor(item.status, store.statuses, statusColors)"
              :priority-color="resolveColor(item.priority, store.priorities, priorityColors)"
              :tag-colors="effectiveTagColors"
              :status-options="statusOptions"
              :priority-options="priorityOptions"
              :status-color-map="statusColorMap"
              :priority-color-map="priorityColorMap"
              :all-tags="store.allTags"
              @delete="requestDelete"
              @update="handleInlineUpdate"
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
  /* overflow-x: auto, not hidden — a row with enough tags/long text can
     make the table wider than the card, and `hidden` was silently clipping
     that content off the right edge instead of letting it scroll into
     view. overflow-y stays hidden so the card's own rounded top/bottom
     corners still clip the table's square ones. */
  overflow-x: auto;
  overflow-y: hidden;
}

.table {
  width: 100%;
  /* `width: 100%` alone lets an auto-layout table shrink its columns
     indefinitely to fit the card, which is what was defeating
     `.table-card`'s own `overflow-x: auto` above — the table never
     actually exceeded its container, it just squeezed every column
     (long titles/many tags truncating hard) instead. `min-width:
     max-content` puts a floor at the table's natural, unconstrained
     width, so once real content demands more room than the card has, the
     table genuinely overflows and the card scrolls instead of squeezing
     forever. */
  min-width: max-content;
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

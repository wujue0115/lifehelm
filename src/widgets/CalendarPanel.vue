<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useWorkItemsStore } from '@/stores/workItems'
import type { Priority, WorkItem } from '@/types/work-item'
import type { CalendarViewConfig, ViewConfig } from '@/types/view'
import type { TagColorKey } from '@/config/tagColors'
import { getDueStatus } from '@/utils/dueDate'
import { resolveColor } from '@/utils/colors'
import { buildMonthWeeks, startOfMonth, type CalendarCell } from '@/utils/calendarGrid'
import { usePriorityLabel } from '@/composables/usePriorityLabel'
import ChevronIcon from '@/components/ChevronIcon.vue'
import ActionIcon from '@/components/ActionIcon.vue'
import ColorSettings from '@/components/ColorSettings.vue'
import DateFilter from '@/components/DateFilter.vue'
import { resolveDateFilterRange, itemMatchesDateRange } from '@/utils/dateFilterPresets'
import type { DateFilterPreset } from '@/utils/dateFilterPresets'

interface DateRange {
  fromKey: string
  toKey: string
}

interface Segment {
  item: WorkItem
  startCol: number
  endCol: number
  lane: number
  isRangeStart: boolean
  isRangeEnd: boolean
  status: string
  color?: TagColorKey
}

const props = defineProps<{ instanceId: string; config?: ViewConfig }>()
const emit = defineEmits<{ 'update:config': [ViewConfig] }>()

const { t, locale } = useI18n()
const store = useWorkItemsStore()
const priorityLabel = usePriorityLabel()

// Only status resolves to a visible tint here — a bar-segment is one pill
// per item, unlike a card's separate status/priority/tag badges, so there's
// no room to show all three independently. Priority/tag colors are still
// configurable in this same dialog (for consistency with List/Board) but
// don't currently paint anything on the calendar.
const cfg = (props.config ?? {}) as Partial<CalendarViewConfig>
const statusColors = ref<Record<string, TagColorKey>>({ ...cfg.statusColors })
const priorityColors = ref<Partial<Record<Priority, TagColorKey>>>({ ...cfg.priorityColors })
const tagColors = ref<Record<string, TagColorKey>>({ ...cfg.tagColors })
const settingsOpen = ref(false)
const search = ref(cfg.search ?? '')
const statusFilter = ref(cfg.statusFilter ?? 'all')
const priorityFilter = ref(cfg.priorityFilter ?? 'all')
const tagFilter = ref(cfg.tagFilter ?? 'all')
const dateFilterPreset = ref<DateFilterPreset>(cfg.dateFilterPreset ?? 'all')
const dateFilterCustomStart = ref(cfg.dateFilterCustomStart ?? '')
const dateFilterCustomEnd = ref(cfg.dateFilterCustomEnd ?? '')

let persistTimer: ReturnType<typeof setTimeout> | undefined
function schedulePersist(): void {
  clearTimeout(persistTimer)
  persistTimer = setTimeout(() => {
    emit('update:config', {
      statusColors: statusColors.value,
      priorityColors: priorityColors.value,
      tagColors: tagColors.value,
      search: search.value,
      statusFilter: statusFilter.value,
      priorityFilter: priorityFilter.value,
      tagFilter: tagFilter.value,
      dateFilterPreset: dateFilterPreset.value,
      dateFilterCustomStart: dateFilterCustomStart.value,
      dateFilterCustomEnd: dateFilterCustomEnd.value,
    })
  }, 400)
}
watch([statusColors, priorityColors, tagColors], schedulePersist, { deep: true })
watch(
  [
    search,
    statusFilter,
    priorityFilter,
    tagFilter,
    dateFilterPreset,
    dateFilterCustomStart,
    dateFilterCustomEnd,
  ],
  schedulePersist,
)

const dateFilterRange = computed(() =>
  resolveDateFilterRange(dateFilterPreset.value, {
    start: dateFilterCustomStart.value,
    end: dateFilterCustomEnd.value,
  }),
)

// Same filter semantics as ListPanel/BoardPanel — narrows which items can
// appear as bar-segments.
const filteredItems = computed(() => {
  const query = search.value.trim().toLowerCase()
  return store.items.filter((item) => {
    if (statusFilter.value !== 'all' && item.status !== statusFilter.value) return false
    if (priorityFilter.value !== 'all' && item.priority !== priorityFilter.value) return false
    if (tagFilter.value !== 'all' && !item.tags.includes(tagFilter.value)) return false
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

// Same rule as ListPanel/BoardPanel: assigning a per-view tag color
// registers the tag so it keeps existing even after every item wearing it
// is retagged or deleted.
function onViewTagColorsUpdate(next: Record<string, TagColorKey>): void {
  tagColors.value = next
  for (const tagName of Object.keys(next)) {
    store.ensureTagRegistered(tagName)
  }
}

onMounted(() => {
  store.fetchAll()
})

const currentMonth = ref(startOfMonth(new Date()))

const monthLabel = computed(() =>
  currentMonth.value.toLocaleDateString(locale.value, { year: 'numeric', month: 'long' }),
)

function prevMonth(): void {
  const current = currentMonth.value
  currentMonth.value = new Date(current.getFullYear(), current.getMonth() - 1, 1)
}

function nextMonth(): void {
  const current = currentMonth.value
  currentMonth.value = new Date(current.getFullYear(), current.getMonth() + 1, 1)
}

function goToday(): void {
  currentMonth.value = startOfMonth(new Date())
}

const weeks = computed(() => buildMonthWeeks(currentMonth.value))

function itemDateRange(item: WorkItem): DateRange | null {
  if (!item.startDate && !item.dueDate) return null
  const startKey = (item.startDate ?? item.dueDate)!.slice(0, 10)
  const endKey = (item.dueDate ?? item.startDate)!.slice(0, 10)
  return startKey <= endKey
    ? { fromKey: startKey, toKey: endKey }
    : { fromKey: endKey, toKey: startKey }
}

function buildWeekSegments(week: CalendarCell[]): Segment[] {
  const weekStartKey = week[0]?.key
  const weekEndKey = week[6]?.key
  if (!weekStartKey || !weekEndKey) return []

  const raw: Omit<Segment, 'lane'>[] = []
  for (const item of filteredItems.value) {
    const range = itemDateRange(item)
    if (!range) continue
    if (range.toKey < weekStartKey || range.fromKey > weekEndKey) continue

    const clippedFrom = range.fromKey < weekStartKey ? weekStartKey : range.fromKey
    const clippedTo = range.toKey > weekEndKey ? weekEndKey : range.toKey
    const startCol = week.findIndex((cell) => cell.key === clippedFrom)
    const endCol = week.findIndex((cell) => cell.key === clippedTo)
    if (startCol === -1 || endCol === -1) continue

    raw.push({
      item,
      startCol,
      endCol,
      isRangeStart: clippedFrom === range.fromKey,
      isRangeEnd: clippedTo === range.toKey,
      status: getDueStatus(item.dueDate, store.isItemCompleted(item)),
      color: resolveColor(item.status, store.statuses, statusColors.value),
    })
  }

  raw.sort((a, b) => a.startCol - b.startCol || b.endCol - b.startCol - (a.endCol - a.startCol))

  const laneEnds: number[] = []
  const segments: Segment[] = []
  for (const seg of raw) {
    let lane = 0
    while (laneEnds[lane] !== undefined && (laneEnds[lane] as number) >= seg.startCol) lane++
    laneEnds[lane] = seg.endCol
    segments.push({ ...seg, lane })
  }
  return segments
}

const weekSegments = computed<Segment[][]>(() => weeks.value.map((week) => buildWeekSegments(week)))

function laneCount(segments: Segment[]): number {
  return segments.reduce((max, seg) => Math.max(max, seg.lane + 1), 0)
}

const weekdayLabels = computed(() => {
  // 'narrow' is unambiguous in zh-TW (單字：日一二三四五六) but collides in English
  // (S/M/T/W/T/F/S can't distinguish Tue from Thu), so English uses 'short' instead.
  const width = locale.value === 'zh-TW' ? 'narrow' : 'short'
  const formatter = new Intl.DateTimeFormat(locale.value, { weekday: width })
  // 1970-01-04 was a Sunday — a stable reference week, locale-independent.
  return Array.from({ length: 7 }, (_, i) => formatter.format(new Date(1970, 0, 4 + i)))
})
</script>

<template>
  <div class="calendar-panel">
    <div class="filters">
      <input
        v-model="search"
        class="input type-body"
        type="text"
        :placeholder="t('list.searchPlaceholder')"
      />
      <select v-model="statusFilter" class="input type-body">
        <option value="all">{{ t('list.allStatus') }}</option>
        <option v-for="column in store.sortedStatuses" :key="column.id" :value="column.name">
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
      <DateFilter
        v-model:preset="dateFilterPreset"
        v-model:custom-start="dateFilterCustomStart"
        v-model:custom-end="dateFilterCustomEnd"
      />
    </div>

    <div class="toolbar">
      <button type="button" class="btn btn-secondary" @click="prevMonth">
        <ChevronIcon direction="prev" />
        <span class="icon-label">{{ t('calendar.prevMonth') }}</span>
      </button>
      <span class="type-body month-label">{{ monthLabel }}</span>
      <button type="button" class="btn btn-secondary" @click="nextMonth">
        <span class="icon-label">{{ t('calendar.nextMonth') }}</span>
        <ChevronIcon direction="next" />
      </button>
      <button type="button" class="btn btn-primary" @click="goToday">
        {{ t('calendar.today') }}
      </button>
      <button
        type="button"
        class="btn-ghost action-btn"
        :title="t('colorSettings.trigger')"
        @click="settingsOpen = true"
      >
        <ActionIcon type="settings" />
      </button>
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
    <template v-else>
      <div class="weekday-row">
        <span v-for="label in weekdayLabels" :key="label" class="type-label weekday">{{
          label
        }}</span>
      </div>
      <div class="calendar">
        <div
          v-for="(week, weekIndex) in weeks"
          :key="week[0]?.key ?? weekIndex"
          class="week"
          :style="{
            gridTemplateRows: `28px repeat(${laneCount(weekSegments[weekIndex] ?? [])}, 22px) minmax(0, 1fr)`,
          }"
        >
          <div
            v-for="(cell, dayIndex) in week"
            :key="cell.key"
            class="day-bg"
            :class="{ 'out-of-month': !cell.inMonth, today: cell.isToday }"
            :style="{
              gridColumn: dayIndex + 1,
              gridRow: `1 / span ${laneCount(weekSegments[weekIndex] ?? []) + 2}`,
            }"
          >
            <span class="type-caption day-number">{{ cell.date.getDate() }}</span>
          </div>

          <RouterLink
            v-for="(segment, segIndex) in weekSegments[weekIndex] ?? []"
            :key="`${segment.item.id}-${segIndex}`"
            :to="`/items/${segment.item.id}`"
            class="type-caption bar-segment"
            :class="[
              segment.status,
              {
                'cap-start': segment.isRangeStart,
                'cap-end': segment.isRangeEnd,
                colored: segment.color,
              },
            ]"
            :style="{
              gridColumn: `${segment.startCol + 1} / ${segment.endCol + 2}`,
              gridRow: segment.lane + 2,
              ...(segment.color ? { '--badge-color': `var(--tag-color-${segment.color})` } : {}),
            }"
          >
            {{ segment.item.title }}
          </RouterLink>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.calendar-panel {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  min-height: 0;
}

.filters {
  display: flex;
  gap: var(--space-xs);
  flex-wrap: wrap;
  margin-bottom: var(--space-sm);
  flex-shrink: 0;
}

.filters .input {
  min-width: 140px;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
  flex-wrap: wrap;
  flex-shrink: 0;
}

.month-label {
  font-weight: 700;
  min-width: 120px;
  text-align: center;
}

.weekday-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: var(--space-xs);
  flex-shrink: 0;
}

.weekday {
  text-align: center;
  color: var(--color-ink-secondary);
}

/* flex:1 on both this and .week below is what spreads any extra height the
   widget has beyond the calendar's natural content size evenly across
   every week row (and so every day cell, which shares its week's height) —
   instead of leaving it as dead space under the grid. */
.calendar {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  background: var(--color-canvas-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--rounded-md);
  overflow: hidden;
}

.week {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  column-gap: 0;
  row-gap: 4px;
  border-top: 1px solid var(--color-border-subtle);
  flex: 1 1 auto;
  min-height: 0;
}

.week:first-child {
  border-top: none;
}

.day-bg {
  border-right: 1px solid var(--color-border-subtle);
  padding: 4px;
}

.day-bg:last-child {
  border-right: none;
}

.day-bg.out-of-month {
  opacity: 0.4;
}

.day-bg.today .day-number {
  font-weight: 700;
  color: var(--color-ink);
}

.day-number {
  color: var(--color-ink-muted);
}

.bar-segment {
  align-self: center;
  background: var(--color-canvas-app);
  color: var(--color-ink);
  text-decoration: none;
  padding: 2px 4px;
  margin: 0 2px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.bar-segment.cap-start {
  border-top-left-radius: var(--rounded-full);
  border-bottom-left-radius: var(--rounded-full);
  margin-left: 4px;
  padding-left: 8px;
}

.bar-segment.cap-end {
  border-top-right-radius: var(--rounded-full);
  border-bottom-right-radius: var(--rounded-full);
  margin-right: 4px;
}

.bar-segment.overdue {
  background: var(--color-ink);
  color: var(--color-canvas-surface);
}

.bar-segment.due-today {
  border: 1px solid var(--color-ink);
}

/* Opt-in per-item status tint — see StatusBadge.vue for the rationale.
   Comes after .overdue/.due-today so an explicitly assigned color always
   wins over the grayscale due-date escalation. */
.bar-segment.colored {
  background: color-mix(in srgb, var(--badge-color) 16%, var(--color-canvas-surface));
  border: 1px solid color-mix(in srgb, var(--badge-color) 55%, var(--color-border-strong));
  color: var(--color-ink);
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  min-height: auto;
  margin-left: auto;
}
</style>

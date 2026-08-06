<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useWorkItemsStore } from '@/stores/workItems'
import type { WorkItem } from '@/types/work-item'
import { getDueStatus } from '@/utils/dueDate'

interface CalendarCell {
  date: Date
  key: string
  inMonth: boolean
  isToday: boolean
}

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
}

const store = useWorkItemsStore()

onMounted(() => {
  store.fetchAll()
})

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function dateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const currentMonth = ref(startOfMonth(new Date()))

const monthLabel = computed(() =>
  currentMonth.value.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long' }),
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

const calendarCells = computed<CalendarCell[]>(() => {
  const first = currentMonth.value
  const year = first.getFullYear()
  const month = first.getMonth()
  const firstWeekday = first.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayKey = dateKey(new Date())

  const cells: CalendarCell[] = []
  for (let i = firstWeekday; i > 0; i--) {
    const date = new Date(year, month, 1 - i)
    cells.push({ date, key: dateKey(date), inMonth: false, isToday: dateKey(date) === todayKey })
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    cells.push({ date, key: dateKey(date), inMonth: true, isToday: dateKey(date) === todayKey })
  }
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1]
    if (!last) break
    const date = new Date(last.date.getFullYear(), last.date.getMonth(), last.date.getDate() + 1)
    cells.push({ date, key: dateKey(date), inMonth: false, isToday: dateKey(date) === todayKey })
  }
  return cells
})

const weeks = computed<CalendarCell[][]>(() => {
  const cells = calendarCells.value
  const result: CalendarCell[][] = []
  for (let i = 0; i < cells.length; i += 7) result.push(cells.slice(i, i + 7))
  return result
})

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
  for (const item of store.items) {
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

const weekdayLabels = ['日', '一', '二', '三', '四', '五', '六']
</script>

<template>
  <main class="calendar-view">
    <div class="toolbar">
      <button type="button" class="btn btn-secondary" @click="prevMonth">‹ 上個月</button>
      <span class="type-body month-label">{{ monthLabel }}</span>
      <button type="button" class="btn btn-secondary" @click="nextMonth">下個月 ›</button>
      <button type="button" class="btn btn-primary" @click="goToday">今天</button>
    </div>

    <p v-if="store.loading" class="type-body">載入中…</p>
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
            gridTemplateRows: `28px repeat(${laneCount(weekSegments[weekIndex] ?? [])}, 22px)`,
          }"
        >
          <div
            v-for="(cell, dayIndex) in week"
            :key="cell.key"
            class="day-bg"
            :class="{ 'out-of-month': !cell.inMonth, today: cell.isToday }"
            :style="{
              gridColumn: dayIndex + 1,
              gridRow: `1 / span ${laneCount(weekSegments[weekIndex] ?? []) + 1}`,
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
              { 'cap-start': segment.isRangeStart, 'cap-end': segment.isRangeEnd },
            ]"
            :style="{
              gridColumn: `${segment.startCol + 1} / ${segment.endCol + 2}`,
              gridRow: segment.lane + 2,
            }"
          >
            {{ segment.item.title }}
          </RouterLink>
        </div>
      </div>
    </template>
  </main>
</template>

<style scoped>
.calendar-view {
  padding: var(--space-xl);
}

.toolbar {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
  flex-wrap: wrap;
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
}

.weekday {
  text-align: center;
  color: var(--color-ink-secondary);
}

.calendar {
  display: flex;
  flex-direction: column;
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
</style>

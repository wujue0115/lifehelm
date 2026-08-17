<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { buildMonthWeeks, startOfMonth } from '@/utils/calendarGrid'
import ChevronIcon from './ChevronIcon.vue'

// Single mode: v-model="value" (a 'YYYY-MM-DD' string, '' for no date).
// Range mode: v-model:start="..." + v-model:end="..." — two independent
// 'YYYY-MM-DD' strings, matching the same empty-string-means-unset contract
// so callers (e.g. ItemDetailView's form.startDate/dueDate) don't need to
// change shape to adopt this component.
//
// `inline` (used by DateFilter.vue's embedded custom-range calendar) skips
// the trigger/popover/footer chrome entirely and renders just the nav+grid
// as a plain block, always visible. It also drops the "stage, then Confirm"
// gating below — every pick emits immediately — because in that mode a
// *different* component (DateFilter's own popover) already owns the
// stage/confirm gate; the calendar is a live-bound input, not its own
// pending transaction.
const props = withDefaults(
  defineProps<{
    mode?: 'single' | 'range'
    modelValue?: string
    start?: string
    end?: string
    placeholder?: string
    inline?: boolean
  }>(),
  { mode: 'single', modelValue: '', start: '', end: '', inline: false },
)
const emit = defineEmits<{
  'update:modelValue': [string]
  'update:start': [string]
  'update:end': [string]
}>()

const { t, locale } = useI18n()

const open = ref(false)
const wrapperEl = ref<HTMLElement | null>(null)
const hoverKey = ref<string | null>(null)
// Both modes preview the clicked day(s) here without committing — only
// confirm() emits, so clicking around and then closing without pressing
// Confirm (outside click, Escape) discards the preview.
const pendingSingle = ref('')
const pendingStart = ref('')
const pendingEnd = ref('')

function seedDate(): string {
  return (props.mode === 'range' ? props.start || props.end : props.modelValue) || ''
}

const viewMonth = ref(startOfMonth(seedDate() ? new Date(`${seedDate()}T00:00:00`) : new Date()))

// Three drill levels, like every standard calendar picker: day grid is the
// default; clicking the header label drills up to a month grid (12 months
// of the current year), and again to a year grid (a 12-year block) — each
// pick drills back down one level instead of straight to the day grid, so
// picking a distant year still lands you on its month grid, not a random
// month.
const viewMode = ref<'day' | 'month' | 'year'>('day')

const weeks = computed(() => buildMonthWeeks(viewMonth.value))
const weekdayLabels = computed(() => {
  // Same locale-width choice as CalendarPanel.vue: 'narrow' collides for
  // English weekdays (Tue/Thu both start with T), 'short' doesn't.
  const width = locale.value === 'zh-TW' ? 'narrow' : 'short'
  const formatter = new Intl.DateTimeFormat(locale.value, { weekday: width })
  return Array.from({ length: 7 }, (_, i) => formatter.format(new Date(1970, 0, 4 + i)))
})
const monthOptionLabels = computed(() => {
  const formatter = new Intl.DateTimeFormat(locale.value, { month: 'short' })
  return Array.from({ length: 12 }, (_, i) => formatter.format(new Date(2000, i, 1)))
})
// A 12-year block (matches the 12-month grid's layout) containing the
// currently displayed year.
const yearBlockStart = computed(() => Math.floor(viewMonth.value.getFullYear() / 12) * 12)
const yearOptions = computed(() => Array.from({ length: 12 }, (_, i) => yearBlockStart.value + i))

// Real today, distinct from `.current` (which marks the month/year the day
// grid is currently drilled into, not necessarily today's).
const realToday = new Date()
function isThisMonth(monthIndex: number): boolean {
  return (
    viewMonth.value.getFullYear() === realToday.getFullYear() && monthIndex === realToday.getMonth()
  )
}
function isThisYear(year: number): boolean {
  return year === realToday.getFullYear()
}

// Month and year are independently clickable in the day-grid header, so
// jumping to the year grid doesn't require drilling through the month grid
// first. yearLabel is reused as the month-grid header's own year button.
const monthLabel = computed(() =>
  viewMonth.value.toLocaleDateString(locale.value, { month: 'long' }),
)
const yearLabel = computed(() => String(viewMonth.value.getFullYear()))
const yearBlockLabel = computed(() => `${yearBlockStart.value} – ${yearBlockStart.value + 11}`)

function headerPrev(): void {
  const c = viewMonth.value
  if (viewMode.value === 'day') viewMonth.value = new Date(c.getFullYear(), c.getMonth() - 1, 1)
  else if (viewMode.value === 'month')
    viewMonth.value = new Date(c.getFullYear() - 1, c.getMonth(), 1)
  else viewMonth.value = new Date(c.getFullYear() - 12, c.getMonth(), 1)
}
function headerNext(): void {
  const c = viewMonth.value
  if (viewMode.value === 'day') viewMonth.value = new Date(c.getFullYear(), c.getMonth() + 1, 1)
  else if (viewMode.value === 'month')
    viewMonth.value = new Date(c.getFullYear() + 1, c.getMonth(), 1)
  else viewMonth.value = new Date(c.getFullYear() + 12, c.getMonth(), 1)
}
function selectMonth(monthIndex: number): void {
  viewMonth.value = new Date(viewMonth.value.getFullYear(), monthIndex, 1)
  viewMode.value = 'day'
}
function selectYear(year: number): void {
  viewMonth.value = new Date(year, viewMonth.value.getMonth(), 1)
  viewMode.value = 'month'
}
function goToday(): void {
  viewMonth.value = startOfMonth(new Date())
  viewMode.value = 'day'
}

function formatDisplay(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString(locale.value)
}

const triggerLabel = computed(() => {
  if (props.mode === 'range') {
    if (props.start && props.end)
      return `${formatDisplay(props.start)} – ${formatDisplay(props.end)}`
    if (props.start) return formatDisplay(props.start)
    return ''
  }
  return props.modelValue ? formatDisplay(props.modelValue) : ''
})

function toggleOpen(): void {
  if (!open.value) {
    viewMonth.value = startOfMonth(seedDate() ? new Date(`${seedDate()}T00:00:00`) : new Date())
    viewMode.value = 'day'
    pendingSingle.value = props.modelValue
    pendingStart.value = props.start
    pendingEnd.value = props.end
  }
  open.value = !open.value
}

// Inline mode has no open/close cycle to re-seed pending state on (see
// toggleOpen above) — the caller can still push a new value in at any time
// (DateFilter.vue does, e.g. when a preset changes what the calendar should
// preview), so mirror it into pending* reactively instead. Not `immediate`:
// the ref initializers above already seed the initial value once at setup.
if (props.inline) {
  watch(
    () => [props.start, props.end, props.modelValue] as const,
    ([start, end, modelValue]) => {
      pendingSingle.value = modelValue
      pendingStart.value = start
      pendingEnd.value = end
    },
  )
}

function close(): void {
  open.value = false
}

// Standard "focus left the whole widget" check — relatedTarget is whatever
// element is about to receive focus. Every interactive element inside the
// popover uses @mousedown.prevent (see template), which keeps focus pinned
// on the trigger button throughout, so this really only fires for genuine
// outside clicks/tabs, not for day/nav button presses.
function handleFocusOut(event: FocusEvent): void {
  const next = event.relatedTarget as Node | null
  if (!next || !wrapperEl.value?.contains(next)) close()
}

// Range picking: the first click after a complete (or empty) range starts a
// fresh selection (sets start, clears end); the next click completes it
// (sets end, auto-swapped into order if picked before start). Non-inline:
// neither click emits — only confirm() does, so the range isn't saved until
// the user presses Confirm. Inline: every click emits right away (see the
// class comment on `inline` above for why that's safe).
function selectDay(key: string): void {
  if (props.mode === 'single') {
    pendingSingle.value = key
    if (props.inline) emit('update:modelValue', pendingSingle.value)
    return
  }
  const pickingEnd = pendingStart.value && !pendingEnd.value
  if (pickingEnd) {
    if (key < pendingStart.value) {
      pendingEnd.value = pendingStart.value
      pendingStart.value = key
    } else {
      pendingEnd.value = key
    }
  } else {
    pendingStart.value = key
    pendingEnd.value = ''
  }
  if (props.inline) {
    emit('update:start', pendingStart.value)
    emit('update:end', pendingEnd.value)
  }
}

function confirm(): void {
  if (props.mode === 'single') {
    emit('update:modelValue', pendingSingle.value)
  } else {
    // Confirming with only a start picked (no end yet) is a valid one-day
    // range, not an incomplete one — it just means start and end are the
    // same day.
    emit('update:start', pendingStart.value)
    emit('update:end', pendingEnd.value || pendingStart.value)
  }
  close()
}

function clear(): void {
  if (props.mode === 'single') {
    pendingSingle.value = ''
    emit('update:modelValue', '')
  } else {
    pendingStart.value = ''
    pendingEnd.value = ''
    emit('update:start', '')
    emit('update:end', '')
  }
  close()
}

type CellState =
  | 'selected'
  | 'range-start'
  | 'range-start-solo'
  | 'range-end'
  | 'in-range'
  | 'preview'
  | null

function cellState(key: string): CellState {
  if (props.mode === 'single') {
    return key === pendingSingle.value ? 'selected' : null
  }
  // A start pick with no *other* day to connect to isn't a band — it's
  // just one selected day, so it gets the full rounded-square shape instead
  // of the flat "open" edge that signals more days to come. That covers a
  // lone start (no end, no hover-preview) as well as a same-day double-click
  // (start and end picked as the same date — a one-day range, still just
  // one cell wide).
  if (pendingStart.value && key === pendingStart.value) {
    const hasBand =
      (Boolean(pendingEnd.value) && pendingEnd.value !== pendingStart.value) ||
      (hoverKey.value !== null && hoverKey.value !== pendingStart.value)
    return hasBand ? 'range-start' : 'range-start-solo'
  }
  if (pendingEnd.value && key === pendingEnd.value) return 'range-end'
  if (pendingStart.value && pendingEnd.value && key > pendingStart.value && key < pendingEnd.value)
    return 'in-range'
  if (pendingStart.value && !pendingEnd.value && hoverKey.value) {
    const lo = pendingStart.value < hoverKey.value ? pendingStart.value : hoverKey.value
    const hi = pendingStart.value < hoverKey.value ? hoverKey.value : pendingStart.value
    if (key === hoverKey.value || (key > lo && key < hi)) return 'preview'
  }
  return null
}

type GridCellState = 'selected' | 'range-start' | 'range-end' | 'in-range' | null

// Same precedence as cellState above (start wins over end, e.g. a
// same-month start+end both just read as range-start), just compared at
// month/year granularity instead of exact day, so the pending pick(s) stay
// visible after drilling up from the day grid.
function monthCellState(monthIndex: number): GridCellState {
  const key = `${viewMonth.value.getFullYear()}-${String(monthIndex + 1).padStart(2, '0')}`
  return granularCellState(key, (d) => d.slice(0, 7))
}
function yearCellState(year: number): GridCellState {
  return granularCellState(String(year), (d) => d.slice(0, 4))
}
function granularCellState(key: string, toGranular: (dateKey: string) => string): GridCellState {
  if (props.mode === 'single') {
    return pendingSingle.value && toGranular(pendingSingle.value) === key ? 'selected' : null
  }
  if (pendingStart.value && toGranular(pendingStart.value) === key) return 'range-start'
  if (pendingEnd.value && toGranular(pendingEnd.value) === key) return 'range-end'
  if (pendingStart.value && pendingEnd.value) {
    const lo = toGranular(pendingStart.value)
    const hi = toGranular(pendingEnd.value)
    if (key > lo && key < hi) return 'in-range'
  }
  return null
}
</script>

<template>
  <div ref="wrapperEl" class="date-picker" @focusout="handleFocusOut" @keydown.esc="close">
    <button v-if="!inline" type="button" class="input type-body trigger" @click="toggleOpen">
      <span class="trigger-text" :class="{ placeholder: !triggerLabel }">
        {{ triggerLabel || placeholder || t('datePicker.placeholder') }}
      </span>
    </button>

    <div v-if="inline || open" class="popover" :class="{ inline }">
      <div class="nav">
        <button
          type="button"
          class="icon-btn"
          :title="t('calendar.prevMonth')"
          @mousedown.prevent
          @click="headerPrev"
        >
          <ChevronIcon direction="prev" />
        </button>
        <div class="header-labels">
          <template v-if="viewMode === 'day'">
            <button
              type="button"
              class="header-label type-body-sm clickable"
              @mousedown.prevent
              @click="viewMode = 'month'"
            >
              {{ monthLabel }}
            </button>
            <button
              type="button"
              class="header-label type-body-sm clickable"
              @mousedown.prevent
              @click="viewMode = 'year'"
            >
              {{ yearLabel }}
            </button>
          </template>
          <button
            v-else-if="viewMode === 'month'"
            type="button"
            class="header-label type-body-sm clickable"
            @mousedown.prevent
            @click="viewMode = 'year'"
          >
            {{ yearLabel }}
          </button>
          <span v-else class="header-label type-body-sm">{{ yearBlockLabel }}</span>
        </div>
        <button
          type="button"
          class="icon-btn"
          :title="t('calendar.nextMonth')"
          @mousedown.prevent
          @click="headerNext"
        >
          <ChevronIcon direction="next" />
        </button>
      </div>

      <template v-if="viewMode === 'day'">
        <div class="weekday-row">
          <span v-for="label in weekdayLabels" :key="label" class="type-caption weekday">{{
            label
          }}</span>
        </div>

        <div class="grid">
          <button
            v-for="cell in weeks.flat()"
            :key="cell.key"
            type="button"
            class="day type-body-sm"
            :class="[cellState(cell.key), { 'out-of-month': !cell.inMonth, today: cell.isToday }]"
            @mousedown.prevent
            @mouseenter="hoverKey = cell.key"
            @click="selectDay(cell.key)"
          >
            {{ cell.date.getDate() }}
          </button>
        </div>
      </template>

      <div v-else-if="viewMode === 'month'" class="grid grid-12">
        <button
          v-for="(label, index) in monthOptionLabels"
          :key="label"
          type="button"
          class="cell type-body-sm"
          :class="[
            monthCellState(index),
            { current: index === viewMonth.getMonth(), 'this-month': isThisMonth(index) },
          ]"
          @mousedown.prevent
          @click="selectMonth(index)"
        >
          {{ label }}
        </button>
      </div>

      <div v-else class="grid grid-12">
        <button
          v-for="year in yearOptions"
          :key="year"
          type="button"
          class="cell type-body-sm"
          :class="[
            yearCellState(year),
            { current: year === viewMonth.getFullYear(), 'this-year': isThisYear(year) },
          ]"
          @mousedown.prevent
          @click="selectYear(year)"
        >
          {{ year }}
        </button>
      </div>

      <div v-if="!inline" class="footer">
        <div class="footer-left">
          <button type="button" class="link-btn type-body-sm" @mousedown.prevent @click="goToday">
            {{ t('calendar.today') }}
          </button>
          <button type="button" class="link-btn type-body-sm" @mousedown.prevent @click="clear">
            {{ t('datePicker.clear') }}
          </button>
        </div>
        <button
          type="button"
          class="btn btn-primary confirm-btn type-body-sm"
          :disabled="mode === 'range' && !pendingStart"
          @mousedown.prevent
          @click="confirm"
        >
          {{ t('datePicker.confirm') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.date-picker {
  position: relative;
}

.trigger {
  display: block;
  width: 100%;
  text-align: left;
  cursor: pointer;
}

.trigger-text.placeholder {
  color: var(--color-ink-muted);
}

.popover {
  position: absolute;
  top: calc(100% + var(--space-xxs));
  left: 0;
  z-index: 20;
  width: 260px;
  padding: var(--space-sm);
  background: var(--color-canvas-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--rounded-md);
}

/* Inline mode (DateFilter.vue's embedded custom-range calendar) renders as
   a plain in-flow block, not a floating card — it already sits inside its
   host's own bordered popover, so a second nested border/background would
   just double up. */
.popover.inline {
  position: static;
  width: auto;
  padding: 0;
  background: none;
  border: none;
  border-radius: 0;
}

.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-xs);
}

.header-labels {
  display: flex;
  align-items: center;
  gap: var(--space-xxs);
}

.header-label {
  font-weight: 700;
  background: none;
  border: none;
  color: var(--color-ink);
  padding: 2px 6px;
  border-radius: var(--rounded-xs);
}

.header-label.clickable {
  cursor: pointer;
}

.header-label.clickable:hover {
  background: var(--color-surface-hover);
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

.icon-btn:hover {
  color: var(--color-ink);
}

.weekday-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: var(--space-xxs);
}

.weekday {
  text-align: center;
  color: var(--color-ink-secondary);
}

/* No gap — a range's in-range/preview cells need to sit flush against each
   other to read as one continuous band, not a row of separate dots. */
.grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.day {
  position: relative;
  aspect-ratio: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-radius: var(--rounded-sm);
  color: var(--color-ink);
  cursor: pointer;
}

.day:hover {
  background: var(--color-surface-hover);
}

.day.out-of-month {
  color: var(--color-ink-muted);
}

/* The range's endpoints and the path between them use accent, not the
   grayscale ink fill single-mode's .selected uses — this is a live,
   in-progress selection (closer to "current location" than to a status/
   priority/tag color-coding), the same territory .btn-primary/sidebar
   active-nav-item already use accent for. See DESIGN.md "Accent". */
.day.in-range,
.day.preview {
  background: color-mix(in srgb, var(--color-accent) 16%, var(--color-canvas-surface));
  border-radius: 0;
}

.day.selected {
  background: var(--color-ink);
  color: var(--color-canvas-surface);
  font-weight: 700;
}

.day.range-start,
.day.range-end,
.day.range-start-solo {
  background: var(--color-accent);
  color: var(--color-accent-contrast);
  font-weight: 700;
}

/* range-start-solo (a start pick with no end and no hover-preview band yet)
   deliberately doesn't flatten a corner here — .day's default all-around
   {rounded.sm} stands, since there's no adjacent band to connect to. */
.day.range-start {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.day.range-end {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

/* Month/year drill-up grids reuse .grid's column count but need 3 columns
   instead of 7 — 12 items read better as 4 rows of 3 than 2 ragged rows of
   7 (or a single cramped row of 12). */
.grid-12 {
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-xxs);
}

.cell {
  position: relative;
  aspect-ratio: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-radius: var(--rounded-sm);
  color: var(--color-ink);
  cursor: pointer;
}

.cell:hover {
  background: var(--color-surface-hover);
}

/* Bold, not filled — this just marks which month/year the day grid will
   land on if you drill back down, not a committed value the way a selected
   day is. Separate from .this-month/.this-year below: this is the grid's
   drill-context (can be any month/year the user navigated to), while those
   mark the real calendar today — the two can coincide or not. */
.cell.current {
  font-weight: 700;
}

/* The month/year containing the pending pick(s), same fill language as the
   day grid's .selected/.range-start/.range-end/.in-range so the pick stays
   visibly marked after drilling up — just without the flat "open" corner
   the day grid uses to fuse a contiguous band, since a 3-column wrapped
   grid has no such visual adjacency to fuse across. */
.cell.selected {
  background: var(--color-ink);
  color: var(--color-canvas-surface);
  font-weight: 700;
}

.cell.range-start,
.cell.range-end {
  background: var(--color-accent);
  color: var(--color-accent-contrast);
  font-weight: 700;
}

.cell.in-range {
  background: color-mix(in srgb, var(--color-accent) 16%, var(--color-canvas-surface));
}

/* One shared "real now" family across all three grids (day/month/year), so
   they read as one convention rather than three. Bold text plus a small
   dot — never a border/fill — because a dot drawn in `currentColor` just
   follows whatever text color a selected/range/hover state already set on
   the cell (canvas-surface on an ink fill, accent-contrast on an accent
   fill), so it stays visible no matter what else is layered on the cell,
   instead of a fixed border color that can blend into a same-color fill
   (e.g. an ink ring vanishing on `.selected`'s ink background). */
.day.today,
.cell.this-month,
.cell.this-year {
  font-weight: 700;
}

.day.today::after,
.cell.this-month::after,
.cell.this-year::after {
  content: '';
  position: absolute;
  bottom: 4px;
  left: 50%;
  translate: -50% 0;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: currentColor;
}

.footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: var(--space-xs);
  padding-top: var(--space-xs);
  border-top: 1px solid var(--color-border-subtle);
}

.footer-left {
  display: flex;
  gap: var(--space-xs);
}

/* A control's own padding, not the room around it — stays a fixed literal
   value regardless of the Appearance spacing setting, same as the global
   `.btn`/`.input` classes (design-tokens.css) never scale their own
   padding/min-height either. --space-scale governs the gaps BETWEEN
   elements (see DESIGN.md "Appearance spacing: what scales"), not a
   control's own size. */
.confirm-btn {
  padding: 4px 10px;
  min-height: auto;
}

.link-btn {
  background: none;
  border: none;
  color: var(--color-ink-secondary);
  cursor: pointer;
  padding: 2px 4px;
}

.link-btn:hover {
  color: var(--color-ink);
}
</style>

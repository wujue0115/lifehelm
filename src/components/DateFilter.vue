<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import DatePicker from './DatePicker.vue'
import { resolveDateFilterRange, type DateFilterPreset } from '@/utils/dateFilterPresets'

// v-model:preset (+ v-model:customStart/customEnd, only meaningful when
// preset is 'custom') — same "flat strings on the widget's ViewConfig"
// contract as statusFilter/priorityFilter/tagFilter (src/types/view.ts),
// so this drops into the same filters row and persists the same way.
const props = withDefaults(
  defineProps<{
    preset?: DateFilterPreset
    customStart?: string
    customEnd?: string
  }>(),
  { preset: 'all', customStart: '', customEnd: '' },
)
const emit = defineEmits<{
  'update:preset': [DateFilterPreset]
  'update:customStart': [string]
  'update:customEnd': [string]
}>()

const { t, locale } = useI18n()

const open = ref(false)
// wrapperEl wraps just the trigger button — the popover itself is
// Teleported to <body> (see template) so it isn't clipped by an ancestor
// scroll container's overflow (every widget's `.widget-body` is
// `overflow-y: auto`, which per the CSS overflow spec also forces
// `overflow-x` to `auto`, clipping/scrolling this popover's horizontal
// overflow along with it — this popover is wide enough to hit that
// routinely). popoverEl is the teleported popover's own root, used below
// for the focusout containment check now that it's a separate DOM subtree
// from wrapperEl.
const wrapperEl = ref<HTMLElement | null>(null)
const popoverEl = ref<HTMLElement | null>(null)
const calendarColEl = ref<HTMLElement | null>(null)

// Fixed-position coordinates for the teleported popover, computed from the
// trigger's viewport position — `right`, not `left`, to keep the same
// "grows left from the trigger's right edge" placement as before
// teleporting (see .popover's comment below for why).
const popoverPos = ref({ top: 0, right: 0 })
function updatePopoverPosition(): void {
  const rect = wrapperEl.value?.getBoundingClientRect()
  if (!rect) return
  popoverPos.value = { top: rect.bottom + 4, right: window.innerWidth - rect.right }
}

function onEscapeKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') close()
}

// The right column (the calendar) sets the popover's height; the left
// column (presets) is capped to match and scrolls internally instead of
// stretching the popover taller — a ResizeObserver, not a fixed pixel
// guess, because the calendar's own height changes with the view (a 5- vs
// 6-week month, or the drilled-up month/year grids).
const calendarHeight = ref<number | null>(null)
let calendarResizeObserver: ResizeObserver | null = null

watch(open, (isOpen) => {
  if (!isOpen) {
    calendarResizeObserver?.disconnect()
    calendarResizeObserver = null
    window.removeEventListener('scroll', updatePopoverPosition, true)
    window.removeEventListener('resize', updatePopoverPosition)
    document.removeEventListener('keydown', onEscapeKeydown)
    return
  }
  updatePopoverPosition()
  window.addEventListener('scroll', updatePopoverPosition, true)
  window.addEventListener('resize', updatePopoverPosition)
  document.addEventListener('keydown', onEscapeKeydown)
  // The popover only mounts (and calendarColEl only exists) once `open` is
  // true, so the observer has to be (re)created here rather than once at
  // setup.
  requestAnimationFrame(() => {
    if (!calendarColEl.value) return
    calendarResizeObserver = new ResizeObserver(([entry]) => {
      calendarHeight.value = entry?.contentRect.height ?? null
    })
    calendarResizeObserver.observe(calendarColEl.value)
  })
})

onBeforeUnmount(() => {
  calendarResizeObserver?.disconnect()
  window.removeEventListener('scroll', updatePopoverPosition, true)
  window.removeEventListener('resize', updatePopoverPosition)
  document.removeEventListener('keydown', onEscapeKeydown)
})

// Two preset groups, matching the popover's two sections: the calendar
// period containing today, vs. the period immediately before it (see
// dateFilterPresets.ts's resolveDateFilterRange for the exact boundaries).
const CURRENT_PRESETS: DateFilterPreset[] = [
  'today',
  'thisWeek',
  'thisFortnight',
  'thisMonth',
  'thisYear',
]
const PAST_PRESETS: DateFilterPreset[] = ['lastWeek', 'lastTwoWeeks', 'lastMonth', 'lastYear']

// Staged, same idea as DatePicker's own pending state: nothing here reaches
// the caller's v-model until Confirm is pressed, so browsing presets/dates
// and closing any other way (outside click, Escape) discards the attempt.
const pendingPreset = ref<DateFilterPreset>(props.preset)
const pendingCustomStart = ref(props.customStart)
const pendingCustomEnd = ref(props.customEnd)

function formatDisplay(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString(locale.value)
}

function labelFor(preset: DateFilterPreset, customStart: string, customEnd: string): string {
  if (preset === 'all') return t('dateFilter.all')
  if (preset === 'custom') {
    if (customStart && customEnd)
      return `${formatDisplay(customStart)} – ${formatDisplay(customEnd)}`
    return t('dateFilter.custom')
  }
  return t(`dateFilter.preset.${preset}`)
}

// What the trigger button shows: the last *committed* selection.
const triggerLabel = computed(() => labelFor(props.preset, props.customStart, props.customEnd))
// What the popover's own footer shows while a pick is still staged.
const pendingLabel = computed(() =>
  labelFor(pendingPreset.value, pendingCustomStart.value, pendingCustomEnd.value),
)

function toggleOpen(): void {
  if (!open.value) {
    pendingPreset.value = props.preset
    pendingCustomStart.value = props.customStart
    pendingCustomEnd.value = props.customEnd
  }
  open.value = !open.value
}
function close(): void {
  open.value = false
}

// Same "focus left the whole widget" pattern as DatePicker.vue — every
// interactive element below uses @mousedown.prevent to keep focus pinned
// on the trigger while clicking around inside the popover (including the
// embedded inline DatePicker), which is what makes a single check here
// sufficient for mouse interaction despite the popover being Teleported
// into a *different* DOM subtree (wrapperEl) than the trigger it's
// anchored to (popoverEl) — focus never actually moves into popoverEl on a
// click. It only genuinely moves there via Tab, which is exactly why both
// trees are checked: still "inside this widget" either way.
function handleFocusOut(event: FocusEvent): void {
  const next = event.relatedTarget as Node | null
  if (!next || (!wrapperEl.value?.contains(next) && !popoverEl.value?.contains(next))) close()
}

function choosePreset(preset: DateFilterPreset): void {
  pendingPreset.value = preset
}

function confirm(): void {
  emit('update:preset', pendingPreset.value)
  emit('update:customStart', pendingCustomStart.value)
  emit('update:customEnd', pendingCustomEnd.value)
  close()
}

function clearFilter(): void {
  pendingPreset.value = 'all'
  pendingCustomStart.value = ''
  pendingCustomEnd.value = ''
  emit('update:preset', 'all')
  emit('update:customStart', '')
  emit('update:customEnd', '')
  close()
}

// The embedded calendar previews whichever choice is staged: for a preset,
// its *resolved* range (so clicking "This week" highlights the actual week
// on the grid, even though no day was clicked); for 'custom', the staged
// custom picks directly. Clicking a day on the grid always writes into the
// custom fields and flips the staged choice to 'custom' — picking a date is
// itself a choice, same as clicking any preset button.
const pendingResolvedRange = computed(() =>
  resolveDateFilterRange(pendingPreset.value, {
    start: pendingCustomStart.value,
    end: pendingCustomEnd.value,
  }),
)
const inlineStart = computed({
  get: () =>
    pendingPreset.value === 'custom'
      ? pendingCustomStart.value
      : (pendingResolvedRange.value?.start ?? ''),
  set: (value: string) => {
    pendingCustomStart.value = value
    pendingPreset.value = 'custom'
  },
})
const inlineEnd = computed({
  get: () =>
    pendingPreset.value === 'custom'
      ? pendingCustomEnd.value
      : (pendingResolvedRange.value?.end ?? ''),
  set: (value: string) => {
    pendingCustomEnd.value = value
    pendingPreset.value = 'custom'
  },
})
</script>

<template>
  <div ref="wrapperEl" class="date-filter" @focusout="handleFocusOut">
    <button type="button" class="input type-body trigger" @click="toggleOpen">
      <span class="trigger-text" :class="{ placeholder: preset === 'all' }">{{
        triggerLabel
      }}</span>
    </button>
  </div>

  <Teleport to="body">
    <div
      v-if="open"
      ref="popoverEl"
      class="popover"
      :style="{ top: `${popoverPos.top}px`, right: `${popoverPos.right}px` }"
      @focusout="handleFocusOut"
    >
      <div class="popover-body">
        <div
          class="presets-col"
          :style="calendarHeight ? { maxHeight: `${calendarHeight}px` } : undefined"
        >
          <div class="preset-group">
            <p class="type-label group-label">{{ t('dateFilter.groupCurrent') }}</p>
            <div class="preset-buttons">
              <button
                v-for="option in CURRENT_PRESETS"
                :key="option"
                type="button"
                class="preset-btn type-body-sm"
                :class="{ active: pendingPreset === option }"
                @mousedown.prevent
                @click="choosePreset(option)"
              >
                {{ t(`dateFilter.preset.${option}`) }}
              </button>
            </div>
          </div>

          <div class="preset-group">
            <p class="type-label group-label">{{ t('dateFilter.groupPast') }}</p>
            <div class="preset-buttons">
              <button
                v-for="option in PAST_PRESETS"
                :key="option"
                type="button"
                class="preset-btn type-body-sm"
                :class="{ active: pendingPreset === option }"
                @mousedown.prevent
                @click="choosePreset(option)"
              >
                {{ t(`dateFilter.preset.${option}`) }}
              </button>
            </div>
          </div>
        </div>

        <div ref="calendarColEl" class="calendar-col">
          <DatePicker inline mode="range" v-model:start="inlineStart" v-model:end="inlineEnd" />
        </div>
      </div>

      <div class="footer">
        <p class="type-body-sm pending-range">{{ pendingLabel }}</p>
        <div class="footer-actions">
          <button
            type="button"
            class="btn btn-secondary clear-btn type-body-sm"
            @mousedown.prevent
            @click="clearFilter"
          >
            {{ t('dateFilter.clear') }}
          </button>
          <button
            type="button"
            class="btn btn-primary confirm-btn type-body-sm"
            :disabled="pendingPreset === 'custom' && !pendingCustomStart"
            @mousedown.prevent
            @click="confirm"
          >
            {{ t('datePicker.confirm') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* A fixed flex-basis, not just a min-width — .trigger's own width:100%
   would otherwise track its *content* (this is a flex item with no other
   width constraint), so the field visibly widens the moment a range gets
   picked instead of already having room for one. Sized for a full custom
   range ("8/3/2026 – 8/10/2026"-ish) up front so nothing shifts. No
   `position: relative` here — the popover is Teleported to <body> and
   positioned via fixed pixel coordinates computed from this element's own
   `getBoundingClientRect()` (see updatePopoverPosition in the script), not
   via CSS containing-block anchoring. */
.date-filter {
  flex: 0 0 190px;
}

.trigger {
  display: block;
  width: 100%;
  text-align: left;
  cursor: pointer;
}

.trigger-text {
  display: block;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.trigger-text.placeholder {
  color: var(--color-ink-muted);
}

/* Teleported to <body> (see template) and `position: fixed` with top/right
   set inline from updatePopoverPosition — not a CSS-anchored absolute
   popover like DatePicker's own — so it escapes every ancestor's clipping,
   in particular each widget's `.widget-body` (`overflow-y: auto`, which
   per the CSS overflow spec also forces `overflow-x` to `auto`) that would
   otherwise cut this one off: it's wide enough (two columns plus an
   embedded calendar) to routinely hit that. Anchored via `right`, not
   `left`, growing leftward from the trigger's right edge — same reasoning
   as before teleporting: this popover is wide enough that left-aligning
   under a trigger anywhere but the row's left edge would push it off the
   viewport. */
.popover {
  position: fixed;
  z-index: 20;
  padding: var(--space-sm);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  background: var(--color-canvas-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--rounded-md);
}

.popover-body {
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
}

/* max-height is set inline from the calendar column's measured height (see
   the ResizeObserver in the script) — capped, not stretched, so this
   column scrolls internally rather than growing the popover taller than
   the calendar next to it. */
.presets-col {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  flex: 0 0 140px;
  overflow-y: auto;
}

/* Divider against the calendar column, since the embedded DatePicker is
   `inline` (no border/background of its own — see DatePicker.vue's
   `.popover.inline`) and would otherwise run directly into the presets.
   Matches DatePicker's own standalone-popover width (260px) — it's been
   wider before (340px, then 300px), each step too large relative to the
   presets column it's paired with. */
.calendar-col {
  flex: 0 0 260px;
  padding-left: var(--space-sm);
  border-left: 1px solid var(--color-border-subtle);
}

.group-label {
  color: var(--color-ink-secondary);
  margin-bottom: var(--space-xs);
}

/* --space-xs (8px), not --space-xxs (4px) — the Appearance panel's spacing
   presets only span 0.85–1.15x (src/config/themePresets.ts's
   SPACING_OPTIONS), so a 4px base gap barely moves (3.4px to 4.6px) and
   reads as unchanged; 8px moves enough (6.8px to 9.2px) to actually be
   visible when switching between Compact/Comfortable, which is the whole
   point of this list of stacked buttons responding to it at all. */
.preset-buttons {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.preset-btn {
  width: 100%;
  padding: 6px 8px;
  background: var(--color-canvas-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--rounded-sm);
  color: var(--color-ink);
  cursor: pointer;
  text-align: center;
}

.preset-btn:hover {
  background: var(--color-surface-hover);
}

/* Accent, not ink — a staged preset is a live, in-progress choice (closer
   to DatePicker's range-mode start/end caps) rather than an already-
   committed single value, and it needs to read as distinct from the
   embedded calendar's own selected-day fill (ink for single-mode, but this
   filter is range-shaped underneath). See DESIGN.md "Accent
   (user-configurable)". */
.preset-btn.active {
  background: var(--color-accent);
  color: var(--color-accent-contrast);
  border-color: var(--color-accent);
  font-weight: 700;
}

.footer {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  padding-top: var(--space-xs);
  border-top: 1px solid var(--color-border-subtle);
}

.pending-range {
  color: var(--color-ink-secondary);
}

.footer-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* A control's own padding, not the room around it — fixed, same as the
   global `.btn`/`.input` classes (design-tokens.css) never scale their own
   padding/min-height. --space-scale governs the gaps BETWEEN elements
   (see DESIGN.md "Appearance spacing: what scales"), not a control's own
   size. */
.clear-btn,
.confirm-btn {
  padding: 4px 10px;
  min-height: auto;
}
</style>

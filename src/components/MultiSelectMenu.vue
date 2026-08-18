<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

// A checkbox-driven multi-value counterpart to `SelectMenu` — same popover
// shell (Teleported bordered card, same positioning), but picking an option
// toggles it in/out of the selection instead of committing-and-closing, so
// several values can be picked in one open/close cycle. Used for filters
// that narrow to "any of these" rather than a single value (status/
// priority/tag filters in List/Board/Calendar) — `SelectMenu` itself stays
// the single-value component (inline row editing, item form fields, etc.).
// `All` and the individual options behave as a master/child checkbox
// group: `All` checked implies every option below it is checked too, and
// unchecking one option while `All` is active narrows to "every other
// option" rather than clearing the rest.
export interface MultiSelectMenuOption {
  value: string
  label: string
}

// A reserved value standing in for "the user explicitly unchecked
// everything" — distinct from `[]`, which means `All`/no restriction (see
// `modelValue` below). Never collides with a real option: status/priority/
// tag names are all user-facing display strings, and this is neither
// displayed nor ever compared against one directly — every real
// `filteredItems` predicate elsewhere (`item.status`, `item.priority`,
// `item.tags`) naturally never matches it, so a caller's existing
// `!statusFilter.includes(item.status)`-style check already treats a
// `[NONE]`-only array as "matches nothing" with no changes needed on that
// end.
const NONE = '__multi-select-menu-none__'

const props = defineProps<{
  // The specifically-included values, NOT the full "everything" set — an
  // empty array is the canonical "no restriction" state (the `All` row),
  // matching this app's existing filter semantics (previously a single
  // `'all'` sentinel string). `All` being checked means every option is
  // implicitly included, so every individual checkbox shows checked too —
  // unchecking one narrows to "all except that one" rather than clearing
  // the rest, the same relationship a master/child checkbox group normally
  // has. Checking every individual option by hand collapses back to `[]`
  // so the `All` row reflects it too, whichever way that state was reached.
  // Clicking `All` again once it's already checked flips to `[NONE]` — a
  // real toggle, not a one-way reset — which every option (and `All`
  // itself) reads as fully unchecked.
  modelValue: string[]
  options: MultiSelectMenuOption[]
  allLabel: string
}>()
const emit = defineEmits<{ 'update:modelValue': [string[]] }>()

const { t } = useI18n()

const open = ref(false)
const wrapperEl = ref<HTMLElement | null>(null)
const triggerEl = ref<HTMLButtonElement | null>(null)
const popoverEl = ref<HTMLElement | null>(null)
const highlightedIndex = ref(-1)

const isAllSelected = computed(() => props.modelValue.length === 0)
const isNoneSelected = computed(() => props.modelValue.length === 1 && props.modelValue[0] === NONE)
function isOptionChecked(value: string): boolean {
  return isAllSelected.value || props.modelValue.includes(value)
}

const selectedOptions = computed(() =>
  isAllSelected.value
    ? []
    : props.options.filter((option) => props.modelValue.includes(option.value)),
)

// Same Teleport-to-<body> + getBoundingClientRect positioning as
// SelectMenu's own popover, for the same reason (every widget's
// `.widget-body` clips overflow on every side).
const popoverPos = ref({ top: 0, left: 0, minWidth: 0 })
function updatePopoverPosition(): void {
  const rect = wrapperEl.value?.getBoundingClientRect()
  if (!rect) return
  popoverPos.value = { top: rect.bottom + 4, left: rect.left, minWidth: rect.width }
}

function onEscapeKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') close()
}

watch(open, (isOpen) => {
  if (!isOpen) {
    window.removeEventListener('scroll', updatePopoverPosition, true)
    window.removeEventListener('resize', updatePopoverPosition)
    document.removeEventListener('keydown', onEscapeKeydown)
    return
  }
  highlightedIndex.value = -1
  updatePopoverPosition()
  window.addEventListener('scroll', updatePopoverPosition, true)
  window.addEventListener('resize', updatePopoverPosition)
  document.addEventListener('keydown', onEscapeKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', updatePopoverPosition, true)
  window.removeEventListener('resize', updatePopoverPosition)
  document.removeEventListener('keydown', onEscapeKeydown)
})

function toggleOpen(): void {
  open.value = !open.value
}
function close(): void {
  open.value = false
}

// Same pattern as SelectMenu: focus never actually leaves the trigger on a
// mouse click (every row below uses @mousedown.prevent), so this only
// fires for genuine outside clicks or Tab.
function handleFocusOut(event: FocusEvent): void {
  const next = event.relatedTarget as Node | null
  if (!next || (!wrapperEl.value?.contains(next) && !popoverEl.value?.contains(next))) close()
}

// A real toggle: `All` checked → clicking it deselects everything
// (`[NONE]`, every option reads unchecked); anything else → clicking it
// selects everything (`[]`, the canonical `All` state).
function selectAll(): void {
  emit('update:modelValue', isAllSelected.value ? [NONE] : [])
}

function toggleOption(option: MultiSelectMenuOption): void {
  // Starting from `All` (nothing explicitly listed), every option reads as
  // checked (see `isOptionChecked`) — so unchecking one here has to expand
  // to "every other option, explicitly," not just toggle within an empty
  // array (which would otherwise re-check it right back). Starting from
  // `[NONE]`, strip the sentinel first — it isn't a real pick to toggle
  // against.
  const allValues = props.options.map((o) => o.value)
  const currentlyChecked = isAllSelected.value
    ? allValues
    : props.modelValue.filter((value) => value !== NONE)
  const next = currentlyChecked.includes(option.value)
    ? currentlyChecked.filter((value) => value !== option.value)
    : [...currentlyChecked, option.value]
  if (next.length === allValues.length) {
    // Checking every individual option by hand is equivalent to `All` —
    // fold back to `[]` so the `All` row's own checkbox reflects that too,
    // rather than sitting unchecked while every option below it is checked.
    emit('update:modelValue', [])
  } else if (next.length === 0) {
    // Unchecking the last remaining option by hand should land on "nothing
    // checked," not silently revert to `All` — an empty array can only
    // mean one of those, so the explicit-none state needs its own marker.
    emit('update:modelValue', [NONE])
  } else {
    emit('update:modelValue', next)
  }
}

// Arrow keys move a highlight across "All" (-1) + every option; Space/Enter
// toggles the highlighted row without closing, since several rows are
// typically picked in one session. Escape (handled globally above) closes.
function handleTriggerKeydown(event: KeyboardEvent): void {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    if (!open.value) {
      open.value = true
      return
    }
    const delta = event.key === 'ArrowDown' ? 1 : -1
    // Rows span -1 ("All") through options.length - 1 — shift to a 0-based
    // index (0..options.length) to wrap cleanly, then shift back.
    const rowCount = props.options.length + 1
    const zeroBased = highlightedIndex.value + 1
    highlightedIndex.value = ((zeroBased + delta + rowCount) % rowCount) - 1
  } else if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    if (!open.value) {
      open.value = true
      return
    }
    if (highlightedIndex.value === -1) {
      selectAll()
      return
    }
    const option = props.options[highlightedIndex.value]
    if (option) toggleOption(option)
  }
}
</script>

<template>
  <div ref="wrapperEl" class="select-menu" @focusout="handleFocusOut">
    <button
      ref="triggerEl"
      type="button"
      class="trigger type-body input styled-trigger"
      @click="toggleOpen"
      @keydown="handleTriggerKeydown"
    >
      <span class="trigger-text">
        <template v-if="isAllSelected">{{ allLabel }}</template>
        <template v-else-if="isNoneSelected">{{ t('list.filterNoneSelected') }}</template>
        <slot v-else-if="selectedOptions.length === 1" name="option" :option="selectedOptions[0]">{{
          selectedOptions[0]?.label
        }}</slot>
        <template v-else>{{
          t('list.filterSelectedCount', { count: selectedOptions.length })
        }}</template>
      </span>
      <svg class="arrow" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
        <path
          d="M2.5 4.5l3.5 3.5 3.5-3.5"
          stroke="currentColor"
          stroke-width="1.3"
          stroke-linecap="round"
          stroke-linejoin="round"
          fill="none"
        />
      </svg>
    </button>

    <Teleport to="body">
      <div
        v-if="open"
        ref="popoverEl"
        class="popover"
        :style="{
          top: `${popoverPos.top}px`,
          left: `${popoverPos.left}px`,
          minWidth: `${popoverPos.minWidth}px`,
        }"
        @focusout="handleFocusOut"
      >
        <button
          type="button"
          class="option type-body"
          :class="{ highlighted: highlightedIndex === -1 }"
          @mousedown.prevent
          @mouseenter="highlightedIndex = -1"
          @click="selectAll"
        >
          <span class="checkbox" :class="{ checked: isAllSelected }" aria-hidden="true">
            <svg v-if="isAllSelected" width="10" height="10" viewBox="0 0 10 10">
              <path
                d="M1.5 5.2l2 2L8.5 2.6"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
                fill="none"
              />
            </svg>
          </span>
          {{ allLabel }}
        </button>

        <hr class="divider" />

        <button
          v-for="(option, index) in options"
          :key="option.value"
          type="button"
          class="option type-body"
          :class="{ highlighted: index === highlightedIndex }"
          @mousedown.prevent
          @mouseenter="highlightedIndex = index"
          @click="toggleOption(option)"
        >
          <span
            class="checkbox"
            :class="{ checked: isOptionChecked(option.value) }"
            aria-hidden="true"
          >
            <svg v-if="isOptionChecked(option.value)" width="10" height="10" viewBox="0 0 10 10">
              <path
                d="M1.5 5.2l2 2L8.5 2.6"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
                fill="none"
              />
            </svg>
          </span>
          <slot name="option" :option="option">{{ option.label }}</slot>
        </button>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.select-menu {
  position: relative;
}

.trigger {
  display: inline-flex;
  align-items: center;
  text-align: left;
  cursor: pointer;
}

/* No radius override needed — `.input` (design-tokens.css) is already
   `{rounded.md}`, matching `.popover` below. */
.styled-trigger {
  justify-content: space-between;
  gap: var(--space-xs);
  width: 100%;
  min-width: 140px;
}

.trigger-text {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.arrow {
  flex-shrink: 0;
  color: var(--color-ink-secondary);
}

/* Same Teleported/z-index reasoning as SelectMenu's own popover. */
.popover {
  position: fixed;
  z-index: 110;
  width: max-content;
  max-width: 280px;
  max-height: 300px;
  overflow-y: auto;
  padding: var(--space-xxs);
  display: flex;
  flex-direction: column;
  gap: 2px;
  background: var(--color-canvas-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--rounded-md);
}

.divider {
  margin: var(--space-xxs) 0;
  border: none;
  border-top: 1px solid var(--color-border-subtle);
}

/* Same fixed-height-row and concentric-radius reasoning as SelectMenu's
   own `.option`. */
.option {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  width: 100%;
  height: 36px;
  padding: 0 8px;
  background: none;
  border: none;
  border-radius: calc(var(--rounded-md) - var(--space-xxs));
  color: var(--color-ink);
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  flex-shrink: 0;
}

.option:hover,
.option.highlighted {
  background: var(--color-surface-hover);
}

/* Checked state is accent-filled — this is a literal checkbox (the
   SwitchToggle "on"/primary-action category under "Accent
   (user-configurable)"), not the "current selection among peers" tint
   SelectMenu's own `.option.selected` uses, since several of these can be
   checked at once here. */
.checkbox {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--rounded-xs);
  color: var(--color-accent-contrast);
}

.checkbox.checked {
  background: var(--color-accent);
  border-color: var(--color-accent);
}
</style>

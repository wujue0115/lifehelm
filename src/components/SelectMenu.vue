<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'

// A drop-in replacement for a native `<select>` — same v-model contract
// (a plain string value) — styled like every other custom popover in this
// app (DatePicker/DateFilter): a `.input`-styled trigger opening a bordered
// `{rounded.md}` card underneath, no native OS chrome. Unlike DatePicker's
// range mode, there's no "stage, then Confirm" step here — picking an
// option commits immediately and closes, same as a native select firing
// `change` on click, since there's nothing to preview.
export interface SelectMenuOption {
  value: string
  label: string
}

const props = withDefaults(
  defineProps<{
    modelValue: string
    options: SelectMenuOption[]
    // For callers that need the trigger to look like something other than
    // a text-input-styled dropdown box — WorkItemRow's inline status/
    // priority editing wants the trigger to stay exactly the read-only
    // badge it always shows, never swapping to a bordered field just
    // because the popover happens to be closed. Drops the `.input`/`.trigger`
    // chrome (border, min-height, chevron) in favor of a plain reset button;
    // pair with the `#trigger` slot to supply the badge/pill content.
    bare?: boolean
  }>(),
  { bare: false },
)
const emit = defineEmits<{ 'update:modelValue': [string] }>()

const open = ref(false)
const wrapperEl = ref<HTMLElement | null>(null)
const triggerEl = ref<HTMLButtonElement | null>(null)
const popoverEl = ref<HTMLElement | null>(null)
const highlightedIndex = ref(0)

const selectedIndex = computed(() =>
  props.options.findIndex((option) => option.value === props.modelValue),
)
const triggerLabel = computed(() => props.options[selectedIndex.value]?.label ?? '')
// Falls back to a label-less stand-in when `modelValue` doesn't match any
// option (e.g. before data loads) — the `#option` slot below always gets a
// real object to destructure, never `undefined`.
const selectedOption = computed<SelectMenuOption>(
  () => props.options[selectedIndex.value] ?? { value: props.modelValue, label: '' },
)

// Same Teleport-to-<body> + getBoundingClientRect positioning as
// DateFilter.vue's popover, for the same reason: every widget's
// `.widget-body` clips overflow on every side (see DESIGN.md "Touch
// Targets"), and this component is used inside those bodies routinely
// (status/priority/tag/sort filters). `minWidth` is tracked here too (not
// left to CSS `min-width: 100%`) — for a `position: fixed` box, percentage
// widths resolve against the viewport, not the trigger, so a plain
// `min-width: 100%` doesn't match the trigger's width at all — it's just
// "100% of the viewport," which also silently wins over `max-width: 280px`
// (min-width > max-width makes the box use min-width) and had the popover
// rendering nearly viewport-wide.
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
  highlightedIndex.value = selectedIndex.value === -1 ? 0 : selectedIndex.value
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

// Same pattern as DatePicker/DateFilter: focus never actually leaves the
// trigger on a mouse click (every option below uses @mousedown.prevent),
// so this really only fires for genuine outside clicks or Tab — checked
// against both DOM subtrees since the popover is Teleported into a
// different one than the trigger.
function handleFocusOut(event: FocusEvent): void {
  const next = event.relatedTarget as Node | null
  if (!next || (!wrapperEl.value?.contains(next) && !popoverEl.value?.contains(next))) close()
}

function selectOption(option: SelectMenuOption): void {
  emit('update:modelValue', option.value)
  close()
}

// Keyboard nav mirrors a native <select>: Up/Down move the highlight,
// Enter/Space commit it, Escape (handled globally above) closes. Focus
// stays on the trigger throughout — the highlight is tracked in state, not
// via real DOM focus, matching the mouse-interaction model above.
function handleTriggerKeydown(event: KeyboardEvent): void {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    if (!open.value) {
      open.value = true
      return
    }
    const delta = event.key === 'ArrowDown' ? 1 : -1
    const count = props.options.length
    highlightedIndex.value = (highlightedIndex.value + delta + count) % count
  } else if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    if (!open.value) {
      open.value = true
      return
    }
    const option = props.options[highlightedIndex.value]
    if (option) selectOption(option)
  }
}
</script>

<template>
  <div ref="wrapperEl" class="select-menu" @focusout="handleFocusOut">
    <button
      ref="triggerEl"
      type="button"
      class="trigger type-body"
      :class="bare ? 'bare-trigger' : 'input styled-trigger'"
      @click="toggleOpen"
      @keydown="handleTriggerKeydown"
    >
      <slot name="trigger">
        <span class="trigger-text">
          <slot name="option" :option="selectedOption">{{ triggerLabel }}</slot>
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
      </slot>
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
          v-for="(option, index) in options"
          :key="option.value"
          type="button"
          class="option type-body"
          :class="{
            selected: option.value === modelValue,
            highlighted: index === highlightedIndex,
          }"
          @mousedown.prevent
          @mouseenter="highlightedIndex = index"
          @click="selectOption(option)"
        >
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

/* min-width matches the `.filters .input` rule each panel's own scoped
   style applies to its native <select> filters — that selector can't reach
   this component's non-root trigger button, so it's set here instead (same
   fix as DateFilter.vue's own trigger). */
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

/* For callers that need the trigger to stay visually identical to a
   read-only badge/pill display (WorkItemRow's inline cell editing) — no
   border/background/min-height, just a hit-target reset around whatever
   the `#trigger` slot renders, matching a plain hover affordance rather
   than "this is a form field." */
.bare-trigger {
  flex-wrap: wrap;
  gap: 4px;
  background: none;
  border: none;
  padding: 2px;
  margin: -2px;
  border-radius: var(--rounded-xs);
  font: inherit;
  color: inherit;
  min-height: 24px;
}

.bare-trigger:hover {
  background: var(--color-surface-hover);
}

/* Teleported to <body> and `position: fixed` — same reasoning as
   DateFilter.vue's popover: every widget's `.widget-body` clips overflow
   on every side, and this component routinely opens inside one. z-index is
   above ModalOverlay's own backdrop (100, ModalOverlay.vue) rather than
   matching DatePicker/DateFilter's 20 — this component is also used inside
   modal dialogs (ThemeSettingsPanel's font picker), and since both it and
   the backdrop are Teleported to <body>, a lower z-index here would put
   the backdrop on top and make the options unclickable. */
.popover {
  position: fixed;
  z-index: 110;
  width: max-content;
  max-width: 280px;
  max-height: 260px;
  overflow-y: auto;
  padding: var(--space-xxs);
  display: flex;
  flex-direction: column;
  gap: 2px;
  background: var(--color-canvas-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--rounded-md);
}

/* border-radius is `.popover`'s own radius minus its padding, not a fixed
   token — concentric corners (same center point as the popover's own
   rounded corner) only line up when inner = outer - padding; a fixed value
   here would drift out of sync the moment either `{rounded.md}` or
   `{space.xxs}` changes (e.g. the Appearance panel's radius/spacing
   presets).

   height is a fixed 36px, not padding-driven — matching `.input`/`.btn`'s
   own fixed min-height (design-tokens.css) rather than letting content/font
   metrics decide each row's height independently, which is what let options
   read as inconsistently (and too shallow) sized in the first place. Every
   option is exactly this tall regardless of its label; the list as a whole
   scrolls past `.popover`'s own `max-height`, not any individual row. */
.option {
  display: flex;
  align-items: center;
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

/* A light accent tint, not a solid accent fill — this still marks which
   one of the peer options is currently in effect (the same "current
   selection among equivalents" territory the sidebar's active-nav-item and
   ThemeSettingsPanel's own active preset/segment use accent for, see
   DESIGN.md "Accent (user-configurable)"), but many options render their
   own colored badge/pill now (status/priority/tag pickers) — a solid
   accent-filled row behind an already-colored badge read as two competing
   shapes fighting for attention. A tint leaves the badge's own color as
   the dominant signal without adding another indicator on top of it —
   the trigger itself already shows the current value (see `selectedOption`
   above), so the option list doesn't need its own separate "selected" mark
   beyond this tint. */
.option.selected {
  background: color-mix(in srgb, var(--color-accent) 12%, transparent);
  font-weight: 700;
}
</style>

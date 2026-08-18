<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = withDefaults(
  defineProps<{
    modelValue: string[]
    suggestions?: string[]
    placeholder?: string
    // Off by default — picking from existing tags only. The board's "add
    // column" input (tag mode) is the one place new tags get registered, so
    // typing a name that isn't a suggestion here goes nowhere rather than
    // silently creating an unregistered tag.
    allowCreate?: boolean
    // For callers that need the resting display to stay exactly a read-only
    // pill list (WorkItemRow's inline tag editing) rather than an
    // always-visible bordered input box — the chip/input editing UI moves
    // into a floating popover that opens on click, pair with the `#trigger`
    // slot to supply the pill content.
    bare?: boolean
  }>(),
  { allowCreate: false, bare: false },
)

const emit = defineEmits<{ 'update:modelValue': [string[]] }>()

const { t } = useI18n()

const query = ref('')
const open = ref(false)
const highlightedIndex = ref(-1)
const inputRef = ref<HTMLInputElement | null>(null)
const wrapperEl = ref<HTMLElement | null>(null)
const triggerEl = ref<HTMLButtonElement | null>(null)
const popoverEl = ref<HTMLElement | null>(null)

// Teleported to <body> (see template) for the same reason as
// SelectMenu/DateFilter's own popovers: any ancestor with clipped overflow
// (a modal's scroll body, `ListPanel`'s `.table-card` — this component is
// used for inline tag editing inside table rows in `bare` mode) would
// otherwise cut the popover/dropdown off. Anchored to the trigger button in
// `bare` mode, to the inline input box otherwise.
const popoverPos = ref({ top: 0, left: 0, width: 0 })
function updatePopoverPosition(): void {
  const anchor = props.bare ? triggerEl.value : wrapperEl.value
  const rect = anchor?.getBoundingClientRect()
  if (!rect) return
  popoverPos.value = { top: rect.bottom + 4, left: rect.left, width: rect.width }
}
// Adding/removing a tag while the popover is open doesn't just change the
// popover's own content — in `bare` mode it also changes what the trigger
// itself renders (the pill list, via `#trigger`, updates live off the same
// `modelValue`), and `.bare-trigger` wraps (`flex-wrap: wrap`), so picking
// up a second row of pills grows the trigger's own height right under the
// popover. Scroll/resize listeners alone don't catch that — the window
// never scrolled or resized, only the trigger did — so the popover would
// stay pinned at its original `top` and start overlapping the now-taller
// trigger. A `ResizeObserver` on the anchor element catches this (and any
// other reflow that changes its box) generically, without having to
// enumerate every state that could grow it.
let resizeObserver: ResizeObserver | undefined
watch(open, (isOpen) => {
  if (!isOpen) {
    window.removeEventListener('scroll', updatePopoverPosition, true)
    window.removeEventListener('resize', updatePopoverPosition)
    resizeObserver?.disconnect()
    resizeObserver = undefined
    return
  }
  updatePopoverPosition()
  window.addEventListener('scroll', updatePopoverPosition, true)
  window.addEventListener('resize', updatePopoverPosition)
  const anchor = props.bare ? triggerEl.value : wrapperEl.value
  if (anchor) {
    resizeObserver = new ResizeObserver(updatePopoverPosition)
    resizeObserver.observe(anchor)
  }
  // In bare mode the input only exists once the popover is open (it's part
  // of the Teleported popover, not the always-visible trigger) — focus it
  // each time, not just once on mount, since this component now stays
  // mounted across repeated open/close cycles instead of being remounted
  // per edit.
  if (props.bare) nextTick(() => inputRef.value?.focus())
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', updatePopoverPosition, true)
  window.removeEventListener('resize', updatePopoverPosition)
  resizeObserver?.disconnect()
})

type Option = { value: string; label: string; isCreate: boolean }

const options = computed<Option[]>(() => {
  const trimmed = query.value.trim()
  const q = trimmed.toLowerCase()
  const available = (props.suggestions ?? []).filter(
    (tag) => !props.modelValue.includes(tag) && (q === '' || tag.toLowerCase().includes(q)),
  )
  const result: Option[] = available.slice(0, 8).map((tag) => ({
    value: tag,
    label: tag,
    isCreate: false,
  }))

  if (
    props.allowCreate &&
    trimmed !== '' &&
    !props.modelValue.includes(trimmed) &&
    !(props.suggestions ?? []).some((tag) => tag.toLowerCase() === q)
  ) {
    result.push({
      value: trimmed,
      label: t('itemDetail.tagsCreateNew', { tag: trimmed }),
      isCreate: true,
    })
  }

  return result
})

watch(query, () => {
  highlightedIndex.value = -1
})

function addTag(tag: string): void {
  if (!props.modelValue.includes(tag)) {
    emit('update:modelValue', [...props.modelValue, tag])
  }
  query.value = ''
  highlightedIndex.value = -1
}

function removeTag(tag: string): void {
  emit(
    'update:modelValue',
    props.modelValue.filter((existing) => existing !== tag),
  )
}

function selectOption(option: Option): void {
  addTag(option.value)
  inputRef.value?.focus()
}

function handleEnter(): void {
  const highlighted = options.value[highlightedIndex.value]
  if (highlighted) {
    selectOption(highlighted)
    return
  }
  const trimmed = query.value.trim()
  if (!trimmed) return
  if (props.allowCreate) {
    addTag(trimmed)
    return
  }
  // Typing the exact name of an existing suggestion and hitting Enter
  // without opening/navigating the dropdown should still work.
  const match = (props.suggestions ?? []).find((tag) => tag.toLowerCase() === trimmed.toLowerCase())
  if (match) addTag(match)
}

function handleBackspace(): void {
  if (query.value === '' && props.modelValue.length > 0) {
    removeTag(props.modelValue[props.modelValue.length - 1] as string)
  }
}

function moveHighlight(delta: number): void {
  if (!open.value) {
    open.value = true
    return
  }
  const len = options.value.length
  if (len === 0) return
  highlightedIndex.value = (highlightedIndex.value + delta + len) % len
}

function focusInput(): void {
  inputRef.value?.focus()
}

function toggleBarePopover(): void {
  open.value = !open.value
}

// Non-bare: chip-remove buttons and dropdown items both use
// @mousedown.stop.prevent, so this only fires for a genuine "focus left the
// whole widget."
function handleBlur(): void {
  open.value = false
}

// Bare: trigger and popover live in different DOM subtrees (the popover is
// Teleported), so closing on outside click/Tab needs to check containment
// against both — same relatedTarget-containment pattern as SelectMenu's
// handleFocusOut.
function handleBarePopoverFocusOut(event: FocusEvent): void {
  const next = event.relatedTarget as Node | null
  if (!next || (!triggerEl.value?.contains(next) && !popoverEl.value?.contains(next))) {
    open.value = false
  }
}
</script>

<template>
  <div class="tags-input-root">
    <button
      v-if="bare"
      ref="triggerEl"
      type="button"
      class="bare-trigger"
      @click="toggleBarePopover"
      @focusout="handleBarePopoverFocusOut"
    >
      <slot name="trigger">
        <span class="trigger-fallback type-body-sm">{{
          modelValue.join(', ') || placeholder
        }}</span>
      </slot>
    </button>

    <div v-else ref="wrapperEl" class="tags-input input" @mousedown="focusInput">
      <span v-for="tag in modelValue" :key="tag" class="chip type-label">
        {{ tag }}
        <button
          type="button"
          class="chip-remove"
          :aria-label="t('itemDetail.tagsRemove', { tag })"
          @mousedown.stop.prevent="removeTag(tag)"
        >
          ×
        </button>
      </span>
      <input
        ref="inputRef"
        v-model="query"
        type="text"
        class="tags-input-field type-body"
        :placeholder="modelValue.length ? '' : placeholder"
        @focus="open = true"
        @blur="handleBlur"
        @keydown.enter.prevent="handleEnter"
        @keydown.backspace="handleBackspace"
        @keydown.down.prevent="moveHighlight(1)"
        @keydown.up.prevent="moveHighlight(-1)"
        @keydown.esc="open = false"
      />
      <Teleport to="body">
        <ul
          v-if="open && options.length"
          class="dropdown"
          :style="{
            top: `${popoverPos.top}px`,
            left: `${popoverPos.left}px`,
            width: `${popoverPos.width}px`,
          }"
        >
          <li
            v-for="(option, index) in options"
            :key="option.value"
            class="dropdown-item type-body-sm"
            :class="{ active: index === highlightedIndex, create: option.isCreate }"
            @mousedown.stop.prevent="selectOption(option)"
            @mouseenter="highlightedIndex = index"
          >
            <slot name="option" :option="option">{{ option.label }}</slot>
          </li>
        </ul>
      </Teleport>
    </div>

    <Teleport v-if="bare" to="body">
      <div
        v-if="open"
        ref="popoverEl"
        class="popover"
        :style="{
          top: `${popoverPos.top}px`,
          left: `${popoverPos.left}px`,
          minWidth: `${popoverPos.width}px`,
        }"
        @focusout="handleBarePopoverFocusOut"
      >
        <div class="tags-input popover-edit-box" @mousedown="focusInput">
          <span v-for="tag in modelValue" :key="tag" class="chip type-label">
            {{ tag }}
            <button
              type="button"
              class="chip-remove"
              :aria-label="t('itemDetail.tagsRemove', { tag })"
              @mousedown.stop.prevent="removeTag(tag)"
            >
              ×
            </button>
          </span>
          <input
            ref="inputRef"
            v-model="query"
            type="text"
            class="tags-input-field type-body"
            :placeholder="modelValue.length ? '' : placeholder"
            @keydown.enter.prevent="handleEnter"
            @keydown.backspace="handleBackspace"
            @keydown.down.prevent="moveHighlight(1)"
            @keydown.up.prevent="moveHighlight(-1)"
            @keydown.esc="open = false"
          />
        </div>
        <ul v-if="options.length" class="dropdown popover-dropdown">
          <li
            v-for="(option, index) in options"
            :key="option.value"
            class="dropdown-item type-body-sm"
            :class="{ active: index === highlightedIndex, create: option.isCreate }"
            @mousedown.stop.prevent="selectOption(option)"
            @mouseenter="highlightedIndex = index"
          >
            <slot name="option" :option="option">{{ option.label }}</slot>
          </li>
        </ul>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.tags-input-root {
  position: relative;
}

/* Matches SelectMenu's own `.bare-trigger` — a plain hit-target reset
   around whatever the `#trigger` slot renders (a row of TagPills), so
   clicking to edit never changes the resting cell's own appearance. */
.bare-trigger {
  display: inline-flex;
  width: 100%;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  background: none;
  border: none;
  padding: 2px;
  margin: -2px;
  border-radius: var(--rounded-xs);
  font: inherit;
  color: inherit;
  cursor: pointer;
  min-height: 24px;
  text-align: left;
}

.bare-trigger:hover {
  background: var(--color-surface-hover);
}

.trigger-fallback {
  color: var(--color-ink-muted);
}

/* No radius override needed — `.input` (design-tokens.css) is already
   `{rounded.md}`, matching `.dropdown` below. `.popover-edit-box` (bare
   mode's floating edit box, which reuses this same class) overrides it
   again with its own concentric radius, so this class's own radius really
   only governs the non-bare inline box. */
.tags-input {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-xs);
  height: auto;
  cursor: text;
}

/* border-radius is {rounded.lg}, not {rounded.full} — see StatusBadge.vue
   for why chips need a radius-scale-responsive value rather than a
   circle-guaranteeing fixed one. */
.chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 6px 4px 10px;
  border-radius: var(--rounded-lg);
  background: var(--color-canvas-app);
  color: var(--color-ink-secondary);
  white-space: nowrap;
}

.chip-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  width: 14px;
  height: 14px;
  border: none;
  border-radius: var(--rounded-full);
  background: transparent;
  color: inherit;
  font-size: 13px;
  line-height: 1;
  cursor: pointer;
}

/* Accent tint, not the plain {colors.surface-hover} gray other ghost
   surfaces use — same treatment as every other single-icon button
   (`.action-btn`/`.close-btn`/`.icon-btn`, design-tokens.css). Radius
   stays {rounded.full} here rather than following those buttons'
   {rounded.md} — this is a tiny circular glyph nested inside an already-
   pill-shaped chip, not a standalone rectangular button, so a circle is
   the correct shape regardless of the radius-scale preset. */
.chip-remove:hover {
  background: color-mix(in srgb, var(--color-accent) 12%, transparent);
  color: var(--color-ink);
}

/* min-width is deliberately small (just enough to type into), not a
   generous fixed typing area — this field sits after however many chips
   are already picked, in a box that isn't always wide (ItemDetailView's
   own Tags field shares its row with Dates, ~300px total). A larger floor
   forced the input onto its own empty-looking second line the moment less
   than that much space was left after the chips, even with real (if
   smaller) room still open on the current line — wrapping should kick in
   when content actually runs out, not ahead of time. */
.tags-input-field {
  flex: 1;
  min-width: 40px;
  border: none;
  outline: none;
  background: transparent;
  color: var(--color-ink);
  padding: 2px 0;
}

/* Teleported to <body> and `position: fixed` — see the script comment on
   `popoverPos` for why. top/left/width come from that inline style, not
   CSS — a plain `right: 0` (matching the trigger's width by spanning
   between two anchored edges) only worked back when this was `position:
   absolute` inside the trigger's own containing block; fixed positioning
   has no such block to anchor `right` against. z-index 110 matches
   SelectMenu's own (above ModalOverlay's 100), in case this ever ends up
   inside a dialog too. */
.dropdown {
  position: fixed;
  z-index: 110;
  margin: 0;
  padding: 4px;
  list-style: none;
  max-height: 220px;
  overflow-y: auto;
  background: var(--color-canvas-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--rounded-md);
}

/* Concentric with `.dropdown`'s own radius minus its 4px padding — same
   reasoning as SelectMenu's own `.option`. */
.dropdown-item {
  display: flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: calc(var(--rounded-md) - var(--space-xxs));
  color: var(--color-ink);
  cursor: pointer;
}

.dropdown-item.active,
.dropdown-item:hover {
  background: var(--color-surface-hover);
}

.dropdown-item.create {
  color: var(--color-ink-secondary);
}

/* Bare mode's floating edit popover — a bordered card like SelectMenu's own
   popover, holding the chip/input editing row on top and the suggestion
   list underneath, since here (unlike SelectMenu) there's live editing UI
   in addition to a pick-list. */
.popover {
  position: fixed;
  z-index: 110;
  min-width: 220px;
  max-width: 320px;
  padding: var(--space-xxs);
  display: flex;
  flex-direction: column;
  gap: var(--space-xxs);
  background: var(--color-canvas-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--rounded-md);
}

.popover-edit-box {
  padding: 6px 8px;
  border-radius: calc(var(--rounded-md) - var(--space-xxs));
  border: 1px solid var(--color-border-subtle);
}

.popover-dropdown {
  position: static;
  z-index: auto;
  max-height: 180px;
  border: none;
  border-radius: 0;
  padding: 0;
}
</style>

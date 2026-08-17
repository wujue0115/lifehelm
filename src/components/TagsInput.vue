<script setup lang="ts">
import { computed, ref, watch } from 'vue'
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
  }>(),
  { allowCreate: false },
)

const emit = defineEmits<{ 'update:modelValue': [string[]] }>()

const { t } = useI18n()

const query = ref('')
const open = ref(false)
const highlightedIndex = ref(-1)
const inputRef = ref<HTMLInputElement | null>(null)

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
</script>

<template>
  <div class="tags-input input" @mousedown="focusInput">
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
      @blur="open = false"
      @keydown.enter.prevent="handleEnter"
      @keydown.backspace="handleBackspace"
      @keydown.down.prevent="moveHighlight(1)"
      @keydown.up.prevent="moveHighlight(-1)"
      @keydown.esc="open = false"
    />
    <ul v-if="open && options.length" class="dropdown">
      <li
        v-for="(option, index) in options"
        :key="option.value"
        class="dropdown-item type-body-sm"
        :class="{ active: index === highlightedIndex, create: option.isCreate }"
        @mousedown.stop.prevent="selectOption(option)"
        @mouseenter="highlightedIndex = index"
      >
        {{ option.label }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
.tags-input {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-xs);
  height: auto;
  cursor: text;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px 2px 10px;
  border-radius: var(--rounded-full);
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

.chip-remove:hover {
  background: var(--color-surface-hover);
  color: var(--color-ink);
}

.tags-input-field {
  flex: 1;
  min-width: 120px;
  border: none;
  outline: none;
  background: transparent;
  color: var(--color-ink);
  padding: 2px 0;
}

.dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 20;
  margin: 0;
  padding: 4px;
  list-style: none;
  max-height: 220px;
  overflow-y: auto;
  background: var(--color-canvas-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--rounded-xs);
}

.dropdown-item {
  padding: 6px 10px;
  border-radius: var(--rounded-xs);
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
</style>

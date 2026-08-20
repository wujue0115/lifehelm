<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { VIEW_ICON_IDS } from '@/config/viewIcons'
import type { ViewTemplateType } from '@/types/view'
import ViewIcon from './ViewIcon.vue'

defineProps<{ modelValue?: string; templateType: ViewTemplateType }>()
const emit = defineEmits<{ 'update:modelValue': [string | undefined] }>()

const { t } = useI18n()
const open = ref(false)
const wrapperEl = ref<HTMLElement | null>(null)

function toggleOpen(): void {
  open.value = !open.value
}

function close(): void {
  open.value = false
}

// No Teleport here (unlike SelectMenu/DateFilter) — this popover only ever
// opens from ViewRenderer's page-level name-header, which isn't nested
// inside a clipping `.widget-body`, so a plain position:absolute box
// anchored to the wrapper is enough.
function handleFocusOut(event: FocusEvent): void {
  const next = event.relatedTarget as Node | null
  if (!next || !wrapperEl.value?.contains(next)) close()
}

function onEscapeKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') close()
}

function selectIcon(id: string): void {
  emit('update:modelValue', id)
  close()
}
</script>

<template>
  <div
    ref="wrapperEl"
    class="view-icon-picker"
    @focusout="handleFocusOut"
    @keydown="onEscapeKeydown"
  >
    <button
      type="button"
      class="icon-btn trigger-btn"
      :title="t('view.changeIcon')"
      @click="toggleOpen"
    >
      <ViewIcon :icon="modelValue" :template-type="templateType" />
    </button>

    <div v-if="open" class="popover">
      <button
        v-for="id in VIEW_ICON_IDS"
        :key="id"
        type="button"
        class="option"
        :class="{ selected: (modelValue || templateType) === id }"
        @click="selectIcon(id)"
      >
        <ViewIcon :icon="id" :template-type="templateType" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.view-icon-picker {
  position: relative;
  display: inline-flex;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-radius: var(--rounded-md);
  cursor: pointer;
  color: var(--color-ink);
  padding: 6px;
}

.icon-btn:hover {
  background: color-mix(in srgb, var(--color-accent) 12%, transparent);
}

.popover {
  position: absolute;
  top: calc(100% + var(--space-xs));
  left: 0;
  z-index: 20;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2px;
  width: max-content;
  padding: var(--space-xxs);
  background: var(--color-canvas-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--rounded-md);
}

/* Concentric with `.popover`'s own radius minus its padding — same formula
   as SelectMenu's `.option` (DESIGN.md "Corner radius"), so both corners
   share a center point instead of drifting apart under the Appearance
   panel's radius preset. */
.option {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  background: none;
  border: none;
  border-radius: calc(var(--rounded-md) - var(--space-xxs));
  color: var(--color-ink-secondary);
  cursor: pointer;
}

.option:hover {
  background: var(--color-surface-hover);
  color: var(--color-ink);
}

.option.selected {
  background: color-mix(in srgb, var(--color-accent) 12%, transparent);
  color: var(--color-ink);
}
</style>

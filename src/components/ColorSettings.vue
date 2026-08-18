<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { TAG_COLOR_KEYS, type TagColorKey } from '@/config/tagColors'
import type { Priority, PriorityOption, StatusOption, TagOption } from '@/types/work-item'
import { usePriorityLabel } from '@/composables/usePriorityLabel'
import { useWorkItemsStore } from '@/stores/workItems'
import ModalOverlay from './ModalOverlay.vue'
import DialogHeader from './DialogHeader.vue'

const props = defineProps<{
  open: boolean
  statuses: StatusOption[]
  priorities: PriorityOption[]
  tagNames: string[]
  tagRegistry: TagOption[]
  viewStatusColors: Record<string, TagColorKey>
  viewPriorityColors: Partial<Record<Priority, TagColorKey>>
  viewTagColors: Record<string, TagColorKey>
}>()
const emit = defineEmits<{
  'update:viewStatusColors': [Record<string, TagColorKey>]
  'update:viewPriorityColors': [Partial<Record<Priority, TagColorKey>>]
  'update:viewTagColors': [Record<string, TagColorKey>]
  close: []
}>()

const { t } = useI18n()
const priorityLabel = usePriorityLabel()
const store = useWorkItemsStore()

// Global (the default) edits the swatch stored on the status/priority/tag
// entity itself, shared by every List/Board/Calendar. "This view" edits only
// this widget's own override, which wins over the global color when both
// are set — see DESIGN.md "Status/Priority/Tag Color".
const scope = ref<'global' | 'view'>('global')

function statusColorFor(status: StatusOption): TagColorKey | undefined {
  return scope.value === 'global' ? status.color : props.viewStatusColors[status.name]
}
function setStatusSwatch(status: StatusOption, color: TagColorKey | null): void {
  if (scope.value === 'global') {
    store.setStatusColor(status.name, color ?? undefined)
    return
  }
  const next = { ...props.viewStatusColors }
  if (color) next[status.name] = color
  else delete next[status.name]
  emit('update:viewStatusColors', next)
}

function priorityColorFor(priority: PriorityOption): TagColorKey | undefined {
  return scope.value === 'global' ? priority.color : props.viewPriorityColors[priority.name]
}
function setPrioritySwatch(priority: PriorityOption, color: TagColorKey | null): void {
  if (scope.value === 'global') {
    store.setPriorityColor(priority.name, color ?? undefined)
    return
  }
  const next = { ...props.viewPriorityColors }
  if (color) next[priority.name] = color
  else delete next[priority.name]
  emit('update:viewPriorityColors', next)
}

function tagColorFor(name: string): TagColorKey | undefined {
  if (scope.value === 'global') return props.tagRegistry.find((tag) => tag.name === name)?.color
  return props.viewTagColors[name]
}
function setTagSwatch(name: string, color: TagColorKey | null): void {
  if (scope.value === 'global') {
    store.setTagColor(name, color ?? undefined)
    return
  }
  const next = { ...props.viewTagColors }
  if (color) next[name] = color
  else delete next[name]
  emit('update:viewTagColors', next)
}
</script>

<template>
  <ModalOverlay :open="open" @close="emit('close')">
    <div class="panel">
      <DialogHeader :title="t('colorSettings.title')" @close="emit('close')" />

      <div class="scope-toggle" role="tablist">
        <button
          type="button"
          role="tab"
          :aria-selected="scope === 'global'"
          class="type-label scope-btn"
          :class="{ active: scope === 'global' }"
          @click="scope = 'global'"
        >
          {{ t('colorSettings.scopeGlobal') }}
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="scope === 'view'"
          class="type-label scope-btn"
          :class="{ active: scope === 'view' }"
          @click="scope = 'view'"
        >
          {{ t('colorSettings.scopeView') }}
        </button>
      </div>
      <p class="type-caption scope-hint">
        {{
          scope === 'global' ? t('colorSettings.scopeGlobalHint') : t('colorSettings.scopeViewHint')
        }}
      </p>

      <section v-if="statuses.length" class="group">
        <h3 class="type-label group-title">{{ t('colorSettings.status') }}</h3>
        <div v-for="status in statuses" :key="status.id" class="row">
          <span class="type-body-sm row-label">{{ status.name }}</span>
          <div class="swatches">
            <button
              type="button"
              class="swatch none"
              :class="{ selected: !statusColorFor(status) }"
              :title="t('colorSettings.none')"
              @click="setStatusSwatch(status, null)"
            ></button>
            <button
              v-for="key in TAG_COLOR_KEYS"
              :key="key"
              type="button"
              class="swatch"
              :class="{ selected: statusColorFor(status) === key }"
              :style="{ '--swatch-color': `var(--tag-color-${key})` }"
              :title="t(`colorSettings.names.${key}`)"
              @click="setStatusSwatch(status, key)"
            ></button>
          </div>
        </div>
      </section>

      <section v-if="priorities.length" class="group">
        <h3 class="type-label group-title">{{ t('colorSettings.priority') }}</h3>
        <div v-for="priority in priorities" :key="priority.id" class="row">
          <span class="type-body-sm row-label">{{ priorityLabel(priority.name) }}</span>
          <div class="swatches">
            <button
              type="button"
              class="swatch none"
              :class="{ selected: !priorityColorFor(priority) }"
              :title="t('colorSettings.none')"
              @click="setPrioritySwatch(priority, null)"
            ></button>
            <button
              v-for="key in TAG_COLOR_KEYS"
              :key="key"
              type="button"
              class="swatch"
              :class="{ selected: priorityColorFor(priority) === key }"
              :style="{ '--swatch-color': `var(--tag-color-${key})` }"
              :title="t(`colorSettings.names.${key}`)"
              @click="setPrioritySwatch(priority, key)"
            ></button>
          </div>
        </div>
      </section>

      <section v-if="tagNames.length" class="group">
        <h3 class="type-label group-title">{{ t('colorSettings.tags') }}</h3>
        <div v-for="name in tagNames" :key="name" class="row">
          <span class="type-body-sm row-label">{{ name }}</span>
          <div class="swatches">
            <button
              type="button"
              class="swatch none"
              :class="{ selected: !tagColorFor(name) }"
              :title="t('colorSettings.none')"
              @click="setTagSwatch(name, null)"
            ></button>
            <button
              v-for="key in TAG_COLOR_KEYS"
              :key="key"
              type="button"
              class="swatch"
              :class="{ selected: tagColorFor(name) === key }"
              :style="{ '--swatch-color': `var(--tag-color-${key})` }"
              :title="t(`colorSettings.names.${key}`)"
              @click="setTagSwatch(name, key)"
            ></button>
          </div>
        </div>
      </section>
    </div>
  </ModalOverlay>
</template>

<style scoped>
.panel {
  background: var(--color-canvas-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--rounded-lg);
  padding: var(--space-xl);
  max-width: 480px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.panel :deep(.panel-header) {
  margin-bottom: var(--space-md);
}

/* border-radius is {rounded.md}, matching every other bordered surface —
   the "Global"/"This view" scope tabs. */
.scope-toggle {
  display: flex;
  gap: 4px;
  padding: 3px;
  background: var(--color-canvas-app);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--rounded-md);
}

/* border-radius is `.scope-toggle`'s own radius minus its 3px padding, not
   a second flat {rounded.md} — concentric corners (same center point as
   the track's own rounded corner) only line up when inner = outer -
   padding; two independently-set equal radii drift apart the moment the
   tab is inset from the track's edge by any padding at all, which is
   exactly why this looked off before. Same formula as SelectMenu's own
   `.option` relative to `.popover`. */
.scope-btn {
  flex: 1;
  padding: 6px 12px;
  border: 1px solid transparent;
  border-radius: calc(var(--rounded-md) - 3px);
  background: none;
  color: var(--color-ink-secondary);
  cursor: pointer;
}

.scope-btn.active {
  background: var(--color-canvas-surface);
  color: var(--color-ink);
  border-color: var(--color-border-strong);
}

.scope-hint {
  color: var(--color-ink-muted);
  margin-top: var(--space-xs);
}

.group {
  margin-top: var(--space-lg);
}

.group-title {
  color: var(--color-ink-secondary);
  margin-bottom: var(--space-xs);
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
  padding: var(--space-xxs) 0;
}

.row-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.swatches {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  flex-shrink: 0;
}

.swatch {
  width: 18px;
  height: 18px;
  border-radius: var(--rounded-full);
  border: 1.5px solid transparent;
  padding: 0;
  cursor: pointer;
  background: var(--swatch-color);
}

.swatch.none {
  background: var(--color-canvas-surface);
  border-color: var(--color-border-strong);
  position: relative;
}

.swatch.none::after {
  content: '';
  position: absolute;
  inset: 3px;
  border-top: 1.5px solid var(--color-ink-muted);
  transform: rotate(-45deg);
}

.swatch.selected {
  border-color: var(--color-ink);
  outline: 2px solid var(--color-canvas-surface);
  outline-offset: -4px;
}
</style>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { TAG_COLOR_KEYS, type TagColorKey } from '@/config/tagColors'
import type { BoardColumn, Priority } from '@/types/work-item'

const props = defineProps<{
  open: boolean
  statuses: BoardColumn[]
  tags: string[]
  statusColors: Record<string, TagColorKey>
  priorityColors: Partial<Record<Priority, TagColorKey>>
  tagColors: Record<string, TagColorKey>
}>()
const emit = defineEmits<{
  'update:statusColors': [Record<string, TagColorKey>]
  'update:priorityColors': [Partial<Record<Priority, TagColorKey>>]
  'update:tagColors': [Record<string, TagColorKey>]
  close: []
}>()

const { t } = useI18n()

const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'urgent']

function setStatusColor(statusId: string, color: TagColorKey | null): void {
  const next = { ...props.statusColors }
  if (color) next[statusId] = color
  else delete next[statusId]
  emit('update:statusColors', next)
}

function setPriorityColor(priority: Priority, color: TagColorKey | null): void {
  const next = { ...props.priorityColors }
  if (color) next[priority] = color
  else delete next[priority]
  emit('update:priorityColors', next)
}

function setTagColor(tag: string, color: TagColorKey | null): void {
  const next = { ...props.tagColors }
  if (color) next[tag] = color
  else delete next[tag]
  emit('update:tagColors', next)
}
</script>

<template>
  <div v-if="open" class="overlay" @click.self="emit('close')">
    <div class="panel">
      <h2 class="type-section-title title">{{ t('list.colorSettingsTitle') }}</h2>

      <section v-if="statuses.length" class="group">
        <h3 class="type-label group-title">{{ t('list.colorSettingsStatus') }}</h3>
        <div v-for="status in statuses" :key="status.id" class="row">
          <span class="type-body-sm row-label">{{ status.name }}</span>
          <div class="swatches">
            <button
              type="button"
              class="swatch none"
              :class="{ selected: !statusColors[status.id] }"
              :title="t('list.colorNone')"
              @click="setStatusColor(status.id, null)"
            ></button>
            <button
              v-for="key in TAG_COLOR_KEYS"
              :key="key"
              type="button"
              class="swatch"
              :class="{ selected: statusColors[status.id] === key }"
              :style="{ '--swatch-color': `var(--tag-color-${key})` }"
              :title="t(`list.colorNames.${key}`)"
              @click="setStatusColor(status.id, key)"
            ></button>
          </div>
        </div>
      </section>

      <section class="group">
        <h3 class="type-label group-title">{{ t('list.colorSettingsPriority') }}</h3>
        <div v-for="priority in PRIORITIES" :key="priority" class="row">
          <span class="type-body-sm row-label">{{ t(`priority.${priority}`) }}</span>
          <div class="swatches">
            <button
              type="button"
              class="swatch none"
              :class="{ selected: !priorityColors[priority] }"
              :title="t('list.colorNone')"
              @click="setPriorityColor(priority, null)"
            ></button>
            <button
              v-for="key in TAG_COLOR_KEYS"
              :key="key"
              type="button"
              class="swatch"
              :class="{ selected: priorityColors[priority] === key }"
              :style="{ '--swatch-color': `var(--tag-color-${key})` }"
              :title="t(`list.colorNames.${key}`)"
              @click="setPriorityColor(priority, key)"
            ></button>
          </div>
        </div>
      </section>

      <section v-if="tags.length" class="group">
        <h3 class="type-label group-title">{{ t('list.colorSettingsTags') }}</h3>
        <div v-for="tag in tags" :key="tag" class="row">
          <span class="type-body-sm row-label">{{ tag }}</span>
          <div class="swatches">
            <button
              type="button"
              class="swatch none"
              :class="{ selected: !tagColors[tag] }"
              :title="t('list.colorNone')"
              @click="setTagColor(tag, null)"
            ></button>
            <button
              v-for="key in TAG_COLOR_KEYS"
              :key="key"
              type="button"
              class="swatch"
              :class="{ selected: tagColors[tag] === key }"
              :style="{ '--swatch-color': `var(--tag-color-${key})` }"
              :title="t(`list.colorNames.${key}`)"
              @click="setTagColor(tag, key)"
            ></button>
          </div>
        </div>
      </section>

      <div class="actions">
        <button type="button" class="btn btn-primary" @click="emit('close')">
          {{ t('common.close') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

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

.title {
  margin: 0 0 var(--space-md);
}

.group + .group {
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
  gap: 6px;
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

.actions {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--space-lg);
}
</style>

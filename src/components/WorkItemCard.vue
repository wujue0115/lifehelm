<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { WorkItem } from '@/types/work-item'
import type { TagColorKey } from '@/config/tagColors'
import StatusBadge from './StatusBadge.vue'
import PriorityBadge from './PriorityBadge.vue'
import TagPill from './TagPill.vue'
import DueDateLabel from './DueDateLabel.vue'

defineProps<{
  item: WorkItem
  statusName?: string
  isCompleted?: boolean
  statusColor?: TagColorKey
  priorityColor?: TagColorKey
  tagColors?: Record<string, TagColorKey>
}>()
const { t } = useI18n()
</script>

<template>
  <RouterLink :to="`/items/${item.id}`" class="work-card">
    <div class="card-header">
      <span class="card-drag-handle" :title="t('view.dragHandle')">⠿</span>
      <p class="title type-body-sm">{{ item.title }}</p>
    </div>
    <div class="meta">
      <StatusBadge
        v-if="statusName"
        :name="statusName"
        :completed="isCompleted"
        :color="statusColor"
      />
      <PriorityBadge v-if="item.priority" :priority="item.priority" :color="priorityColor" />
      <DueDateLabel
        :start-date="item.startDate"
        :due-date="item.dueDate"
        :is-completed="isCompleted"
      />
    </div>
    <div v-if="item.tags.length" class="tags">
      <TagPill v-for="tag in item.tags" :key="tag" :label="tag" :color="tagColors?.[tag]" />
    </div>
  </RouterLink>
</template>

<style scoped>
.work-card {
  display: block;
  background: var(--color-canvas-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--rounded-sm);
  padding: var(--space-sm);
  text-decoration: none;
  color: var(--color-ink);
}

.work-card:hover {
  border-color: var(--color-border-strong);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

/* Pure visual affordance — the whole card is the drag surface (the inner
   VueDraggable in BoardPanel.vue has no `handle`, so any mousedown that
   moves far enough starts a drag; one that doesn't still navigates via the
   RouterLink), so this just dims until the card itself is hovered. */
.card-drag-handle {
  color: var(--color-ink-muted);
  flex-shrink: 0;
}

.work-card:hover .card-drag-handle {
  color: var(--color-ink);
}

.title {
  flex: 1;
  min-width: 0;
  font-weight: 500;
  margin: 0;
}

.meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
</style>

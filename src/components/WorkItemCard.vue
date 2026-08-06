<script setup lang="ts">
import type { WorkItem } from '@/types/work-item'
import PriorityBadge from './PriorityBadge.vue'
import TagPill from './TagPill.vue'
import DueDateLabel from './DueDateLabel.vue'

defineProps<{ item: WorkItem; isCompleted?: boolean }>()
</script>

<template>
  <RouterLink :to="`/items/${item.id}`" class="work-card">
    <p class="title type-body-sm">{{ item.title }}</p>
    <div class="meta">
      <PriorityBadge :priority="item.priority" />
      <DueDateLabel
        :start-date="item.startDate"
        :due-date="item.dueDate"
        :is-completed="isCompleted"
      />
    </div>
    <div v-if="item.tags.length" class="tags">
      <TagPill v-for="tag in item.tags" :key="tag" :label="tag" />
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
  cursor: grab;
}

.work-card:hover {
  border-color: var(--color-border-strong);
}

.title {
  font-weight: 500;
  margin: 0 0 8px;
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

<script setup lang="ts">
import { computed } from 'vue'
import type { WorkItem } from '@/types/work-item'
import PriorityBadge from './PriorityBadge.vue'
import TagPill from './TagPill.vue'

const props = defineProps<{ item: WorkItem }>()

const dueDateLabel = computed(() =>
  props.item.dueDate ? new Date(props.item.dueDate).toLocaleDateString('zh-TW') : null,
)
</script>

<template>
  <RouterLink :to="`/items/${item.id}`" class="card">
    <p class="title type-body-md">{{ item.title }}</p>
    <div class="meta">
      <PriorityBadge :priority="item.priority" />
      <span v-if="dueDateLabel" class="due type-caption">{{ dueDateLabel }}</span>
    </div>
    <div v-if="item.tags.length" class="tags">
      <TagPill v-for="tag in item.tags" :key="tag" :label="tag" />
    </div>
  </RouterLink>
</template>

<style scoped>
.card {
  display: block;
  background: var(--color-canvas-light);
  border: 1px solid var(--color-hairline-on-light);
  border-radius: var(--rounded-sm);
  padding: 12px;
  text-decoration: none;
  color: var(--color-ink);
  cursor: grab;
}

.title {
  font-weight: 700;
  margin: 0 0 8px;
}

.meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.due {
  color: var(--color-ink-mute);
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
</style>

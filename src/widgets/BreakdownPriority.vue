<script setup lang="ts">
import { computed } from 'vue'
import { useWorkItemsStore } from '@/stores/workItems'
import { computeStats } from '@/utils/stats'
import { usePriorityLabel } from '@/composables/usePriorityLabel'

defineOptions({ inheritAttrs: false })

const store = useWorkItemsStore()
const priorityLabel = usePriorityLabel()
const stats = computed(() => computeStats(store.items, store.statuses, store.priorities))
const maxPriorityCount = computed(() =>
  Math.max(1, ...stats.value.priorityCounts.map((p) => p.count)),
)
</script>

<template>
  <div class="bar-list">
    <div v-for="p in stats.priorityCounts" :key="p.priority" class="bar-row">
      <span class="type-body-sm bar-label">{{ priorityLabel(p.priority) }}</span>
      <div class="bar-track">
        <div class="bar-fill" :style="{ width: `${(p.count / maxPriorityCount) * 100}%` }"></div>
      </div>
      <span class="type-caption bar-count">{{ p.count }}</span>
    </div>
  </div>
</template>

<style scoped>
.bar-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.bar-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.bar-label {
  width: 100px;
  flex-shrink: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bar-track {
  flex: 1;
  background: var(--color-canvas-app);
  border-radius: var(--rounded-xs);
  height: 10px;
  overflow: hidden;
}

.bar-fill {
  background: var(--color-ink);
  height: 100%;
  border-radius: var(--rounded-xs);
}

.bar-count {
  width: 32px;
  text-align: right;
  color: var(--color-ink-secondary);
}
</style>

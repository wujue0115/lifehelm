<script setup lang="ts">
import { computed } from 'vue'
import { useWorkItemsStore } from '@/stores/workItems'
import { computeStats } from '@/utils/stats'

defineOptions({ inheritAttrs: false })

const store = useWorkItemsStore()
const stats = computed(() => computeStats(store.items, store.board))
const maxStatusCount = computed(() => Math.max(1, ...stats.value.statusCounts.map((s) => s.count)))
</script>

<template>
  <div class="bar-list">
    <div v-for="status in stats.statusCounts" :key="status.columnId" class="bar-row">
      <span class="type-body-sm bar-label">{{ status.name }}</span>
      <div class="bar-track">
        <div class="bar-fill" :style="{ width: `${(status.count / maxStatusCount) * 100}%` }"></div>
      </div>
      <span class="type-caption bar-count">{{ status.count }}</span>
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

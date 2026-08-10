<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useWorkItemsStore } from '@/stores/workItems'
import { computeStats } from '@/utils/stats'
import type { Priority } from '@/types/work-item'

defineOptions({ inheritAttrs: false })

const { t } = useI18n()
const store = useWorkItemsStore()
const stats = computed(() => computeStats(store.items, store.board))
const maxPriorityCount = computed(() => Math.max(1, ...Object.values(stats.value.priorityCounts)))
const priorityOrder: Priority[] = ['urgent', 'high', 'medium', 'low']
</script>

<template>
  <div class="bar-list">
    <div v-for="key in priorityOrder" :key="key" class="bar-row">
      <span class="type-body-sm bar-label">{{ t(`priority.${key}`) }}</span>
      <div class="bar-track">
        <div
          class="bar-fill"
          :style="{ width: `${(stats.priorityCounts[key] / maxPriorityCount) * 100}%` }"
        ></div>
      </div>
      <span class="type-caption bar-count">{{ stats.priorityCounts[key] }}</span>
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

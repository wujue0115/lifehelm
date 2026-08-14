<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useWorkItemsStore } from '@/stores/workItems'
import { computeStats } from '@/utils/stats'

defineOptions({ inheritAttrs: false })

const { t } = useI18n()
const store = useWorkItemsStore()
const stats = computed(() => computeStats(store.items, store.statuses, store.priorities))
const maxTagCount = computed(() =>
  Math.max(1, ...stats.value.tagCounts.map((tagCount) => tagCount.count)),
)
</script>

<template>
  <p v-if="stats.tagCounts.length === 0" class="type-body empty">
    {{ t('dashboard.noTags') }}
  </p>
  <div v-else class="bar-list">
    <div v-for="tag in stats.tagCounts" :key="tag.tag" class="bar-row">
      <span class="type-body-sm bar-label">{{ tag.tag }}</span>
      <div class="bar-track">
        <div class="bar-fill" :style="{ width: `${(tag.count / maxTagCount) * 100}%` }"></div>
      </div>
      <span class="type-caption bar-count">{{ tag.count }}</span>
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

.empty {
  color: var(--color-ink-muted);
}
</style>

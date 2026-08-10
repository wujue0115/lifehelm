<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useWorkItemsStore } from '@/stores/workItems'
import { computeStats } from '@/utils/stats'
import { formatDuration } from '@/utils/duration'
import type { Priority } from '@/types/work-item'

const { t } = useI18n()
const store = useWorkItemsStore()

onMounted(() => {
  store.fetchAll()
})

const stats = computed(() => computeStats(store.items, store.board))

const maxStatusCount = computed(() => Math.max(1, ...stats.value.statusCounts.map((s) => s.count)))
const maxTagCount = computed(() =>
  Math.max(1, ...stats.value.tagCounts.map((tagCount) => tagCount.count)),
)
const maxPriorityCount = computed(() => Math.max(1, ...Object.values(stats.value.priorityCounts)))

const priorityOrder: Priority[] = ['urgent', 'high', 'medium', 'low']
</script>

<template>
  <main class="dashboard-view">
    <p v-if="store.loading" class="type-body">{{ t('common.loading') }}</p>
    <template v-else>
      <div class="summary-grid">
        <div class="summary-card">
          <span class="type-label">{{ t('dashboard.total') }}</span>
          <span class="value">{{ stats.total }}</span>
        </div>
        <div class="summary-card">
          <span class="type-label">{{ t('dashboard.completionRate') }}</span>
          <span class="value">{{ stats.completionRate }}%</span>
        </div>
        <div class="summary-card" :class="{ warn: stats.overdueCount > 0 }">
          <span class="type-label">{{ t('dashboard.overdue') }}</span>
          <span class="value">{{ stats.overdueCount }}</span>
        </div>
        <div class="summary-card">
          <span class="type-label">{{ t('dashboard.dueToday') }}</span>
          <span class="value">{{ stats.dueTodayCount }}</span>
        </div>
        <div class="summary-card">
          <span class="type-label">{{ t('dashboard.trackedTime') }}</span>
          <span class="value duration-value">{{
            formatDuration(stats.totalTrackedSeconds, t)
          }}</span>
        </div>
      </div>

      <section class="section card">
        <h2 class="type-section-title">{{ t('dashboard.statusBreakdown') }}</h2>
        <div class="bar-list">
          <div v-for="status in stats.statusCounts" :key="status.columnId" class="bar-row">
            <span class="type-body-sm bar-label">{{ status.name }}</span>
            <div class="bar-track">
              <div
                class="bar-fill"
                :style="{ width: `${(status.count / maxStatusCount) * 100}%` }"
              ></div>
            </div>
            <span class="type-caption bar-count">{{ status.count }}</span>
          </div>
        </div>
      </section>

      <section class="section card">
        <h2 class="type-section-title">{{ t('dashboard.priorityBreakdown') }}</h2>
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
      </section>

      <section class="section card">
        <h2 class="type-section-title">{{ t('dashboard.tagBreakdown') }}</h2>
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
      </section>
    </template>
  </main>
</template>

<style scoped>
.dashboard-view {
  padding: var(--space-xl);
  max-width: 960px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--space-md);
  margin-bottom: var(--space-xl);
}

.summary-card {
  background: var(--color-canvas-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--rounded-md);
  padding: var(--space-md);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary-card.warn {
  border: 1.5px solid var(--color-ink);
}

.summary-card .value {
  font-family: var(--font-sans);
  font-size: 32px;
  font-weight: 700;
  line-height: 1.1;
}

.summary-card .duration-value {
  font-size: 20px;
}

.section {
  margin-bottom: var(--space-xl);
}

.section .type-section-title {
  margin-bottom: var(--space-sm);
}

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

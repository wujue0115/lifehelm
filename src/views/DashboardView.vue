<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useWorkItemsStore } from '@/stores/workItems'
import { computeStats } from '@/utils/stats'
import { formatDuration } from '@/utils/duration'
import type { Priority } from '@/types/work-item'

const store = useWorkItemsStore()

onMounted(() => {
  store.fetchAll()
})

const stats = computed(() => computeStats(store.items, store.board))

const maxStatusCount = computed(() => Math.max(1, ...stats.value.statusCounts.map((s) => s.count)))
const maxTagCount = computed(() => Math.max(1, ...stats.value.tagCounts.map((t) => t.count)))
const maxPriorityCount = computed(() => Math.max(1, ...Object.values(stats.value.priorityCounts)))

const priorityLabels: Record<Priority, string> = {
  low: '低',
  medium: '中',
  high: '高',
  urgent: '緊急',
}
const priorityOrder: Priority[] = ['urgent', 'high', 'medium', 'low']
</script>

<template>
  <main class="dashboard-view">
    <p v-if="store.loading" class="type-body">載入中…</p>
    <template v-else>
      <div class="summary-grid">
        <div class="summary-card">
          <span class="type-label">總項目數</span>
          <span class="value">{{ stats.total }}</span>
        </div>
        <div class="summary-card">
          <span class="type-label">完成率</span>
          <span class="value">{{ stats.completionRate }}%</span>
        </div>
        <div class="summary-card" :class="{ warn: stats.overdueCount > 0 }">
          <span class="type-label">已逾期</span>
          <span class="value">{{ stats.overdueCount }}</span>
        </div>
        <div class="summary-card">
          <span class="type-label">今天到期</span>
          <span class="value">{{ stats.dueTodayCount }}</span>
        </div>
        <div class="summary-card">
          <span class="type-label">累積時數</span>
          <span class="value duration-value">{{ formatDuration(stats.totalTrackedSeconds) }}</span>
        </div>
      </div>

      <section class="section card">
        <h2 class="type-section-title">各狀態數量</h2>
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
        <h2 class="type-section-title">優先級分佈</h2>
        <div class="bar-list">
          <div v-for="key in priorityOrder" :key="key" class="bar-row">
            <span class="type-body-sm bar-label">{{ priorityLabels[key] }}</span>
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
        <h2 class="type-section-title">標籤分佈</h2>
        <p v-if="stats.tagCounts.length === 0" class="type-body empty">尚無標籤資料</p>
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
  font-family: 'D-DIN-Bold', 'Arial Narrow', Arial, Verdana, sans-serif;
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

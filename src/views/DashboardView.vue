<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useWorkItemsStore } from '@/stores/workItems'
import { computeStats } from '@/utils/stats'
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
    <div class="header">
      <h1 class="type-display-lg">統計儀表板</h1>
    </div>

    <p v-if="store.loading" class="type-body-md">載入中…</p>
    <template v-else>
      <div class="summary-grid">
        <div class="summary-card">
          <span class="type-micro-cap">總項目數</span>
          <span class="value">{{ stats.total }}</span>
        </div>
        <div class="summary-card">
          <span class="type-micro-cap">完成率</span>
          <span class="value">{{ stats.completionRate }}%</span>
        </div>
        <div class="summary-card" :class="{ warn: stats.overdueCount > 0 }">
          <span class="type-micro-cap">已逾期</span>
          <span class="value">{{ stats.overdueCount }}</span>
        </div>
        <div class="summary-card">
          <span class="type-micro-cap">今天到期</span>
          <span class="value">{{ stats.dueTodayCount }}</span>
        </div>
      </div>

      <section class="section">
        <h2 class="type-button-cap section-title">各狀態數量</h2>
        <div class="bar-list">
          <div v-for="status in stats.statusCounts" :key="status.columnId" class="bar-row">
            <span class="type-body-md bar-label">{{ status.name }}</span>
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

      <section class="section">
        <h2 class="type-button-cap section-title">優先級分佈</h2>
        <div class="bar-list">
          <div v-for="key in priorityOrder" :key="key" class="bar-row">
            <span class="type-body-md bar-label">{{ priorityLabels[key] }}</span>
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

      <section class="section">
        <h2 class="type-button-cap section-title">標籤分佈</h2>
        <p v-if="stats.tagCounts.length === 0" class="type-body-md empty">尚無標籤資料</p>
        <div v-else class="bar-list">
          <div v-for="tag in stats.tagCounts" :key="tag.tag" class="bar-row">
            <span class="type-body-md bar-label">{{ tag.tag }}</span>
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
  padding: 32px;
  max-width: 900px;
  margin: 0 auto;
}

.header {
  margin-bottom: 24px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.summary-card {
  border: 1px solid var(--color-hairline-on-light);
  border-radius: var(--rounded-sm);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary-card.warn {
  border: 2px solid var(--color-ink);
}

.summary-card .value {
  font-family: 'D-DIN-Bold', 'Arial Narrow', Arial, Verdana, sans-serif;
  font-size: 40px;
  font-weight: 700;
  line-height: 1.1;
}

.section {
  margin-bottom: 32px;
}

.section-title {
  color: var(--color-ink-mute);
  margin-bottom: 12px;
}

.bar-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bar-row {
  display: flex;
  align-items: center;
  gap: 12px;
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
  background: var(--color-canvas-cool);
  border-radius: var(--rounded-xs);
  height: 12px;
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
  color: var(--color-ink-mute);
}

.empty {
  color: var(--color-ink-mute);
}
</style>

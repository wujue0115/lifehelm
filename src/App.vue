<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppSidebar from '@/components/AppSidebar.vue'
import { useWorkItemsStore } from '@/stores/workItems'
import { getDueStatus } from '@/utils/dueDate'

const route = useRoute()
const store = useWorkItemsStore()
const dismissed = ref(false)

onMounted(() => {
  store.fetchAll()
})

const pageTitle = computed(() => (typeof route.meta.title === 'string' ? route.meta.title : ''))

const overdueCount = computed(
  () =>
    store.items.filter(
      (item) => getDueStatus(item.dueDate, store.isItemCompleted(item)) === 'overdue',
    ).length,
)
const dueTodayCount = computed(
  () =>
    store.items.filter(
      (item) => getDueStatus(item.dueDate, store.isItemCompleted(item)) === 'due-today',
    ).length,
)
const showBanner = computed(
  () => !dismissed.value && (overdueCount.value > 0 || dueTodayCount.value > 0),
)
</script>

<template>
  <div class="shell">
    <AppSidebar />
    <div class="main">
      <header class="topbar">
        <h1 class="type-page-title">{{ pageTitle }}</h1>
      </header>

      <div v-if="showBanner" class="reminder-banner type-body-sm">
        <span>
          <template v-if="overdueCount > 0">{{ overdueCount }} 個項目已逾期</template>
          <template v-if="overdueCount > 0 && dueTodayCount > 0">，</template>
          <template v-if="dueTodayCount > 0">{{ dueTodayCount }} 個項目今天到期</template>
        </span>
        <button type="button" class="dismiss" aria-label="關閉提醒" @click="dismissed = true">
          ×
        </button>
      </div>

      <main class="content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.shell {
  display: flex;
  min-height: 100vh;
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.topbar {
  height: 56px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding: 0 var(--space-xl);
  background: var(--color-canvas-surface);
  border-bottom: 1px solid var(--color-border-subtle);
}

.reminder-banner {
  background: var(--color-surface-hover);
  border-bottom: 1px solid var(--color-border-subtle);
  padding: var(--space-sm) var(--space-xl);
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--color-ink-secondary);
}

.dismiss {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  color: var(--color-ink-secondary);
}

.content {
  flex: 1;
  background: var(--color-canvas-app);
  overflow-y: auto;
}
</style>

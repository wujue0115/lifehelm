<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppNav from '@/components/AppNav.vue'
import { useWorkItemsStore } from '@/stores/workItems'
import { getDueStatus } from '@/utils/dueDate'

const store = useWorkItemsStore()
const dismissed = ref(false)

onMounted(() => {
  store.fetchAll()
})

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
  <AppNav />
  <div v-if="showBanner" class="reminder-banner type-body-md">
    <span>
      <template v-if="overdueCount > 0">{{ overdueCount }} 個項目已逾期</template>
      <template v-if="overdueCount > 0 && dueTodayCount > 0">，</template>
      <template v-if="dueTodayCount > 0">{{ dueTodayCount }} 個項目今天到期</template>
    </span>
    <button type="button" class="dismiss" aria-label="關閉提醒" @click="dismissed = true">×</button>
  </div>
  <RouterView />
</template>

<style scoped>
.reminder-banner {
  background: var(--color-canvas-cool);
  border-bottom: 1px solid var(--color-hairline-on-light);
  padding: 12px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dismiss {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  color: var(--color-ink);
}
</style>

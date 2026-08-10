<script setup lang="ts">
import { computed } from 'vue'
import { useWorkItemsStore } from '@/stores/workItems'
import { computeStats } from '@/utils/stats'

defineOptions({ inheritAttrs: false })

const store = useWorkItemsStore()
const stats = computed(() => computeStats(store.items, store.board))
</script>

<template>
  <span class="stat-value" :class="{ warn: stats.overdueCount > 0 }">{{ stats.overdueCount }}</span>
</template>

<style scoped>
.stat-value {
  font-family: var(--font-sans);
  font-size: 32px;
  font-weight: 700;
  line-height: 1.1;
}

.stat-value.warn {
  color: var(--color-ink);
}
</style>

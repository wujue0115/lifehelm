<script setup lang="ts">
import { computed } from 'vue'
import { useWorkItemsStore } from '@/stores/workItems'
import { computeStats } from '@/utils/stats'

defineOptions({ inheritAttrs: false })

const store = useWorkItemsStore()
const stats = computed(() => computeStats(store.items, store.statuses, store.priorities))
</script>

<template>
  <span class="stat-value">{{ stats.total }}</span>
</template>

<style scoped>
.stat-value {
  font-family: var(--font-sans);
  font-size: 32px;
  font-weight: 700;
  line-height: 1.1;
}
</style>

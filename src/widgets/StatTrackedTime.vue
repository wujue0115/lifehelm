<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useWorkItemsStore } from '@/stores/workItems'
import { computeStats } from '@/utils/stats'
import { formatDuration } from '@/utils/duration'

defineOptions({ inheritAttrs: false })

const { t } = useI18n()
const store = useWorkItemsStore()
const stats = computed(() => computeStats(store.items, store.board))
</script>

<template>
  <span class="stat-value duration-value">{{ formatDuration(stats.totalTrackedSeconds, t) }}</span>
</template>

<style scoped>
.stat-value {
  font-family: var(--font-sans);
  font-size: 32px;
  font-weight: 700;
  line-height: 1.1;
}

.duration-value {
  font-size: 20px;
}
</style>

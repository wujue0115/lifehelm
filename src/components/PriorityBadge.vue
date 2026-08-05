<script setup lang="ts">
import { computed } from 'vue'
import type { Priority } from '@/types/work-item'

const props = defineProps<{ priority: Priority }>()

const labels: Record<Priority, string> = { low: '低', medium: '中', high: '高', urgent: '緊急' }
const label = computed(() => labels[props.priority])
</script>

<template>
  <span class="badge type-micro-cap" :class="priority">{{ label }}</span>
</template>

<style scoped>
.badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: var(--rounded-full);
  color: var(--color-ink);
  border: 1px solid var(--color-hairline-on-light);
  white-space: nowrap;
}

.badge.low {
  color: var(--color-ink-mute);
}

.badge.high {
  border: 2px solid var(--color-ink);
}

.badge.urgent {
  background: var(--color-ink);
  color: var(--color-on-primary);
  border-color: var(--color-ink);
}
</style>

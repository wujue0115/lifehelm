<script setup lang="ts">
import { computed } from 'vue'
import type { Priority } from '@/types/work-item'

const props = defineProps<{ priority: Priority }>()

const labels: Record<Priority, string> = { low: '低', medium: '中', high: '高', urgent: '緊急' }
const label = computed(() => labels[props.priority])
</script>

<template>
  <span class="badge type-label" :class="priority">{{ label }}</span>
</template>

<style scoped>
.badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: var(--rounded-full);
  color: var(--color-ink-secondary);
  border: 1px solid var(--color-border-subtle);
  white-space: nowrap;
}

.badge.low {
  color: var(--color-ink-muted);
}

.badge.high {
  border: 1.5px solid var(--color-ink);
  color: var(--color-ink);
}

.badge.urgent {
  background: var(--color-ink);
  color: var(--color-canvas-surface);
  border-color: var(--color-ink);
}
</style>

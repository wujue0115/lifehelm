<script setup lang="ts">
import { computed } from 'vue'
import { getDueStatus } from '@/utils/dueDate'

const props = defineProps<{
  startDate?: string | null
  dueDate: string | null
  isCompleted?: boolean
}>()

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('zh-TW')
}

const dateLabel = computed(() => {
  if (props.startDate && props.dueDate) {
    return `${formatDate(props.startDate)} → ${formatDate(props.dueDate)}`
  }
  if (props.startDate) return `${formatDate(props.startDate)} 起`
  if (props.dueDate) return formatDate(props.dueDate)
  return null
})
const status = computed(() => getDueStatus(props.dueDate, props.isCompleted ?? false))

const statusLabel = computed(() => {
  switch (status.value) {
    case 'overdue':
      return '已逾期'
    case 'due-today':
      return '今天到期'
    case 'due-soon':
      return '即將到期'
    default:
      return null
  }
})
</script>

<template>
  <span v-if="dateLabel" class="due-date">
    <span class="type-caption date-text">{{ dateLabel }}</span>
    <span v-if="statusLabel" class="type-micro-cap status" :class="status">{{ statusLabel }}</span>
  </span>
  <span v-else class="type-caption date-text">—</span>
</template>

<style scoped>
.due-date {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.date-text {
  color: var(--color-ink-mute);
}

.status {
  padding: 2px 8px;
  border-radius: var(--rounded-full);
  border: 1px solid var(--color-ink);
  white-space: nowrap;
}

.status.overdue {
  background: var(--color-ink);
  color: var(--color-on-primary);
}

.status.due-today {
  border-width: 2px;
}

.status.due-soon {
  color: var(--color-ink-mute);
  border-color: var(--color-hairline-on-light);
}
</style>

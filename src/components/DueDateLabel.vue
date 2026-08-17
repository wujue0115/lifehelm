<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { getDueStatus } from '@/utils/dueDate'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{
  startDate?: string | null
  dueDate: string | null
  isCompleted?: boolean
}>()

const { t } = useI18n()

function formatDate(value: string): string {
  return formatDateTime(value, 'YYYY/M/D')
}

const dateLabel = computed(() => {
  if (props.startDate && props.dueDate) {
    return `${formatDate(props.startDate)} ~ ${formatDate(props.dueDate)}`
  }
  if (props.startDate) return t('dueDate.startSuffix', { date: formatDate(props.startDate) })
  if (props.dueDate) return formatDate(props.dueDate)
  return null
})
const status = computed(() => getDueStatus(props.dueDate, props.isCompleted ?? false))

const statusLabel = computed(() => {
  switch (status.value) {
    case 'overdue':
      return t('dueStatus.overdue')
    case 'due-today':
      return t('dueStatus.dueToday')
    case 'due-soon':
      return t('dueStatus.dueSoon')
    default:
      return null
  }
})
</script>

<template>
  <span v-if="dateLabel" class="due-date">
    <span class="type-caption date-text">{{ dateLabel }}</span>
    <span v-if="statusLabel" class="type-label status" :class="status">{{ statusLabel }}</span>
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
  color: var(--color-ink-muted);
}

.status {
  padding: 2px 8px;
  border-radius: var(--rounded-full);
  border: 1px solid var(--color-border-subtle);
  color: var(--color-ink-secondary);
  white-space: nowrap;
}

.status.overdue {
  background: var(--color-ink);
  color: var(--color-canvas-surface);
  border-color: var(--color-ink);
}

.status.due-today {
  border: 1.5px solid var(--color-ink);
  color: var(--color-ink);
}

.status.due-soon {
  color: var(--color-ink-muted);
}
</style>

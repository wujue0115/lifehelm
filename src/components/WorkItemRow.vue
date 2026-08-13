<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { WorkItem } from '@/types/work-item'
import type { TagColorKey } from '@/config/tagColors'
import StatusBadge from './StatusBadge.vue'
import PriorityBadge from './PriorityBadge.vue'
import TagPill from './TagPill.vue'
import DueDateLabel from './DueDateLabel.vue'
import ActionIcon from './ActionIcon.vue'

const { t } = useI18n()
defineProps<{
  item: WorkItem
  statusName: string
  isCompleted: boolean
  statusColor?: TagColorKey
  priorityColor?: TagColorKey
  tagColors?: Record<string, TagColorKey>
}>()
const emit = defineEmits<{ delete: [id: string] }>()
</script>

<template>
  <tr class="row">
    <td class="type-body-sm">
      <RouterLink :to="`/items/${item.id}`" class="title-link">{{ item.title }}</RouterLink>
    </td>
    <td><StatusBadge :name="statusName" :completed="isCompleted" :color="statusColor" /></td>
    <td><PriorityBadge :priority="item.priority" :color="priorityColor" /></td>
    <td>
      <TagPill v-for="tag in item.tags" :key="tag" :label="tag" :color="tagColors?.[tag]" />
    </td>
    <td>
      <DueDateLabel
        :start-date="item.startDate"
        :due-date="item.dueDate"
        :is-completed="isCompleted"
      />
    </td>
    <td class="actions">
      <RouterLink :to="`/items/${item.id}`" class="btn-ghost action-btn" :title="t('common.edit')">
        <ActionIcon type="edit" />
      </RouterLink>
      <button
        type="button"
        class="btn-ghost action-btn"
        :title="t('common.delete')"
        @click="emit('delete', item.id)"
      >
        <ActionIcon type="delete" />
      </button>
    </td>
  </tr>
</template>

<style scoped>
.row {
  border-bottom: 1px solid var(--color-border-subtle);
}

.row:hover {
  background: var(--color-surface-hover);
}

.row td {
  padding: 10px 12px;
  vertical-align: middle;
}

.title-link {
  color: var(--color-ink);
  text-decoration: none;
  font-weight: 500;
}

.title-link:hover {
  text-decoration: underline;
}

.actions {
  display: flex;
  gap: var(--space-xs);
  white-space: nowrap;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  min-height: auto;
}
</style>

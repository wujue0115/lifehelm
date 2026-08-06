<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { WorkItem } from '@/types/work-item'
import StatusBadge from './StatusBadge.vue'
import PriorityBadge from './PriorityBadge.vue'
import TagPill from './TagPill.vue'
import DueDateLabel from './DueDateLabel.vue'

const { t } = useI18n()
defineProps<{ item: WorkItem; statusName: string; isCompleted: boolean }>()
const emit = defineEmits<{ delete: [id: string] }>()
</script>

<template>
  <tr class="row">
    <td class="type-body-sm">
      <RouterLink :to="`/items/${item.id}`" class="title-link">{{ item.title }}</RouterLink>
    </td>
    <td><StatusBadge :name="statusName" :completed="isCompleted" /></td>
    <td><PriorityBadge :priority="item.priority" /></td>
    <td>
      <TagPill v-for="tag in item.tags" :key="tag" :label="tag" />
    </td>
    <td>
      <DueDateLabel
        :start-date="item.startDate"
        :due-date="item.dueDate"
        :is-completed="isCompleted"
      />
    </td>
    <td class="actions">
      <RouterLink :to="`/items/${item.id}`" class="btn btn-ghost action-btn">{{
        t('common.edit')
      }}</RouterLink>
      <button type="button" class="btn btn-ghost action-btn" @click="emit('delete', item.id)">
        {{ t('common.delete') }}
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
  gap: 4px;
  white-space: nowrap;
}

.action-btn {
  min-height: 28px;
  padding: 4px 10px;
}
</style>

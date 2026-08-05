<script setup lang="ts">
import { computed } from 'vue'
import type { WorkItem } from '@/types/work-item'
import StatusBadge from './StatusBadge.vue'
import PriorityBadge from './PriorityBadge.vue'
import TagPill from './TagPill.vue'

const props = defineProps<{ item: WorkItem; statusName: string; isCompleted: boolean }>()
const emit = defineEmits<{ delete: [id: string] }>()

const dueDateLabel = computed(() =>
  props.item.dueDate ? new Date(props.item.dueDate).toLocaleDateString('zh-TW') : '—',
)
</script>

<template>
  <tr class="row">
    <td class="type-body-md">
      <RouterLink :to="`/items/${item.id}`" class="title-link">{{ item.title }}</RouterLink>
    </td>
    <td><StatusBadge :name="statusName" :completed="isCompleted" /></td>
    <td><PriorityBadge :priority="item.priority" /></td>
    <td>
      <TagPill v-for="tag in item.tags" :key="tag" :label="tag" />
    </td>
    <td class="type-body-md">{{ dueDateLabel }}</td>
    <td class="actions">
      <RouterLink :to="`/items/${item.id}`" class="type-button-cap link">編輯</RouterLink>
      <button type="button" class="type-button-cap link" @click="emit('delete', item.id)">
        刪除
      </button>
    </td>
  </tr>
</template>

<style scoped>
.row {
  border-bottom: 1px solid var(--color-hairline-on-light);
}

.row td {
  padding: 12px 8px;
  vertical-align: middle;
}

.title-link {
  color: var(--color-ink);
  text-decoration: underline;
}

.actions {
  display: flex;
  gap: 16px;
  white-space: nowrap;
}

.link {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-ink);
  text-decoration: underline;
  padding: 0;
}
</style>

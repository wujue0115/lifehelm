<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { WorkItem } from '@/types/work-item'
import type { TagColorKey } from '@/config/tagColors'
import StatusBadge from './StatusBadge.vue'
import PriorityBadge from './PriorityBadge.vue'
import TagPill from './TagPill.vue'
import DueDateLabel from './DueDateLabel.vue'
import ActionIcon from './ActionIcon.vue'
import SelectMenu, { type SelectMenuOption } from './SelectMenu.vue'
import TagsInput from './TagsInput.vue'

const { t } = useI18n()
const props = defineProps<{
  item: WorkItem
  statusName: string
  isCompleted: boolean
  statusColor?: TagColorKey
  priorityColor?: TagColorKey
  tagColors?: Record<string, TagColorKey>
  statusOptions: SelectMenuOption[]
  priorityOptions: SelectMenuOption[]
  statusColorMap?: Record<string, TagColorKey | undefined>
  priorityColorMap?: Record<string, TagColorKey | undefined>
  allTags: string[]
}>()
const emit = defineEmits<{
  delete: [id: string]
  update: [id: string, patch: Partial<Pick<WorkItem, 'status' | 'priority' | 'tags'>>]
}>()

function pickStatus(value: string): void {
  emit('update', props.item.id, { status: value })
}
function pickPriority(value: string): void {
  emit('update', props.item.id, { priority: value })
}
function onTagsChange(tags: string[]): void {
  emit('update', props.item.id, { tags })
}
</script>

<template>
  <tr class="row">
    <td class="type-body-sm">
      <RouterLink :to="`/items/${item.id}`" class="title-link">{{ item.title }}</RouterLink>
    </td>
    <td>
      <SelectMenu
        bare
        :model-value="item.status"
        :options="statusOptions"
        @update:model-value="pickStatus"
      >
        <template #trigger>
          <StatusBadge :name="statusName" :completed="isCompleted" :color="statusColor" />
        </template>
        <template #option="{ option }">
          <StatusBadge :name="option.label" :color="statusColorMap?.[option.value]" />
        </template>
      </SelectMenu>
    </td>
    <td>
      <SelectMenu
        bare
        :model-value="item.priority"
        :options="priorityOptions"
        @update:model-value="pickPriority"
      >
        <template #trigger>
          <PriorityBadge :priority="item.priority" :color="priorityColor" />
        </template>
        <template #option="{ option }">
          <PriorityBadge :priority="option.value" :color="priorityColorMap?.[option.value]" />
        </template>
      </SelectMenu>
    </td>
    <td>
      <TagsInput
        bare
        :model-value="item.tags"
        :suggestions="allTags"
        allow-create
        @update:model-value="onTagsChange"
      >
        <template #trigger>
          <TagPill v-for="tag in item.tags" :key="tag" :label="tag" :color="tagColors?.[tag]" />
          <span v-if="!item.tags.length" class="tags-empty type-caption">{{
            t('list.tagsEmptyHint')
          }}</span>
        </template>
        <template #option="{ option }">
          <TagPill
            v-if="!option.isCreate"
            :label="option.label"
            :color="tagColors?.[option.value]"
          />
          <span v-else>{{ option.label }}</span>
        </template>
      </TagsInput>
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

.tags-empty {
  color: var(--color-ink-muted);
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

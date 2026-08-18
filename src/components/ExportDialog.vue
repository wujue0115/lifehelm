<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useWorkItemsStore } from '@/stores/workItems'
import { usePriorityLabel } from '@/composables/usePriorityLabel'
import { formatDateTime } from '@/utils/date'
import type { WorkItem } from '@/types/work-item'
import ModalOverlay from './ModalOverlay.vue'
import DialogHeader from './DialogHeader.vue'
import SelectMenu from './SelectMenu.vue'
import SwitchToggle from './SwitchToggle.vue'

// `items` is whatever the caller currently has on screen (ListPanel passes
// its own filtered+sorted list) — export reflects the current search/filter
// state, not the full unfiltered item set, matching what someone would
// expect from "export what I'm looking at."
const props = defineProps<{ open: boolean; items: WorkItem[] }>()
const emit = defineEmits<{ close: [] }>()

const { t } = useI18n()
const store = useWorkItemsStore()
const priorityLabel = usePriorityLabel()

type GroupBy = 'status' | 'priority' | 'tag'
const groupBy = ref<GroupBy>('status')
const showDate = ref(false)
const dateFormat = ref('M/D')

// SelectMenu's v-model is a plain string (it has no idea about GroupBy's
// closed union) — same narrowing-cast proxy as BoardPanel's own
// groupByModel.
const groupByModel = computed({
  get: () => groupBy.value,
  set: (value: string) => {
    groupBy.value = value as GroupBy
  },
})

const groupByOptions = computed(() => [
  { value: 'status', label: t('board.groupByStatus') },
  { value: 'priority', label: t('board.groupByPriority') },
  { value: 'tag', label: t('board.groupByTag') },
])

// A single date, or a start–end range when both ends are set (the same
// literal `-` join the user's own spec asked for — a compact plaintext
// export, not the app's usual `~`-separated on-screen date range). Empty
// when neither end is set, even with `showDate` on, rather than printing
// an empty trailing space.
function formatItemDate(item: WorkItem): string {
  const start = item.startDate ? formatDateTime(item.startDate, dateFormat.value) : ''
  const due = item.dueDate ? formatDateTime(item.dueDate, dateFormat.value) : ''
  if (start && due) return start === due ? start : `${start}-${due}`
  return start || due
}

interface Group {
  label: string
  items: WorkItem[]
}

// Same registry order as everywhere else in the app (Board's own columns,
// List's default sort) — not alphabetical or appearance order. Groups with
// no matching items are dropped instead of printing an empty header.
const groups = computed<Group[]>(() => {
  if (groupBy.value === 'status') {
    return store.sortedStatuses
      .map((status) => ({
        label: status.name,
        items: props.items.filter((item) => item.status === status.name),
      }))
      .filter((group) => group.items.length > 0)
  }
  if (groupBy.value === 'priority') {
    return store.sortedPriorities
      .map((priority) => ({
        label: priorityLabel(priority.name),
        items: props.items.filter((item) => item.priority === priority.name),
      }))
      .filter((group) => group.items.length > 0)
  }
  const tagGroups = store.sortedTagNames
    .map((tag) => ({
      label: tag,
      items: props.items.filter((item) => item.tags.includes(tag)),
    }))
    .filter((group) => group.items.length > 0)
  const untagged = props.items.filter((item) => item.tags.length === 0)
  return untagged.length > 0
    ? [...tagGroups, { label: t('board.noTag'), items: untagged }]
    : tagGroups
})

// Numbering restarts at 1 within each group — each block reads as its own
// self-contained list, not one long list split by headers.
const exportText = computed(() =>
  groups.value
    .map((group) => {
      const lines = group.items.map((item, index) => {
        const dateSuffix = showDate.value ? formatItemDate(item) : ''
        return `${index + 1}. ${item.title}${dateSuffix ? ` ${dateSuffix}` : ''}`
      })
      return [group.label, ...lines].join('\n')
    })
    .join('\n\n'),
)
</script>

<template>
  <ModalOverlay :open="open" @close="emit('close')">
    <div class="panel">
      <DialogHeader :title="t('list.exportTitle')" @close="emit('close')" />

      <div class="row">
        <span class="type-body row-label">{{ t('board.groupBy') }}</span>
        <SelectMenu v-model="groupByModel" :options="groupByOptions" />
      </div>

      <div class="row">
        <span class="type-body row-label">{{ t('list.exportShowDate') }}</span>
        <div class="date-controls">
          <SwitchToggle v-model="showDate" :label="t('list.exportShowDate')" />
          <input
            v-model="dateFormat"
            class="input type-body-sm date-format-input"
            :placeholder="t('list.exportDateFormatPlaceholder')"
            :disabled="!showDate"
          />
          <span class="info-tooltip" tabindex="0">
            <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
              <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" stroke-width="1.3" />
              <path
                d="M8 7.2v4.2M8 4.8h.01"
                stroke="currentColor"
                stroke-width="1.3"
                stroke-linecap="round"
              />
            </svg>
            <span class="tooltip-popup type-caption">{{ t('list.exportDateFormatHelp') }}</span>
          </span>
        </div>
      </div>

      <textarea class="input type-body-sm export-output" readonly :value="exportText"></textarea>
    </div>
  </ModalOverlay>
</template>

<style scoped>
.panel {
  background: var(--color-canvas-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--rounded-lg);
  padding: var(--space-xl);
  max-width: 480px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

/* No justify-content: space-between — the label and its control sit
   together with a plain gap instead of being pushed to opposite edges of
   the dialog. */
.row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.row-label {
  color: var(--color-ink-secondary);
}

.date-controls {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.date-format-input {
  width: 90px;
}

.date-format-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* CSS-only hover/focus tooltip — small enough (max 240px) to stay well
   within the dialog's own 480px width without needing DatePicker/
   SelectMenu's Teleport-to-<body> treatment; right-aligned to the icon so
   it opens toward the dialog's own edge rather than off toward the left
   past the input row's start. */
.info-tooltip {
  position: relative;
  display: inline-flex;
  color: var(--color-ink-muted);
  cursor: help;
}

.info-tooltip:hover .tooltip-popup,
.info-tooltip:focus-visible .tooltip-popup {
  display: block;
}

.tooltip-popup {
  display: none;
  position: absolute;
  top: calc(100% + var(--space-xs));
  right: 0;
  z-index: 10;
  width: 220px;
  padding: var(--space-xs) var(--space-sm);
  background: var(--color-canvas-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--rounded-md);
  color: var(--color-ink);
  white-space: normal;
  text-align: left;
  cursor: auto;
}

.export-output {
  min-height: 280px;
  resize: vertical;
  font-family: var(--font-sans);
  white-space: pre;
}
</style>

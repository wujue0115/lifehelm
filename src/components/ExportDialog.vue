<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useWorkItemsStore } from '@/stores/workItems'
import { usePriorityLabel } from '@/composables/usePriorityLabel'
import { useExportConfig } from '@/composables/useExportConfig'
import { formatDateTime } from '@/utils/date'
import type { WorkItem } from '@/types/work-item'
import type { ExportConfig } from '@/types/export-config'
import ModalOverlay from './ModalOverlay.vue'
import DialogHeader from './DialogHeader.vue'
import SelectMenu from './SelectMenu.vue'
import SwitchToggle from './SwitchToggle.vue'
import ActionIcon from './ActionIcon.vue'

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
const dateSeparator = ref('-')

type DatePosition = 'before' | 'after'
const datePosition = ref<DatePosition>('after')

type PrefixStyle = 'number' | 'dash' | 'asterisk' | 'bullet' | 'none'
const prefixStyle = ref<PrefixStyle>('number')
const prefixSuffix = ref('.')

const titlePrefix = ref('')
const titleSuffix = ref('')

const {
  config: savedExportConfig,
  load: loadExportConfig,
  save: saveExportConfig,
  saveError,
} = useExportConfig()

// Fields start editable-but-unsaved every time the dialog opens, seeded from
// whatever was last saved via the "Save format" button — not autosaved on
// every change like the Appearance panel, since export format is a one-off
// utility action, not a persistent app-wide look.
watch(
  () => props.open,
  async (isOpen) => {
    if (!isOpen) return
    await loadExportConfig()
    groupBy.value = savedExportConfig.groupBy
    prefixStyle.value = savedExportConfig.prefixStyle
    prefixSuffix.value = savedExportConfig.prefixSuffix
    titlePrefix.value = savedExportConfig.titlePrefix
    titleSuffix.value = savedExportConfig.titleSuffix
    showDate.value = savedExportConfig.showDate
    dateFormat.value = savedExportConfig.dateFormat
    datePosition.value = savedExportConfig.datePosition
    dateSeparator.value = savedExportConfig.dateSeparator
  },
  { immediate: true },
)

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

const prefixStyleModel = computed({
  get: () => prefixStyle.value,
  set: (value: string) => {
    prefixStyle.value = value as PrefixStyle
  },
})

const prefixStyleOptions = computed(() => [
  { value: 'number', label: t('list.exportPrefixNumber') },
  { value: 'dash', label: t('list.exportPrefixDash') },
  { value: 'asterisk', label: t('list.exportPrefixAsterisk') },
  { value: 'bullet', label: t('list.exportPrefixBullet') },
  { value: 'none', label: t('list.exportPrefixNone') },
])

const datePositionModel = computed({
  get: () => datePosition.value,
  set: (value: string) => {
    datePosition.value = value as DatePosition
  },
})

const datePositionOptions = computed(() => [
  { value: 'after', label: t('list.exportDatePositionAfter') },
  { value: 'before', label: t('list.exportDatePositionBefore') },
])

// The symbol alone, e.g. "1" or "*" — empty string for 'none' so callers can
// skip both the symbol and the user's custom suffix together.
function prefixSymbol(index: number): string {
  switch (prefixStyle.value) {
    case 'number':
      return String(index + 1)
    case 'dash':
      return '-'
    case 'asterisk':
      return '*'
    case 'bullet':
      return '•'
    case 'none':
      return ''
  }
}

// A single date, or a start–end range when both ends are set, joined with
// the user's own configurable `dateSeparator` (default `-`) — a compact
// plaintext export, not the app's usual `~`-separated on-screen date range.
// Empty when neither end is set, even with `showDate` on, rather than
// printing an empty trailing space.
function formatItemDate(item: WorkItem): string {
  const start = item.startDate ? formatDateTime(item.startDate, dateFormat.value) : ''
  const due = item.dueDate ? formatDateTime(item.dueDate, dateFormat.value) : ''
  if (start && due) return start === due ? start : `${start}${dateSeparator.value}${due}`
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
        const symbol = prefixSymbol(index)
        const prefix = symbol ? `${symbol}${prefixSuffix.value}` : ''
        const wrappedTitle = `${titlePrefix.value}${item.title}${titleSuffix.value}`
        const dateText = showDate.value ? formatItemDate(item) : ''
        const titlePart = !dateText
          ? wrappedTitle
          : datePosition.value === 'before'
            ? `${dateText} ${wrappedTitle}`
            : `${wrappedTitle} ${dateText}`
        return prefix ? `${prefix} ${titlePart}` : titlePart
      })
      return [group.label, ...lines].join('\n')
    })
    .join('\n\n'),
)

const copied = ref(false)
let copiedTimeout: ReturnType<typeof setTimeout> | undefined

async function copyExport(): Promise<void> {
  await navigator.clipboard.writeText(exportText.value)
  copied.value = true
  clearTimeout(copiedTimeout)
  copiedTimeout = setTimeout(() => {
    copied.value = false
  }, 1500)
}

const formatSaved = ref(false)
let formatSavedTimeout: ReturnType<typeof setTimeout> | undefined

async function saveFormat(): Promise<void> {
  const next: ExportConfig = {
    groupBy: groupBy.value,
    prefixStyle: prefixStyle.value,
    prefixSuffix: prefixSuffix.value,
    titlePrefix: titlePrefix.value,
    titleSuffix: titleSuffix.value,
    showDate: showDate.value,
    dateFormat: dateFormat.value,
    datePosition: datePosition.value,
    dateSeparator: dateSeparator.value,
  }
  await saveExportConfig(next)
  if (saveError.value) return
  formatSaved.value = true
  clearTimeout(formatSavedTimeout)
  formatSavedTimeout = setTimeout(() => {
    formatSaved.value = false
  }, 1500)
}
</script>

<template>
  <ModalOverlay :open="open" @close="emit('close')">
    <div class="panel">
      <DialogHeader :title="t('list.exportTitle')" @close="emit('close')" />

      <div class="row combined-row">
        <div class="field">
          <span class="type-body row-label">{{ t('board.groupBy') }}</span>
          <SelectMenu v-model="groupByModel" :options="groupByOptions" />
        </div>

        <div class="field">
          <span class="type-body row-label">{{ t('list.exportPrefixLabel') }}</span>
          <div class="date-controls">
            <SelectMenu v-model="prefixStyleModel" :options="prefixStyleOptions" />
            <input v-model="prefixSuffix" class="input type-body-sm prefix-suffix-input" />
          </div>
        </div>

        <div class="field">
          <span class="type-body row-label">{{ t('list.exportTitleWrapLabel') }}</span>
          <div class="date-controls">
            <input
              v-model="titlePrefix"
              class="input type-body-sm prefix-suffix-input"
              :placeholder="t('list.exportTitlePrefixPlaceholder')"
            />
            <input
              v-model="titleSuffix"
              class="input type-body-sm prefix-suffix-input"
              :placeholder="t('list.exportTitleSuffixPlaceholder')"
            />
          </div>
        </div>
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
          <input
            v-model="dateSeparator"
            class="input type-body-sm date-separator-input"
            :placeholder="t('list.exportDateSeparatorPlaceholder')"
            :title="t('list.exportDateSeparatorPlaceholder')"
            :disabled="!showDate"
          />
          <div class="date-position" :class="{ disabled: !showDate }">
            <SelectMenu v-model="datePositionModel" :options="datePositionOptions" />
          </div>
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

      <div class="row save-row">
        <p v-if="saveError" class="save-error type-caption">
          {{ t('settings.saveError', { message: saveError }) }}
        </p>
        <button type="button" class="btn btn-secondary save-format-btn" @click="saveFormat">
          <ActionIcon v-if="formatSaved" type="check" />
          {{ t(formatSaved ? 'common.saved' : 'list.exportSaveFormat') }}
        </button>
      </div>

      <div class="output-wrapper">
        <textarea class="input type-body-sm export-output" readonly :value="exportText"></textarea>
        <button
          type="button"
          class="btn btn-ghost action-btn copy-btn"
          :title="t(copied ? 'common.copied' : 'common.copy')"
          @click="copyExport"
        >
          <ActionIcon :type="copied ? 'check' : 'copy'" />
        </button>
      </div>
    </div>
  </ModalOverlay>
</template>

<style scoped>
.panel {
  background: var(--color-canvas-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--rounded-lg);
  padding: var(--space-xl);
  width: 50vw;
  min-width: 360px;
  max-height: 90vh;
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

.combined-row {
  flex-wrap: wrap;
  row-gap: var(--space-md);
}

.field {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.save-row {
  justify-content: flex-end;
}

.save-error {
  margin: 0;
  padding: 6px 8px;
  border-radius: var(--rounded-md);
  border: 1px solid var(--color-border-strong);
  color: var(--color-ink-secondary);
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
  width: 180px;
}

.prefix-suffix-input {
  width: 56px;
}

.date-separator-input {
  width: 48px;
}

.date-position {
  min-width: 90px;
}

.date-position.disabled {
  opacity: 0.5;
  pointer-events: none;
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
  width: 240px;
  padding: var(--space-sm) var(--space-md);
  background: var(--color-canvas-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--rounded-md);
  color: var(--color-ink);
  white-space: normal;
  line-height: 1.6;
  text-align: left;
  cursor: auto;
}

.output-wrapper {
  position: relative;
  flex: 1;
  display: flex;
}

.export-output {
  flex: 1;
  min-height: 480px;
  resize: vertical;
  font-family: var(--font-sans);
  white-space: pre;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  min-height: auto;
}

.copy-btn {
  position: absolute;
  top: var(--space-xs);
  right: var(--space-xs);
  background: var(--color-canvas-surface);
}
</style>

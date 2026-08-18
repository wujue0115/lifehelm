<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useWorkItemsStore } from '@/stores/workItems'
import type { TimeEntry } from '@/types/work-item'
import { formatDuration } from '@/utils/duration'
import ActionIcon from '@/components/ActionIcon.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const props = defineProps<{ itemId: string; timeEntries: TimeEntry[] }>()

const { t, locale } = useI18n()
const store = useWorkItemsStore()
const now = ref(Date.now())
let timer: ReturnType<typeof setInterval> | undefined

const showManualForm = ref(false)
const manualStart = ref('')
const manualEnd = ref('')
const manualNote = ref('')
const errorMessage = ref<string | null>(null)
const busy = ref(false)
const pendingDeleteEntryId = ref<string | null>(null)

const runningEntry = computed(() => props.timeEntries.find((entry) => entry.endedAt === null))

const runningElapsedSeconds = computed(() => {
  const entry = runningEntry.value
  if (!entry) return 0
  return Math.max(0, (now.value - new Date(entry.startedAt).getTime()) / 1000)
})

const totalSeconds = computed(() => {
  const completedTotal = props.timeEntries.reduce(
    (sum, entry) => sum + (entry.durationSeconds ?? 0),
    0,
  )
  return completedTotal + runningElapsedSeconds.value
})

const completedEntries = computed(() =>
  [...props.timeEntries]
    .filter((entry) => entry.endedAt !== null)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt)),
)

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString(locale.value)
}

onMounted(() => {
  timer = setInterval(() => {
    now.value = Date.now()
  }, 1000)
})

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})

async function startTimer(): Promise<void> {
  busy.value = true
  errorMessage.value = null
  try {
    await store.addTimeEntry(props.itemId)
  } catch (err) {
    errorMessage.value = (err as Error).message
  } finally {
    busy.value = false
  }
}

async function stopTimer(): Promise<void> {
  const entry = runningEntry.value
  if (!entry) return
  busy.value = true
  errorMessage.value = null
  try {
    await store.updateTimeEntry(props.itemId, entry.id, {})
  } catch (err) {
    errorMessage.value = (err as Error).message
  } finally {
    busy.value = false
  }
}

async function submitManualEntry(): Promise<void> {
  if (!manualStart.value || !manualEnd.value) {
    errorMessage.value = t('timeTracker.manualMissingFields')
    return
  }
  const startedAt = new Date(manualStart.value).toISOString()
  const endedAt = new Date(manualEnd.value).toISOString()
  if (endedAt <= startedAt) {
    errorMessage.value = t('timeTracker.manualInvalidRange')
    return
  }
  busy.value = true
  errorMessage.value = null
  try {
    await store.addTimeEntry(props.itemId, { startedAt, endedAt, note: manualNote.value.trim() })
    manualStart.value = ''
    manualEnd.value = ''
    manualNote.value = ''
    showManualForm.value = false
  } catch (err) {
    errorMessage.value = (err as Error).message
  } finally {
    busy.value = false
  }
}

function requestRemoveEntry(entryId: string): void {
  pendingDeleteEntryId.value = entryId
}

async function confirmRemoveEntry(): Promise<void> {
  const entryId = pendingDeleteEntryId.value
  if (!entryId) return
  await store.deleteTimeEntry(props.itemId, entryId)
  pendingDeleteEntryId.value = null
}
</script>

<template>
  <div class="time-tracker">
    <h2 class="type-section-title">{{ t('timeTracker.title') }}</h2>
    <p v-if="errorMessage" class="type-body error">{{ errorMessage }}</p>

    <div class="summary">
      <span class="type-body total">{{
        t('timeTracker.total', { duration: formatDuration(totalSeconds, t) })
      }}</span>
      <button
        v-if="!runningEntry"
        type="button"
        class="btn btn-primary"
        :disabled="busy"
        @click="startTimer"
      >
        {{ t('timeTracker.start') }}
      </button>
      <button v-else type="button" class="btn btn-secondary" :disabled="busy" @click="stopTimer">
        {{ t('timeTracker.stop', { duration: formatDuration(runningElapsedSeconds, t) }) }}
      </button>
    </div>

    <p v-if="completedEntries.length === 0" class="type-body empty">{{ t('timeTracker.empty') }}</p>
    <ul v-else class="entries">
      <li v-for="entry in completedEntries" :key="entry.id" class="entry">
        <div class="entry-body">
          <span class="type-body-sm range">
            {{ formatDateTime(entry.startedAt) }} → {{ formatDateTime(entry.endedAt ?? '') }}
          </span>
          <span class="type-caption duration">{{
            formatDuration(entry.durationSeconds ?? 0, t)
          }}</span>
          <span v-if="entry.note" class="type-caption note">{{ entry.note }}</span>
        </div>
        <button
          type="button"
          class="btn btn-ghost action-btn"
          :title="t('common.delete')"
          @click="requestRemoveEntry(entry.id)"
        >
          <ActionIcon type="delete" />
        </button>
      </li>
    </ul>

    <button
      type="button"
      class="btn btn-ghost manual-toggle"
      @click="showManualForm = !showManualForm"
    >
      <ActionIcon v-if="!showManualForm" type="add" />
      <span class="icon-label">{{
        showManualForm ? t('timeTracker.cancelManual') : t('timeTracker.addManual')
      }}</span>
    </button>

    <form v-if="showManualForm" class="manual-form" @submit.prevent="submitManualEntry">
      <label class="field">
        <span class="type-label">{{ t('timeTracker.fieldStart') }}</span>
        <input v-model="manualStart" class="input type-body" type="datetime-local" />
      </label>
      <label class="field">
        <span class="type-label">{{ t('timeTracker.fieldEnd') }}</span>
        <input v-model="manualEnd" class="input type-body" type="datetime-local" />
      </label>
      <label class="field">
        <span class="type-label">{{ t('timeTracker.fieldNote') }}</span>
        <input v-model="manualNote" class="input type-body" type="text" />
      </label>
      <button type="submit" class="btn btn-primary" :disabled="busy">
        <ActionIcon type="add" />
        <span class="icon-label">{{ t('timeTracker.add') }}</span>
      </button>
    </form>

    <ConfirmDialog
      :open="pendingDeleteEntryId !== null"
      :title="t('timeTracker.deleteConfirmTitle')"
      :message="t('timeTracker.deleteConfirmMessage')"
      @confirm="confirmRemoveEntry"
      @cancel="pendingDeleteEntryId = null"
    />
  </div>
</template>

<style scoped>
.time-tracker {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.error {
  font-weight: 700;
}

.summary {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  flex-wrap: wrap;
}

.total {
  font-weight: 500;
}

.empty {
  color: var(--color-ink-muted);
}

.entries {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.entry {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  border-bottom: 1px solid var(--color-border-subtle);
  padding-bottom: var(--space-xs);
  flex-wrap: wrap;
}

.entry-body {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-wrap: wrap;
}

.duration {
  color: var(--color-ink-secondary);
}

.note {
  color: var(--color-ink-muted);
  font-style: italic;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  min-height: auto;
  margin-left: auto;
}

.manual-toggle {
  min-height: 28px;
  padding: 4px 10px;
  align-self: flex-start;
}

.manual-form {
  display: flex;
  gap: var(--space-sm);
  flex-wrap: wrap;
  align-items: flex-end;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field span {
  color: var(--color-ink-secondary);
}
</style>

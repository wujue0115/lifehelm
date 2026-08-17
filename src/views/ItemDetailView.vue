<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useWorkItemsStore } from '@/stores/workItems'
import type { Priority, WorkItem } from '@/types/work-item'
import { usePriorityLabel } from '@/composables/usePriorityLabel'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import ActionIcon from '@/components/ActionIcon.vue'
import CommentList from '@/components/CommentList.vue'
import AttachmentList from '@/components/AttachmentList.vue'
import TimeTracker from '@/components/TimeTracker.vue'
import TagsInput from '@/components/TagsInput.vue'
import DatePicker from '@/components/DatePicker.vue'
import ChevronIcon from '@/components/ChevronIcon.vue'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const store = useWorkItemsStore()
const priorityLabel = usePriorityLabel()

const isNew = computed(() => route.name === 'item-new')
const itemId = computed(() => (typeof route.params.id === 'string' ? route.params.id : undefined))
const currentItem = computed(() => store.items.find((item) => item.id === itemId.value))

const form = reactive({
  title: '',
  description: '',
  status: '',
  priority: 'medium' as Priority,
  tags: [] as string[],
  startDate: '',
  dueDate: '',
})

const loading = ref(true)
const saving = ref(false)
const errorMessage = ref<string | null>(null)
const showDeleteConfirm = ref(false)

function applyItemToForm(item: WorkItem): void {
  form.title = item.title
  form.description = item.description
  form.status = item.status
  form.priority = item.priority
  form.tags = [...item.tags]
  form.startDate = item.startDate ? item.startDate.slice(0, 10) : ''
  form.dueDate = item.dueDate ? item.dueDate.slice(0, 10) : ''
}

async function load(): Promise<void> {
  loading.value = true
  errorMessage.value = null
  try {
    if (store.statuses.length === 0 || store.items.length === 0) await store.fetchAll()

    if (isNew.value) {
      form.status = store.sortedStatuses[0]?.name ?? ''
      return
    }

    const id = itemId.value
    if (!id) return

    const existing = store.items.find((item) => item.id === id)
    if (existing) {
      applyItemToForm(existing)
    } else {
      errorMessage.value = t('itemDetail.notFound')
    }
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(() => route.params.id, load)

async function handleSubmit(): Promise<void> {
  if (!form.title.trim()) {
    errorMessage.value = t('itemDetail.titleRequired')
    return
  }
  if (form.startDate && form.dueDate && form.startDate > form.dueDate) {
    errorMessage.value = t('itemDetail.dateRangeInvalid')
    return
  }
  saving.value = true
  errorMessage.value = null
  const payload = {
    title: form.title.trim(),
    description: form.description.trim(),
    status: form.status,
    priority: form.priority,
    tags: form.tags,
    startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
    dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
  }
  try {
    // Sequential, not Promise.all — ensureTagRegistered does a read-modify-
    // write of the whole tags.json array, so registering more than one new
    // tag concurrently would race and silently drop all but the last write
    // (same hazard as the board's tag-drag path). Already-registered names
    // no-op immediately, so this stays cheap.
    for (const tagName of payload.tags) {
      await store.ensureTagRegistered(tagName)
    }
    if (isNew.value) {
      await store.createItem(payload)
    } else if (itemId.value) {
      await store.updateItem(itemId.value, payload)
    }
    router.back()
  } catch (err) {
    errorMessage.value = (err as Error).message
  } finally {
    saving.value = false
  }
}

async function handleDelete(): Promise<void> {
  if (itemId.value) {
    await store.deleteItem(itemId.value)
    await router.push('/')
  }
}
</script>

<template>
  <main class="detail-view">
    <div class="header">
      <RouterLink to="/" class="btn btn-secondary">
        <ChevronIcon direction="back" />
        <span class="icon-label">{{ t('itemDetail.backToList') }}</span>
      </RouterLink>
    </div>

    <p v-if="loading" class="type-body">{{ t('common.loading') }}</p>
    <template v-else>
      <p v-if="errorMessage" class="type-body error">{{ errorMessage }}</p>
      <form class="form card" @submit.prevent="handleSubmit">
        <label class="field">
          <span class="type-label">{{ t('itemDetail.fieldTitle') }}</span>
          <input v-model="form.title" class="input type-body" type="text" required />
        </label>

        <label class="field">
          <span class="type-label">{{ t('itemDetail.fieldDescription') }}</span>
          <textarea v-model="form.description" class="input type-body" rows="4"></textarea>
        </label>

        <div class="row">
          <label class="field">
            <span class="type-label">{{ t('itemDetail.fieldStatus') }}</span>
            <select v-model="form.status" class="input type-body">
              <option v-for="column in store.sortedStatuses" :key="column.id" :value="column.name">
                {{ column.name }}
              </option>
            </select>
          </label>

          <label class="field">
            <span class="type-label">{{ t('itemDetail.fieldPriority') }}</span>
            <select v-model="form.priority" class="input type-body">
              <option
                v-for="priority in store.sortedPriorities"
                :key="priority.id"
                :value="priority.name"
              >
                {{ priorityLabel(priority.name) }}
              </option>
            </select>
          </label>
        </div>

        <div class="row">
          <label class="field">
            <span class="type-label">{{ t('itemDetail.fieldTags') }}</span>
            <TagsInput
              v-model="form.tags"
              :suggestions="store.allTags"
              :placeholder="t('itemDetail.tagsPlaceholder')"
              allow-create
            />
          </label>

          <label class="field date-field">
            <span class="type-label">{{ t('itemDetail.fieldDateRange') }}</span>
            <DatePicker mode="range" v-model:start="form.startDate" v-model:end="form.dueDate" />
          </label>
        </div>

        <div class="actions">
          <button
            v-if="!isNew"
            type="button"
            class="btn btn-secondary"
            @click="showDeleteConfirm = true"
          >
            <ActionIcon type="delete" />
            <span class="icon-label">{{ t('common.delete') }}</span>
          </button>
          <button type="submit" class="btn btn-primary" :disabled="saving">
            {{ saving ? t('common.saving') : t('common.save') }}
          </button>
        </div>
      </form>

      <div v-if="!isNew && currentItem" class="sub-sections">
        <div class="card">
          <TimeTracker :item-id="currentItem.id" :time-entries="currentItem.timeEntries" />
        </div>
        <div class="card">
          <AttachmentList :item-id="currentItem.id" :attachments="currentItem.attachments" />
        </div>
        <div class="card">
          <CommentList :item-id="currentItem.id" :comments="currentItem.comments" />
        </div>
      </div>
    </template>

    <ConfirmDialog
      :open="showDeleteConfirm"
      :title="t('itemDetail.deleteConfirmTitle')"
      :message="t('itemDetail.deleteConfirmMessage')"
      @confirm="handleDelete"
      @cancel="showDeleteConfirm = false"
    />
  </main>
</template>

<style scoped>
.detail-view {
  padding: var(--space-xl);
  max-width: 720px;
}

.header {
  display: flex;
  align-items: center;
  margin-bottom: var(--space-md);
}

.form {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field span {
  color: var(--color-ink-secondary);
}

.row {
  display: flex;
  gap: var(--space-md);
  flex-wrap: wrap;
}

.row .field {
  flex: 1;
  min-width: 160px;
}

.date-field {
  max-width: 320px;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
  margin-top: 8px;
}

.error {
  font-weight: 700;
}

.sub-sections {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  margin-top: var(--space-md);
}
</style>

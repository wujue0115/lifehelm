<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWorkItemsStore } from '@/stores/workItems'
import type { Priority, WorkItem } from '@/types/work-item'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import CommentList from '@/components/CommentList.vue'
import AttachmentList from '@/components/AttachmentList.vue'
import TimeTracker from '@/components/TimeTracker.vue'

const route = useRoute()
const router = useRouter()
const store = useWorkItemsStore()

const isNew = computed(() => route.name === 'item-new')
const itemId = computed(() => (typeof route.params.id === 'string' ? route.params.id : undefined))
const currentItem = computed(() => store.items.find((item) => item.id === itemId.value))

const form = reactive({
  title: '',
  description: '',
  statusId: '',
  priority: 'medium' as Priority,
  tagsText: '',
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
  form.statusId = item.statusId
  form.priority = item.priority
  form.tagsText = item.tags.join(', ')
  form.startDate = item.startDate ? item.startDate.slice(0, 10) : ''
  form.dueDate = item.dueDate ? item.dueDate.slice(0, 10) : ''
}

async function load(): Promise<void> {
  loading.value = true
  errorMessage.value = null
  try {
    if (store.board.length === 0 || store.items.length === 0) await store.fetchAll()

    if (isNew.value) {
      form.statusId = store.sortedBoard[0]?.id ?? ''
      return
    }

    const id = itemId.value
    if (!id) return

    const existing = store.items.find((item) => item.id === id)
    if (existing) {
      applyItemToForm(existing)
    } else {
      errorMessage.value = '找不到這個工作項目'
    }
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(() => route.params.id, load)

async function handleSubmit(): Promise<void> {
  if (!form.title.trim()) {
    errorMessage.value = '標題不可為空'
    return
  }
  if (form.startDate && form.dueDate && form.startDate > form.dueDate) {
    errorMessage.value = '開始日期不可晚於結束日期'
    return
  }
  saving.value = true
  errorMessage.value = null
  const payload = {
    title: form.title.trim(),
    description: form.description.trim(),
    statusId: form.statusId,
    priority: form.priority,
    tags: form.tagsText
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
    startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
    dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
  }
  try {
    if (isNew.value) {
      const created = await store.createItem(payload)
      await router.push(`/items/${created.id}`)
    } else if (itemId.value) {
      await store.updateItem(itemId.value, payload)
    }
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
      <h1 class="type-display-lg">{{ isNew ? '新增工作項目' : '編輯工作項目' }}</h1>
      <RouterLink to="/" class="btn btn-ghost-on-light type-button-cap">返回清單</RouterLink>
    </div>

    <p v-if="loading" class="type-body-md">載入中…</p>
    <template v-else>
      <p v-if="errorMessage" class="type-body-md error">{{ errorMessage }}</p>
      <form class="form" @submit.prevent="handleSubmit">
        <label class="field">
          <span class="type-micro-cap">標題</span>
          <input v-model="form.title" class="input type-body-md" type="text" required />
        </label>

        <label class="field">
          <span class="type-micro-cap">描述</span>
          <textarea v-model="form.description" class="input type-body-md" rows="4"></textarea>
        </label>

        <div class="row">
          <label class="field">
            <span class="type-micro-cap">狀態</span>
            <select v-model="form.statusId" class="input type-body-md">
              <option v-for="column in store.sortedBoard" :key="column.id" :value="column.id">
                {{ column.name }}
              </option>
            </select>
          </label>

          <label class="field">
            <span class="type-micro-cap">優先級</span>
            <select v-model="form.priority" class="input type-body-md">
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
              <option value="urgent">緊急</option>
            </select>
          </label>

          <label class="field">
            <span class="type-micro-cap">開始日期</span>
            <input v-model="form.startDate" class="input type-body-md" type="date" />
          </label>

          <label class="field">
            <span class="type-micro-cap">結束日期</span>
            <input v-model="form.dueDate" class="input type-body-md" type="date" />
          </label>
        </div>

        <label class="field">
          <span class="type-micro-cap">標籤（逗號分隔）</span>
          <input
            v-model="form.tagsText"
            class="input type-body-md"
            type="text"
            placeholder="例如：前端, 緊急修復"
          />
        </label>

        <div class="actions">
          <button type="submit" class="btn btn-filled-cool type-button-cap" :disabled="saving">
            {{ saving ? '儲存中…' : '儲存' }}
          </button>
          <button
            v-if="!isNew"
            type="button"
            class="btn btn-ghost-on-light type-button-cap"
            @click="showDeleteConfirm = true"
          >
            刪除
          </button>
        </div>
      </form>

      <div v-if="!isNew && currentItem" class="sub-sections">
        <TimeTracker :item-id="currentItem.id" :time-entries="currentItem.timeEntries" />
        <AttachmentList :item-id="currentItem.id" :attachments="currentItem.attachments" />
        <CommentList :item-id="currentItem.id" :comments="currentItem.comments" />
      </div>
    </template>

    <ConfirmDialog
      :open="showDeleteConfirm"
      title="刪除工作項目"
      message="確定要刪除這個工作項目嗎？此動作無法復原。"
      @confirm="handleDelete"
      @cancel="showDeleteConfirm = false"
    />
  </main>
</template>

<style scoped>
.detail-view {
  padding: 32px;
  max-width: 720px;
  margin: 0 auto;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  gap: 16px;
  flex-wrap: wrap;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field span {
  color: var(--color-ink-mute);
}

.row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.row .field {
  flex: 1;
  min-width: 160px;
}

.actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.error {
  font-weight: 700;
}

.sub-sections {
  display: flex;
  flex-direction: column;
  gap: 32px;
  margin-top: 32px;
  padding-top: 32px;
  border-top: 1px solid var(--color-hairline-on-light);
}
</style>

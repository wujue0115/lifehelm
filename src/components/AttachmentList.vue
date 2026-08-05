<script setup lang="ts">
import { ref } from 'vue'
import { useWorkItemsStore } from '@/stores/workItems'
import { api } from '@/api/client'
import type { AttachmentMeta } from '@/types/work-item'

const props = defineProps<{ itemId: string; attachments: AttachmentMeta[] }>()

const store = useWorkItemsStore()
const uploading = ref(false)
const errorMessage = ref<string | null>(null)

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString('zh-TW')
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const commaIndex = result.indexOf(',')
      resolve(commaIndex === -1 ? result : result.slice(commaIndex + 1))
    }
    reader.onerror = () => reject(reader.error as Error)
    reader.readAsDataURL(file)
  })
}

async function handleFileSelected(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  uploading.value = true
  errorMessage.value = null
  try {
    const dataBase64 = await readFileAsBase64(file)
    await store.addAttachment(
      props.itemId,
      file.name,
      file.type || 'application/octet-stream',
      dataBase64,
    )
  } catch (err) {
    errorMessage.value = (err as Error).message
  } finally {
    uploading.value = false
    input.value = ''
  }
}

async function removeAttachment(attachmentId: string): Promise<void> {
  await store.deleteAttachment(props.itemId, attachmentId)
}
</script>

<template>
  <div class="attachment-list">
    <h2 class="type-button-cap section-title">附件</h2>
    <p v-if="errorMessage" class="type-body-md error">{{ errorMessage }}</p>
    <p v-if="attachments.length === 0" class="type-body-md empty">尚無附件</p>
    <ul v-else class="attachments">
      <li v-for="attachment in attachments" :key="attachment.id" class="attachment">
        <a
          :href="api.attachmentUrl(attachment.id)"
          class="type-body-md filename"
          target="_blank"
          rel="noopener"
        >
          {{ attachment.filename }}
        </a>
        <span class="type-caption meta">
          {{ formatSize(attachment.size) }} · {{ formatDate(attachment.uploadedAt) }}
        </span>
        <button type="button" class="type-caption remove" @click="removeAttachment(attachment.id)">
          刪除
        </button>
      </li>
    </ul>

    <label class="btn btn-ghost-on-light type-button-cap upload-btn">
      {{ uploading ? '上傳中…' : '+ 新增附件' }}
      <input type="file" class="file-input" :disabled="uploading" @change="handleFileSelected" />
    </label>
  </div>
</template>

<style scoped>
.attachment-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-title {
  color: var(--color-ink-mute);
}

.empty {
  color: var(--color-ink-mute);
}

.error {
  font-weight: 700;
}

.attachments {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.attachment {
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid var(--color-hairline-on-light);
  padding-bottom: 8px;
  flex-wrap: wrap;
}

.filename {
  color: var(--color-ink);
  text-decoration: underline;
}

.meta {
  color: var(--color-ink-mute);
}

.remove {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-ink-mute);
  text-decoration: underline;
  padding: 0;
  margin-left: auto;
}

.upload-btn {
  position: relative;
  overflow: hidden;
  cursor: pointer;
  align-self: flex-start;
}

.file-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
  width: 100%;
}
</style>

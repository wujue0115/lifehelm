<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useWorkItemsStore } from '@/stores/workItems'
import { api } from '@/api/client'
import type { AttachmentMeta } from '@/types/work-item'
import ActionIcon from '@/components/ActionIcon.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import ImageLightbox from '@/components/ImageLightbox.vue'
import { readFileAsBase64 } from '@/utils/file'

const props = defineProps<{ itemId: string; attachments: AttachmentMeta[] }>()

const { t, locale } = useI18n()
const store = useWorkItemsStore()
const uploading = ref(false)
const errorMessage = ref<string | null>(null)
const pendingDeleteAttachmentId = ref<string | null>(null)
const previewAttachment = ref<AttachmentMeta | null>(null)

// Images get a thumbnail grid above the plain file list; everything else
// stays a download link.
const imageAttachments = computed(() =>
  props.attachments.filter((attachment) => attachment.mimeType.startsWith('image/')),
)
const fileAttachments = computed(() =>
  props.attachments.filter((attachment) => !attachment.mimeType.startsWith('image/')),
)

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString(locale.value)
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

function requestRemoveAttachment(attachmentId: string): void {
  pendingDeleteAttachmentId.value = attachmentId
}

async function confirmRemoveAttachment(): Promise<void> {
  const attachmentId = pendingDeleteAttachmentId.value
  if (!attachmentId) return
  await store.deleteAttachment(props.itemId, attachmentId)
  pendingDeleteAttachmentId.value = null
}
</script>

<template>
  <div class="attachment-list">
    <h2 class="type-section-title">{{ t('attachments.title') }}</h2>
    <p v-if="errorMessage" class="type-body error">{{ errorMessage }}</p>
    <p v-if="attachments.length === 0" class="type-body empty">{{ t('attachments.empty') }}</p>
    <ul v-if="imageAttachments.length > 0" class="thumbnails">
      <li v-for="attachment in imageAttachments" :key="attachment.id" class="thumbnail">
        <button
          type="button"
          class="thumbnail-btn"
          :title="attachment.filename"
          @click="previewAttachment = attachment"
        >
          <img :src="api.attachmentUrl(attachment.id)" :alt="attachment.filename" loading="lazy" />
        </button>
        <div class="thumbnail-footer">
          <a
            :href="api.attachmentUrl(attachment.id)"
            class="type-caption filename thumbnail-name"
            :title="attachment.filename"
            target="_blank"
            rel="noopener"
          >
            {{ attachment.filename }}
          </a>
          <button
            type="button"
            class="btn btn-ghost action-btn"
            :title="t('common.delete')"
            @click="requestRemoveAttachment(attachment.id)"
          >
            <ActionIcon type="delete" />
          </button>
        </div>
        <span class="type-caption meta">
          {{ formatSize(attachment.size) }} · {{ formatDate(attachment.uploadedAt) }}
        </span>
      </li>
    </ul>
    <ul v-if="fileAttachments.length > 0" class="attachments">
      <li v-for="attachment in fileAttachments" :key="attachment.id" class="attachment">
        <a
          :href="api.attachmentUrl(attachment.id)"
          class="type-body filename"
          target="_blank"
          rel="noopener"
        >
          {{ attachment.filename }}
        </a>
        <span class="type-caption meta">
          {{ formatSize(attachment.size) }} · {{ formatDate(attachment.uploadedAt) }}
        </span>
        <button
          type="button"
          class="btn btn-ghost action-btn"
          :title="t('common.delete')"
          @click="requestRemoveAttachment(attachment.id)"
        >
          <ActionIcon type="delete" />
        </button>
      </li>
    </ul>

    <label class="btn btn-secondary upload-btn">
      <ActionIcon v-if="!uploading" type="add" />
      <span class="icon-label">{{
        uploading ? t('attachments.uploading') : t('attachments.add')
      }}</span>
      <input type="file" class="file-input" :disabled="uploading" @change="handleFileSelected" />
    </label>

    <ImageLightbox
      :src="previewAttachment ? api.attachmentUrl(previewAttachment.id) : null"
      :title="previewAttachment?.filename ?? ''"
      @close="previewAttachment = null"
    />

    <ConfirmDialog
      :open="pendingDeleteAttachmentId !== null"
      :title="t('attachments.deleteConfirmTitle')"
      :message="t('attachments.deleteConfirmMessage')"
      @confirm="confirmRemoveAttachment"
      @cancel="pendingDeleteAttachmentId = null"
    />
  </div>
</template>

<style scoped>
.attachment-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.empty {
  color: var(--color-ink-muted);
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
  gap: var(--space-xs);
}

.thumbnails {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: var(--space-sm);
}

.thumbnail {
  display: flex;
  flex-direction: column;
  gap: var(--space-xxs);
  min-width: 0;
}

.thumbnail-btn {
  display: block;
  padding: 0;
  aspect-ratio: 4 / 3;
  background: var(--color-canvas-app);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--rounded-md);
  overflow: hidden;
  cursor: zoom-in;
}

.thumbnail-btn:hover {
  border-color: var(--color-border-strong);
}

.thumbnail-btn img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.thumbnail-footer {
  display: flex;
  align-items: center;
  gap: var(--space-xxs);
  min-width: 0;
}

.thumbnail-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.attachment {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  border-bottom: 1px solid var(--color-border-subtle);
  padding-bottom: var(--space-xs);
  flex-wrap: wrap;
}

.filename {
  color: var(--color-ink);
  text-decoration: none;
  font-weight: 500;
}

.filename:hover {
  text-decoration: underline;
}

.meta {
  color: var(--color-ink-muted);
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  min-height: auto;
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

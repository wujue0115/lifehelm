<script setup lang="ts">
import { onMounted, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import type { RichTextImageOption } from '@/components/rich-text/types'
import { normalizeUrl } from '@/utils/richText'

const props = defineProps<{
  imageOptions: RichTextImageOption[]
  canUpload: boolean
  uploading: boolean
}>()
const emit = defineEmits<{
  upload: []
  insert: [src: string, alt: string]
  close: []
}>()

const { t } = useI18n()
const url = ref('')
const urlInput = useTemplateRef<HTMLInputElement>('urlInput')
const urlValid = () => normalizeUrl(url.value) !== null

onMounted(() => urlInput.value?.focus())

function insertUrl(): void {
  const src = normalizeUrl(url.value)
  if (!src) return
  emit('insert', src, '')
}

function insertOption(option: RichTextImageOption): void {
  emit('insert', option.src, option.name)
}
</script>

<template>
  <div class="image-panel">
    <div class="url-row">
      <input
        ref="urlInput"
        v-model="url"
        class="input type-body url-input"
        type="url"
        :placeholder="t('richText.imageFromUrl')"
        @keydown.enter.prevent="insertUrl"
        @keydown.esc.prevent.stop="emit('close')"
      />
      <button type="button" class="btn btn-primary" :disabled="!urlValid()" @click="insertUrl">
        {{ t('richText.imageInsert') }}
      </button>
      <button
        type="button"
        class="btn btn-secondary"
        :disabled="!props.canUpload || props.uploading"
        :title="props.canUpload ? undefined : t('richText.imageUnavailable')"
        @click="emit('upload')"
      >
        {{ t('richText.imageUpload') }}
      </button>
      <button type="button" class="btn btn-ghost" @click="emit('close')">
        {{ t('common.cancel') }}
      </button>
    </div>

    <span class="type-label section-label">{{ t('richText.imageFromAttachments') }}</span>
    <p v-if="imageOptions.length === 0" class="type-caption empty">
      {{ t('richText.imageNoAttachments') }}
    </p>
    <ul v-else class="options">
      <li v-for="option in imageOptions" :key="option.src">
        <button type="button" class="option" :title="option.name" @click="insertOption(option)">
          <img :src="option.src" :alt="option.name" loading="lazy" />
          <span class="type-caption option-name">{{ option.name }}</span>
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.image-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  padding: var(--space-xs);
  border-top: 1px solid var(--color-border-subtle);
}

.url-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.url-input {
  flex: 1;
  min-width: 200px;
}

.section-label {
  color: var(--color-ink-secondary);
}

.empty {
  margin: 0;
  color: var(--color-ink-muted);
}

.options {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(112px, 1fr));
  gap: var(--space-xs);
  max-height: 260px;
  overflow-y: auto;
}

.option {
  display: flex;
  flex-direction: column;
  gap: var(--space-xxs);
  width: 100%;
  padding: var(--space-xxs);
  background: var(--color-canvas-surface);
  color: var(--color-ink);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--rounded-md);
  cursor: pointer;
  text-align: left;
}

.option:hover {
  border-color: var(--color-border-strong);
  background: var(--color-surface-hover);
}

.option img {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: contain;
  background: var(--color-canvas-app);
  border-radius: var(--rounded-sm);
}

.option-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

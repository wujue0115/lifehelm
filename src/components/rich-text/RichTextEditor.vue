<script setup lang="ts">
import { onBeforeUnmount, ref, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import type { EditorView } from '@tiptap/pm/view'
import RichTextToolbar from '@/components/rich-text/RichTextToolbar.vue'
import ImageLightbox from '@/components/ImageLightbox.vue'
import type { RichTextImageOption } from '@/components/rich-text/types'
import { isImageUrl, normalizeUrl, toEditorHtml } from '@/utils/richText'

// `uploadImage` stores the file somewhere and resolves to a URL the <img>
// can point at. Omitted (e.g. an item that hasn't been saved yet, so has no
// attachment store) → uploading/pasting/dropping image files is disabled
// rather than falling back to inlining base64 into the description; images
// by URL and from `imageOptions` still work.
const props = withDefaults(
  defineProps<{
    uploadImage?: (file: File) => Promise<string>
    imageOptions?: RichTextImageOption[]
  }>(),
  { uploadImage: undefined, imageOptions: () => [] },
)
const model = defineModel<string>({ required: true })

const { t } = useI18n()
const uploading = ref(false)
const uploadError = ref<string | null>(null)
const previewSrc = ref<string | null>(null)
const fileInput = useTemplateRef<HTMLInputElement>('fileInput')

function imageFiles(files: FileList | null | undefined): File[] {
  return Array.from(files ?? []).filter((file) => file.type.startsWith('image/'))
}

async function insertImages(files: File[], position?: number): Promise<void> {
  const ed = editor.value
  if (!ed || !props.uploadImage || files.length === 0) return
  uploading.value = true
  uploadError.value = null
  try {
    for (const file of files) {
      const src = await props.uploadImage(file)
      const node = { type: 'image', attrs: { src, alt: file.name } }
      if (position === undefined) ed.chain().focus().insertContent(node).run()
      else ed.chain().focus().insertContentAt(position, node).run()
    }
  } catch (err) {
    uploadError.value = (err as Error).message
  } finally {
    uploading.value = false
  }
}

function handlePaste(_view: EditorView, event: ClipboardEvent): boolean {
  const files = imageFiles(event.clipboardData?.files)
  if (files.length > 0) {
    if (!props.uploadImage) return false
    void insertImages(files)
    return true
  }
  // A pasted image URL (incl. an attachment link copied from this app)
  // becomes an <img> rather than a text link.
  const src = normalizeUrl(event.clipboardData?.getData('text/plain') ?? '')
  const ed = editor.value
  if (!src || !ed) return false
  const knownSources = props.imageOptions.map((option) => option.src)
  if (!isImageUrl(src, knownSources)) return false
  const name = props.imageOptions.find((option) => option.src === src)?.name ?? ''
  ed.chain().focus().setImage({ src, alt: name }).run()
  return true
}

function handleDrop(view: EditorView, event: DragEvent, _slice: unknown, moved: boolean): boolean {
  if (moved) return false
  const files = imageFiles(event.dataTransfer?.files)
  if (files.length === 0 || !props.uploadImage) return false
  const position = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos
  void insertImages(files, position)
  return true
}

// A click on a link opens it in a new tab, like reading a Jira ticket. To
// edit link text instead, select it by dragging or with the keyboard — a
// drag never counts as a click, so the cursor still lands in the text.
function handleClick(_view: EditorView, _pos: number, event: MouseEvent): boolean {
  if (event.button !== 0) return false
  const anchor = (event.target as HTMLElement | null)?.closest('a')
  if (!anchor?.href) return false
  window.open(anchor.href, '_blank', 'noopener')
  return true
}

function handleDoubleClick(_view: EditorView, _pos: number, event: MouseEvent): boolean {
  const target = event.target as HTMLElement | null
  if (!(target instanceof HTMLImageElement)) return false
  previewSrc.value = target.src
  return true
}

const editor = useEditor({
  content: toEditorHtml(model.value),
  extensions: [
    StarterKit.configure({
      heading: { levels: [2, 3] },
      link: { openOnClick: false, autolink: true, defaultProtocol: 'https' },
    }),
    // Corner handles only, always keeping the aspect ratio — screenshots are
    // the main content here and should never end up stretched. The chosen
    // size is stored as the <img>'s width/height attributes.
    Image.configure({
      resize: {
        enabled: true,
        directions: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
        minWidth: 48,
        minHeight: 32,
        alwaysPreserveAspectRatio: true,
      },
    }),
  ],
  editorProps: {
    attributes: { class: 'rich-text-content type-body' },
    handlePaste,
    handleDrop,
    handleClick,
    handleDoubleClick,
  },
  onUpdate: ({ editor: ed }) => {
    model.value = ed.isEmpty ? '' : ed.getHTML()
  },
})

// External changes (the parent loading a different item into the form) —
// skipped when the value is just our own onUpdate echoing back, since
// resetting content on every keystroke would drop the cursor position.
watch(model, (value) => {
  const ed = editor.value
  if (!ed) return
  const current = ed.isEmpty ? '' : ed.getHTML()
  if (value !== current) ed.commands.setContent(toEditorHtml(value), { emitUpdate: false })
})

onBeforeUnmount(() => editor.value?.destroy())

async function handleFileSelected(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  await insertImages(imageFiles(input.files))
  input.value = ''
}
</script>

<template>
  <div class="rich-text-editor">
    <RichTextToolbar
      v-if="editor"
      :editor="editor"
      :can-upload-image="!!uploadImage"
      :uploading="uploading"
      :image-options="imageOptions"
      @pick-image="fileInput?.click()"
    />
    <EditorContent :editor="editor" />
    <p v-if="uploading || uploadError" class="type-caption status">
      {{ uploading ? t('richText.imageUploading') : uploadError }}
    </p>
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      multiple
      class="file-input"
      @change="handleFileSelected"
    />
    <ImageLightbox
      :src="previewSrc"
      :title="t('richText.imagePreview')"
      @close="previewSrc = null"
    />
  </div>
</template>

<style scoped>
.rich-text-editor {
  background: var(--color-canvas-surface);
  color: var(--color-ink);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--rounded-md);
  overflow: hidden;
}

.rich-text-editor:focus-within {
  border-color: var(--color-accent);
}

.status {
  margin: 0;
  padding: var(--space-xxs) var(--space-sm);
  color: var(--color-ink-muted);
  border-top: 1px solid var(--color-border-subtle);
}

.file-input {
  display: none;
}

/* Tiptap renders the content DOM itself, outside this SFC's scope ids. */
.rich-text-editor :deep(.rich-text-content) {
  min-height: 160px;
  max-height: 640px;
  overflow-y: auto;
  padding: var(--space-xs) var(--space-sm);
  outline: none;
  overflow-wrap: anywhere;
}

.rich-text-editor :deep(.rich-text-content > * + *) {
  margin-top: var(--space-xs);
}

.rich-text-editor :deep(.rich-text-content p),
.rich-text-editor :deep(.rich-text-content ul),
.rich-text-editor :deep(.rich-text-content ol),
.rich-text-editor :deep(.rich-text-content blockquote),
.rich-text-editor :deep(.rich-text-content pre),
.rich-text-editor :deep(.rich-text-content h2),
.rich-text-editor :deep(.rich-text-content h3) {
  margin-bottom: 0;
}

.rich-text-editor :deep(.rich-text-content p) {
  margin-top: 0;
}

.rich-text-editor :deep(.rich-text-content h2) {
  font-size: 18px;
  font-weight: 700;
  line-height: 1.4;
}

.rich-text-editor :deep(.rich-text-content h3) {
  font-size: 15px;
  font-weight: 700;
  line-height: 1.4;
}

.rich-text-editor :deep(.rich-text-content ul),
.rich-text-editor :deep(.rich-text-content ol) {
  padding-left: 24px;
}

.rich-text-editor :deep(.rich-text-content li p) {
  margin: 0;
}

.rich-text-editor :deep(.rich-text-content blockquote) {
  margin-left: 0;
  margin-right: 0;
  padding-left: var(--space-sm);
  border-left: 3px solid var(--color-border-strong);
  color: var(--color-ink-secondary);
}

.rich-text-editor :deep(.rich-text-content code) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 13px;
  background: var(--color-canvas-app);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--rounded-xs);
  padding: 1px 4px;
}

.rich-text-editor :deep(.rich-text-content pre) {
  background: var(--color-canvas-app);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--rounded-sm);
  padding: var(--space-xs) var(--space-sm);
  overflow-x: auto;
}

.rich-text-editor :deep(.rich-text-content pre code) {
  background: none;
  border: none;
  padding: 0;
}

.rich-text-editor :deep(.rich-text-content a) {
  color: var(--color-ink);
  text-decoration: underline;
  cursor: pointer;
}

.rich-text-editor :deep(.rich-text-content img) {
  display: block;
  max-width: 100%;
  /* !important beats the inline px height the resize view writes, so a
     width capped by max-width (narrow window) scales the height with it
     instead of squashing the image. Aspect ratio is always preserved while
     resizing, so ignoring the stored height loses nothing. */
  height: auto !important;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--rounded-sm);
  cursor: zoom-in;
}

/* Tiptap's resizable node view: container > wrapper > img + handles. */
.rich-text-editor :deep([data-resize-container]) {
  max-width: 100%;
}

.rich-text-editor :deep([data-resize-wrapper]) {
  max-width: 100%;
}

.rich-text-editor :deep([data-resize-handle]) {
  width: 10px;
  height: 10px;
  margin: -5px;
  background: var(--color-canvas-surface);
  border: 1px solid var(--color-ink);
  border-radius: var(--rounded-full);
  opacity: 0;
  z-index: 1;
}

.rich-text-editor :deep([data-resize-handle='top-left']),
.rich-text-editor :deep([data-resize-handle='bottom-right']) {
  cursor: nwse-resize;
}

.rich-text-editor :deep([data-resize-handle='top-right']),
.rich-text-editor :deep([data-resize-handle='bottom-left']) {
  cursor: nesw-resize;
}

/* Handles appear on hover, while the image is selected, and for the whole
   drag (the pointer can leave the image mid-resize). */
.rich-text-editor :deep([data-resize-wrapper]:hover [data-resize-handle]),
.rich-text-editor :deep(.ProseMirror-selectednode [data-resize-handle]),
.rich-text-editor :deep([data-resize-state='true'] [data-resize-handle]) {
  opacity: 1;
}

.rich-text-editor :deep(.ProseMirror-selectednode img),
.rich-text-editor :deep(img.ProseMirror-selectednode),
.rich-text-editor :deep([data-resize-state='true'] img) {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.rich-text-editor :deep(.rich-text-content hr) {
  border: none;
  border-top: 1px solid var(--color-border-subtle);
}
</style>

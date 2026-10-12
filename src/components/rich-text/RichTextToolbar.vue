<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Editor } from '@tiptap/vue-3'
import RichTextIcon, { type RichTextIconType } from '@/components/rich-text/RichTextIcon.vue'
import RichTextImagePanel from '@/components/rich-text/RichTextImagePanel.vue'
import type { RichTextImageOption } from '@/components/rich-text/types'

const props = defineProps<{
  editor: Editor
  canUploadImage: boolean
  uploading: boolean
  imageOptions: RichTextImageOption[]
}>()
const emit = defineEmits<{ pickImage: [] }>()

const { t } = useI18n()

interface ToolbarButton {
  key: string
  title: string
  /** Text glyph (B / I / H2 …) or an icon — exactly one is set. */
  glyph?: string
  icon?: RichTextIconType
  glyphClass?: string
  active?: () => boolean
  disabled?: () => boolean
  run: () => void
}

const chain = () => props.editor.chain().focus()

const groups = computed<ToolbarButton[][]>(() => [
  [
    {
      key: 'bold',
      title: t('richText.bold'),
      glyph: 'B',
      glyphClass: 'glyph-bold',
      active: () => props.editor.isActive('bold'),
      run: () => chain().toggleBold().run(),
    },
    {
      key: 'italic',
      title: t('richText.italic'),
      glyph: 'I',
      glyphClass: 'glyph-italic',
      active: () => props.editor.isActive('italic'),
      run: () => chain().toggleItalic().run(),
    },
    {
      key: 'underline',
      title: t('richText.underline'),
      glyph: 'U',
      glyphClass: 'glyph-underline',
      active: () => props.editor.isActive('underline'),
      run: () => chain().toggleUnderline().run(),
    },
    {
      key: 'strike',
      title: t('richText.strike'),
      glyph: 'S',
      glyphClass: 'glyph-strike',
      active: () => props.editor.isActive('strike'),
      run: () => chain().toggleStrike().run(),
    },
    {
      key: 'code',
      title: t('richText.code'),
      glyph: '`',
      glyphClass: 'glyph-code',
      active: () => props.editor.isActive('code'),
      run: () => chain().toggleCode().run(),
    },
  ],
  [
    {
      key: 'h2',
      title: t('richText.heading2'),
      glyph: 'H2',
      active: () => props.editor.isActive('heading', { level: 2 }),
      run: () => chain().toggleHeading({ level: 2 }).run(),
    },
    {
      key: 'h3',
      title: t('richText.heading3'),
      glyph: 'H3',
      active: () => props.editor.isActive('heading', { level: 3 }),
      run: () => chain().toggleHeading({ level: 3 }).run(),
    },
  ],
  [
    {
      key: 'bulletList',
      title: t('richText.bulletList'),
      icon: 'bulletList',
      active: () => props.editor.isActive('bulletList'),
      run: () => chain().toggleBulletList().run(),
    },
    {
      key: 'orderedList',
      title: t('richText.orderedList'),
      icon: 'orderedList',
      active: () => props.editor.isActive('orderedList'),
      run: () => chain().toggleOrderedList().run(),
    },
    {
      key: 'blockquote',
      title: t('richText.blockquote'),
      icon: 'blockquote',
      active: () => props.editor.isActive('blockquote'),
      run: () => chain().toggleBlockquote().run(),
    },
    {
      key: 'codeBlock',
      title: t('richText.codeBlock'),
      icon: 'codeBlock',
      active: () => props.editor.isActive('codeBlock'),
      run: () => chain().toggleCodeBlock().run(),
    },
  ],
  [
    {
      key: 'link',
      title: t('richText.link'),
      icon: 'link',
      active: () => props.editor.isActive('link') || linkEditing.value,
      run: openLinkEditor,
    },
    {
      key: 'image',
      title: t('richText.image'),
      icon: 'image',
      active: () => imageEditing.value,
      run: toggleImagePanel,
    },
  ],
  [
    {
      key: 'undo',
      title: t('richText.undo'),
      icon: 'undo',
      disabled: () => !props.editor.can().undo(),
      run: () => chain().undo().run(),
    },
    {
      key: 'redo',
      title: t('richText.redo'),
      icon: 'redo',
      disabled: () => !props.editor.can().redo(),
      run: () => chain().redo().run(),
    },
  ],
])

const linkEditing = ref(false)
const linkUrl = ref('')
const linkInput = useTemplateRef<HTMLInputElement>('linkInput')

// Link bar and image panel share the slot under the toolbar — opening one
// closes the other.
const imageEditing = ref(false)

function toggleImagePanel(): void {
  linkEditing.value = false
  imageEditing.value = !imageEditing.value
}

function insertImage(src: string, alt: string): void {
  chain().setImage({ src, alt }).run()
  imageEditing.value = false
}

function uploadImage(): void {
  imageEditing.value = false
  emit('pickImage')
}

async function openLinkEditor(): Promise<void> {
  imageEditing.value = false
  linkUrl.value = (props.editor.getAttributes('link').href as string | undefined) ?? ''
  linkEditing.value = true
  await nextTick()
  linkInput.value?.focus()
}

function closeLinkEditor(): void {
  linkEditing.value = false
  props.editor.commands.focus()
}

function applyLink(): void {
  const href = linkUrl.value.trim()
  if (href === '') {
    removeLink()
    return
  }
  const { empty } = props.editor.state.selection
  if (empty && !props.editor.isActive('link')) {
    // Nothing selected to wrap — insert the URL itself as the link text.
    chain()
      .insertContent({ type: 'text', text: href, marks: [{ type: 'link', attrs: { href } }] })
      .run()
  } else {
    chain().extendMarkRange('link').setLink({ href }).run()
  }
  linkEditing.value = false
}

function removeLink(): void {
  chain().extendMarkRange('link').unsetLink().run()
  linkEditing.value = false
}
</script>

<template>
  <div class="toolbar-wrap">
    <div class="toolbar" role="toolbar">
      <div v-for="(group, index) in groups" :key="index" class="group">
        <button
          v-for="button in group"
          :key="button.key"
          type="button"
          class="btn btn-ghost tool-btn"
          :class="{ active: button.active?.() }"
          :title="button.title"
          :aria-label="button.title"
          :aria-pressed="button.active ? button.active() : undefined"
          :disabled="button.disabled?.()"
          @mousedown.prevent
          @click="button.run"
        >
          <RichTextIcon v-if="button.icon" :type="button.icon" />
          <span v-else class="glyph" :class="button.glyphClass">{{ button.glyph }}</span>
        </button>
      </div>
    </div>

    <div v-if="linkEditing" class="link-bar">
      <input
        ref="linkInput"
        v-model="linkUrl"
        class="input type-body link-input"
        type="url"
        placeholder="https://"
        @keydown.enter.prevent="applyLink"
        @keydown.esc.prevent.stop="closeLinkEditor"
      />
      <button type="button" class="btn btn-primary" @click="applyLink">
        {{ t('richText.linkApply') }}
      </button>
      <button
        v-if="editor.isActive('link')"
        type="button"
        class="btn btn-secondary"
        @click="removeLink"
      >
        {{ t('richText.linkRemove') }}
      </button>
      <button type="button" class="btn btn-ghost" @click="closeLinkEditor">
        {{ t('common.cancel') }}
      </button>
    </div>

    <RichTextImagePanel
      v-if="imageEditing"
      :image-options="imageOptions"
      :can-upload="canUploadImage"
      :uploading="uploading"
      @upload="uploadImage"
      @insert="insertImage"
      @close="imageEditing = false"
    />
  </div>
</template>

<style scoped>
.toolbar-wrap {
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid var(--color-border-subtle);
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-xxs);
  padding: var(--space-xxs);
}

.group {
  display: flex;
  align-items: center;
  gap: 2px;
}

.group + .group {
  padding-left: var(--space-xxs);
  border-left: 1px solid var(--color-border-subtle);
}

/* Same 30px square footprint as the app's other single-icon ghost buttons
   (see DialogHeader's .close-btn). */
.tool-btn {
  width: 30px;
  height: 30px;
  padding: 0;
  min-height: auto;
  color: var(--color-ink-secondary);
}

.tool-btn.active {
  background: var(--color-sidebar-active);
  color: var(--color-ink);
}

.glyph {
  font-size: 13px;
  line-height: 16px;
  font-weight: 500;
}

.glyph-bold {
  font-weight: 700;
}

.glyph-italic {
  font-style: italic;
  font-family: Georgia, serif;
}

.glyph-underline {
  text-decoration: underline;
}

.glyph-strike {
  text-decoration: line-through;
}

.glyph-code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-weight: 700;
}

.link-bar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
  padding: var(--space-xs);
  border-top: 1px solid var(--color-border-subtle);
}

.link-input {
  flex: 1;
  min-width: 200px;
}
</style>

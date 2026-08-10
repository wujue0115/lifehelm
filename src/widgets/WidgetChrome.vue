<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const props = withDefaults(
  defineProps<{
    titleKey: string
    editable: boolean
    colSpan: number
    rowSpan: number
    minColSpan: number
    minRowSpan: number
    removable?: boolean
  }>(),
  {
    removable: true,
  },
)
const emit = defineEmits<{ resize: [colSpan: number, rowSpan: number]; remove: [] }>()
const { t } = useI18n()

const rootEl = ref<HTMLElement | null>(null)

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function startResize(direction: string, event: MouseEvent): void {
  if (!rootEl.value) return
  event.preventDefault()
  event.stopPropagation()

  const startX = event.clientX
  const startY = event.clientY
  const startColSpan = props.colSpan
  const startRowSpan = props.rowSpan
  const rect = rootEl.value.getBoundingClientRect()
  const rootStyle = getComputedStyle(rootEl.value)
  const gapPx =
    parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue('--space-md'),
    ) || 16
  const rowUnitPx = parseFloat(rootStyle.getPropertyValue('--grid-row-unit')) || 32
  const colWidthPx = (rect.width - (startColSpan - 1) * gapPx) / startColSpan

  function onMouseMove(e: MouseEvent): void {
    const dx = e.clientX - startX
    const dy = e.clientY - startY
    let colSpan = startColSpan
    let rowSpan = startRowSpan
    if (direction.includes('e')) {
      colSpan = clamp(startColSpan + Math.round(dx / (colWidthPx + gapPx)), props.minColSpan, 12)
    }
    if (direction.includes('w')) {
      colSpan = clamp(startColSpan - Math.round(dx / (colWidthPx + gapPx)), props.minColSpan, 12)
    }
    if (direction.includes('s')) {
      rowSpan = clamp(startRowSpan + Math.round(dy / (rowUnitPx + gapPx)), props.minRowSpan, 100)
    }
    if (direction.includes('n')) {
      rowSpan = clamp(startRowSpan - Math.round(dy / (rowUnitPx + gapPx)), props.minRowSpan, 100)
    }
    emit('resize', colSpan, rowSpan)
  }

  function onMouseUp(): void {
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }

  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}
</script>

<template>
  <div
    ref="rootEl"
    class="widget-chrome card"
    :style="{ gridColumn: `span ${colSpan}`, gridRow: `span ${rowSpan}` }"
  >
    <div class="widget-header">
      <span v-if="editable" class="widget-drag-handle icon-btn" :title="t('savedView.dragHandle')">⠿</span>
      <span class="type-label widget-title">{{ t(titleKey) }}</span>
      <button
        v-if="editable && removable"
        type="button"
        class="icon-btn"
        :title="t('savedView.removeWidget')"
        @click="emit('remove')"
      >
        ×
      </button>
    </div>
    <div class="widget-body">
      <slot />
    </div>

    <template v-if="editable">
      <span class="resize-handle handle-n" @mousedown="startResize('n', $event)"></span>
      <span class="resize-handle handle-s" @mousedown="startResize('s', $event)"></span>
      <span class="resize-handle handle-e" @mousedown="startResize('e', $event)"></span>
      <span class="resize-handle handle-w" @mousedown="startResize('w', $event)"></span>
      <span class="resize-handle handle-ne" @mousedown="startResize('ne', $event)"></span>
      <span class="resize-handle handle-nw" @mousedown="startResize('nw', $event)"></span>
      <span class="resize-handle handle-se" @mousedown="startResize('se', $event)"></span>
      <span class="resize-handle handle-sw" @mousedown="startResize('sw', $event)"></span>
    </template>
  </div>
</template>

<style scoped>
.widget-chrome {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  min-width: 0;
}

.widget-header {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.widget-title {
  flex: 1;
  color: var(--color-ink-secondary);
}

.widget-drag-handle {
  cursor: grab;
}

.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-ink-muted);
  font-size: 18px;
  line-height: 1;
  padding: 0;
}

.icon-btn:hover {
  color: var(--color-ink);
}

.widget-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
}

.resize-handle {
  position: absolute;
  z-index: 2;
}

.handle-n,
.handle-s {
  left: 6px;
  right: 6px;
  height: 6px;
  cursor: ns-resize;
}

.handle-n {
  top: -3px;
}

.handle-s {
  bottom: -3px;
}

.handle-e,
.handle-w {
  top: 6px;
  bottom: 6px;
  width: 6px;
  cursor: ew-resize;
}

.handle-e {
  right: -3px;
}

.handle-w {
  left: -3px;
}

.handle-ne,
.handle-nw,
.handle-se,
.handle-sw {
  width: 10px;
  height: 10px;
}

.handle-ne {
  top: -3px;
  right: -3px;
  cursor: nesw-resize;
}

.handle-nw {
  top: -3px;
  left: -3px;
  cursor: nwse-resize;
}

.handle-se {
  bottom: -3px;
  right: -3px;
  cursor: nwse-resize;
}

.handle-sw {
  bottom: -3px;
  left: -3px;
  cursor: nesw-resize;
}
</style>

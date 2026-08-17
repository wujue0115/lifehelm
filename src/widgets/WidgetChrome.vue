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
    colStart?: number
    rowStart?: number
    movable?: boolean
    raised?: boolean
  }>(),
  {
    removable: true,
    movable: false,
    raised: false,
  },
)
const emit = defineEmits<{
  resize: [colSpan: number, rowSpan: number, colStart: number, rowStart: number]
  move: [colStart: number, rowStart: number]
  remove: []
  focus: []
}>()
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
  const startColStart = props.colStart ?? 1
  const startRowStart = props.rowStart ?? 1
  const rect = rootEl.value.getBoundingClientRect()
  const rootStyle = getComputedStyle(rootEl.value)
  const gapPx =
    parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--space-md')) || 16
  const rowUnitPx = parseFloat(rootStyle.getPropertyValue('--grid-row-unit')) || 32
  const colWidthPx = (rect.width - (startColSpan - 1) * gapPx) / startColSpan

  function onMouseMove(e: MouseEvent): void {
    const dx = e.clientX - startX
    const dy = e.clientY - startY
    let colSpan = startColSpan
    let rowSpan = startRowSpan
    let colStart = startColStart
    let rowStart = startRowStart
    if (direction.includes('e')) {
      colSpan = clamp(startColSpan + Math.round(dx / (colWidthPx + gapPx)), props.minColSpan, 12)
    }
    if (direction.includes('w')) {
      // Dragging the left edge grows/shrinks from the left, so the right
      // edge (colStart + colSpan) must stay put — colStart shifts by
      // whatever colSpan just gained or lost, instead of the box only ever
      // growing rightward off a colStart that never moves.
      colSpan = clamp(
        startColSpan - Math.round(dx / (colWidthPx + gapPx)),
        props.minColSpan,
        startColStart + startColSpan - 1,
      )
      colStart = startColStart + startColSpan - colSpan
    }
    if (direction.includes('s')) {
      rowSpan = clamp(startRowSpan + Math.round(dy / (rowUnitPx + gapPx)), props.minRowSpan, 100)
    }
    if (direction.includes('n')) {
      // Same idea as 'w', on the row axis: keep the bottom edge fixed.
      rowSpan = clamp(
        startRowSpan - Math.round(dy / (rowUnitPx + gapPx)),
        props.minRowSpan,
        startRowStart + startRowSpan - 1,
      )
      rowStart = startRowStart + startRowSpan - rowSpan
    }
    emit('resize', colSpan, rowSpan, colStart, rowStart)
  }

  function onMouseUp(): void {
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }

  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

function startMove(event: MouseEvent): void {
  if (!rootEl.value || props.colStart == null || props.rowStart == null) return
  event.preventDefault()
  event.stopPropagation()

  const startX = event.clientX
  const startY = event.clientY
  const startColStart = props.colStart
  const startRowStart = props.rowStart
  const rect = rootEl.value.getBoundingClientRect()
  const rootStyle = getComputedStyle(rootEl.value)
  const gapPx =
    parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--space-md')) || 16
  const rowUnitPx = parseFloat(rootStyle.getPropertyValue('--grid-row-unit')) || 32
  const colWidthPx = (rect.width - (props.colSpan - 1) * gapPx) / props.colSpan

  function onMouseMove(e: MouseEvent): void {
    const dx = e.clientX - startX
    const dy = e.clientY - startY
    const deltaCol = Math.round(dx / (colWidthPx + gapPx))
    const deltaRow = Math.round(dy / (rowUnitPx + gapPx))
    const colStart = clamp(startColStart + deltaCol, 1, 13 - props.colSpan)
    const rowStart = Math.max(1, startRowStart + deltaRow)
    emit('move', colStart, rowStart)
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
    :style="{
      ...(colStart != null && rowStart != null
        ? { gridColumn: `${colStart} / span ${colSpan}`, gridRow: `${rowStart} / span ${rowSpan}` }
        : { gridColumn: `span ${colSpan}`, gridRow: `span ${rowSpan}` }),
      ...(raised ? { zIndex: 1 } : {}),
    }"
    @mousedown.capture="emit('focus')"
  >
    <div
      class="widget-header"
      :class="{ draggable: editable }"
      @mousedown="movable ? startMove($event) : undefined"
    >
      <span v-if="editable" class="widget-drag-handle icon-btn" :title="t('view.dragHandle')"
        >⠿</span
      >
      <span class="type-label widget-title">{{ t(titleKey) }}</span>
      <button
        v-if="editable && removable"
        type="button"
        class="icon-btn"
        :title="t('view.removeWidget')"
        @click="emit('remove')"
        @mousedown.stop
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

.widget-header.draggable {
  cursor: grab;
}

.widget-header.draggable:active {
  cursor: grabbing;
}

.widget-title {
  flex: 1;
  color: var(--color-ink-secondary);
}

/* Pure visual affordance — the whole header is the drag surface (see the
   outer VueDraggable's `filter` in GridLayout.vue, and `startMove` bound to
   this header rather than just the icon), so it stays dim until the header
   itself is hovered. */
.icon-btn.widget-drag-handle {
  cursor: inherit;
  color: var(--color-ink-muted);
}

.widget-header:hover .icon-btn.widget-drag-handle {
  color: var(--color-ink);
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

/* `overflow-y: auto` here also computes `overflow-x` as `auto` per the CSS
   overflow spec (one axis non-`visible` forces the other) — meaning this
   is a clipping box on every side, not just vertically. A focused input's
   outline extends 2px + 2px `outline-offset` = 4px beyond its own box,
   which gets clipped whenever a panel's content (List/Board/Calendar's own
   root has no padding of its own) sits flush against this edge, as the
   first filter input routinely does. 4px padding gives that ring room —
   this exists purely to fit a fixed-size effect (the focus ring), not a
   spacing preference, so it's a literal value rather than `var(--space-*)`
   (see DESIGN.md "Appearance spacing: what scales"). */
.widget-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  padding: 4px;
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

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import { getWidgetDefinition } from '@/widgets/registry'
import WidgetChrome from '@/widgets/WidgetChrome.vue'
import type { ViewConfig, WidgetLayoutEntry } from '@/types/view'

const props = defineProps<{
  layout: WidgetLayoutEntry[]
  editable: boolean
  flow: boolean
}>()
const emit = defineEmits<{ 'update:layout': [WidgetLayoutEntry[]] }>()

const GRID_COLUMNS = 12

// Places every entry, in array order, into the first slot (searched
// top-to-bottom, then left-to-right) that actually has room for its full
// colSpan x rowSpan — real cell occupancy, not just a shelf/row-height
// guess. Drives flow mode's rendering, and is also what freezes the
// arrangement into explicit coordinates the moment flow switches off — so
// leaving flow mode never falls back to stale coordinates from an earlier
// session, and never disagrees with what was actually on screen.
function packDense(entries: WidgetLayoutEntry[]): WidgetLayoutEntry[] {
  const occupied = new Set<string>()
  const hasRoom = (row: number, col: number, colSpan: number, rowSpan: number): boolean => {
    for (let r = row; r < row + rowSpan; r++) {
      for (let c = col; c < col + colSpan; c++) {
        if (occupied.has(`${r}:${c}`)) return false
      }
    }
    return true
  }
  const occupy = (row: number, col: number, colSpan: number, rowSpan: number): void => {
    for (let r = row; r < row + rowSpan; r++) {
      for (let c = col; c < col + colSpan; c++) {
        occupied.add(`${r}:${c}`)
      }
    }
  }
  return entries.map((entry) => {
    const colSpan = Math.min(entry.colSpan, GRID_COLUMNS)
    for (let row = 1; ; row++) {
      for (let col = 1; col + colSpan - 1 <= GRID_COLUMNS; col++) {
        if (hasRoom(row, col, colSpan, entry.rowSpan)) {
          occupy(row, col, colSpan, entry.rowSpan)
          return { ...entry, colStart: col, rowStart: row }
        }
      }
    }
  })
}

// Non-flow mode needs every entry pinned to an explicit cell. Entries that
// don't have one yet (a widget added while already in non-flow mode) get
// shelf-packed left-to-right below whatever is already positioned, leaving
// existing entries' manually-dragged positions untouched.
function assignMissingPositions(entries: WidgetLayoutEntry[]): WidgetLayoutEntry[] {
  const maxRow = entries.reduce(
    (max, entry) =>
      entry.colStart != null && entry.rowStart != null
        ? Math.max(max, entry.rowStart + entry.rowSpan - 1)
        : max,
    0,
  )
  let cursorCol = 1
  let cursorRow = maxRow + 1
  let rowHeight = 0
  return entries.map((entry) => {
    if (entry.colStart != null && entry.rowStart != null) return entry
    if (cursorCol + entry.colSpan - 1 > 12) {
      cursorCol = 1
      cursorRow += rowHeight || 1
      rowHeight = 0
    }
    const placed = { ...entry, colStart: cursorCol, rowStart: cursorRow }
    cursorCol += entry.colSpan
    rowHeight = Math.max(rowHeight, entry.rowSpan)
    return placed
  })
}

// Flow mode's positions come from packDense too now, recomputed reactively
// from the current array order — so live drag-reordering (which only ever
// changes order, not colStart/rowStart) keeps reflowing through the same
// verified occupancy check, instead of handing width+height packing off to
// the browser's own `grid-auto-flow: dense` for this direction only.
const displayLayout = computed<WidgetLayoutEntry[]>(() =>
  props.flow ? packDense(props.layout) : assignMissingPositions(props.layout),
)

function positionsMatch(a: WidgetLayoutEntry[], b: WidgetLayoutEntry[]): boolean {
  return (
    a.length === b.length &&
    a.every((entry, i) => entry.colStart === b[i]?.colStart && entry.rowStart === b[i]?.rowStart)
  )
}

// Keeps the stored colStart/rowStart equal to whatever displayLayout is
// actually rendering as grid-area, instead of only syncing them at the
// instant flow toggles. Without this, anything that changes props.layout
// without touching colStart/rowStart itself — a VueDraggable reorder or an
// updateSpan resize while flow stays on, or simply mounting into a view
// that already defaults to flow mode — left stale positions sitting in the
// stored entry that disagreed with what was actually on screen. Runs on
// every layout change (immediate covers mount too); packDense/
// assignMissingPositions are idempotent on already-synced input, so this
// settles after one extra tick instead of looping.
watch(
  () => [props.editable, displayLayout.value] as const,
  ([editableNow, display]) => {
    if (editableNow && !positionsMatch(props.layout, display)) {
      emit('update:layout', display)
    }
  },
  { immediate: true, deep: true },
)

const localLayout = computed({
  get: () => displayLayout.value,
  set: (value: WidgetLayoutEntry[]) => emit('update:layout', value),
})

function updateSpan(
  instanceId: string,
  colSpan: number,
  rowSpan: number,
  colStart: number,
  rowStart: number,
): void {
  emit(
    'update:layout',
    props.layout.map((entry) =>
      entry.instanceId === instanceId ? { ...entry, colSpan, rowSpan, colStart, rowStart } : entry,
    ),
  )
}

function updatePosition(instanceId: string, colStart: number, rowStart: number): void {
  emit(
    'update:layout',
    displayLayout.value.map((entry) =>
      entry.instanceId === instanceId ? { ...entry, colStart, rowStart } : entry,
    ),
  )
}

function removeWidget(instanceId: string): void {
  emit(
    'update:layout',
    props.layout.filter((entry) => entry.instanceId !== instanceId),
  )
}

function updateConfig(instanceId: string, config: ViewConfig): void {
  emit(
    'update:layout',
    props.layout.map((entry) => (entry.instanceId === instanceId ? { ...entry, config } : entry)),
  )
}

// An empty/whitespace-only title clears the override (falls back to the
// widget definition's own titleKey) rather than persisting an empty
// string — matches WidgetChrome's finishRenameTitle, which already trims
// before emitting.
function renameWidget(instanceId: string, title: string): void {
  emit(
    'update:layout',
    props.layout.map((entry) =>
      entry.instanceId === instanceId ? { ...entry, title: title || undefined } : entry,
    ),
  )
}

// Explicit-position panels can overlap while being dragged/resized in
// non-flow mode; whichever one the user last clicked or grabbed a
// handle on should paint above the rest instead of staying tucked
// underneath whatever happens to be later in array order.
const topInstanceId = ref<string | null>(null)
function bringToFront(instanceId: string): void {
  topInstanceId.value = instanceId
}
</script>

<template>
  <div class="grid-layout">
    <div v-if="editable" class="grid-overlay" aria-hidden="true">
      <div class="overlay-rows"></div>
      <div class="overlay-cols"></div>
    </div>
    <VueDraggable
      v-model="localLayout"
      tag="div"
      class="widget-grid"
      filter="button, .widget-body"
      :preventOnFilter="false"
      :disabled="!editable || !flow"
      :animation="150"
    >
      <WidgetChrome
        v-for="entry in localLayout"
        :key="entry.instanceId"
        :title-key="getWidgetDefinition(entry.widgetId).titleKey"
        :title="entry.title"
        :editable="editable"
        :col-span="entry.colSpan"
        :row-span="entry.rowSpan"
        :col-start="entry.colStart"
        :row-start="entry.rowStart"
        :movable="editable && !flow"
        :raised="entry.instanceId === topInstanceId"
        :min-col-span="getWidgetDefinition(entry.widgetId).minColSpan"
        :min-row-span="getWidgetDefinition(entry.widgetId).minRowSpan"
        @resize="
          (colSpan, rowSpan, colStart, rowStart) =>
            updateSpan(entry.instanceId, colSpan, rowSpan, colStart, rowStart)
        "
        @move="(colStart, rowStart) => updatePosition(entry.instanceId, colStart, rowStart)"
        @remove="removeWidget(entry.instanceId)"
        @rename="(title) => renameWidget(entry.instanceId, title)"
        @focus="bringToFront(entry.instanceId)"
      >
        <component
          :is="getWidgetDefinition(entry.widgetId).component"
          :instance-id="entry.instanceId"
          :config="entry.config"
          @update:config="(config: ViewConfig) => updateConfig(entry.instanceId, config)"
        />
      </WidgetChrome>
    </VueDraggable>
  </div>
</template>

<style scoped>
.grid-layout {
  --grid-row-unit: 32px;
  position: relative;
  display: grid;
  flex: 1;
  grid-template-columns: repeat(12, 1fr);
  grid-auto-flow: row dense;
  grid-auto-rows: var(--grid-row-unit);
  gap: var(--space-md);
  min-height: 120px;
}

.grid-overlay {
  --col-width: calc((100% - 11 * var(--space-md)) / 12);
  --overlay-line-color: color-mix(
    in srgb,
    var(--color-border-strong) 50%,
    var(--color-ink-muted) 50%
  );
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.overlay-rows {
  position: absolute;
  inset: 0;
  /* Two lines per row boundary: one hugging the bottom edge of the row above,
     one hugging the top edge of the row below — with the real gap left empty
     between them, instead of one line floating in the middle of the gap. */
  background-image: repeating-linear-gradient(
    to bottom,
    var(--overlay-line-color) 0,
    var(--overlay-line-color) 1px,
    transparent 1px,
    transparent calc(var(--grid-row-unit) - 0.5px),
    var(--overlay-line-color) calc(var(--grid-row-unit) - 0.5px),
    var(--overlay-line-color) calc(var(--grid-row-unit) + 0.5px),
    transparent calc(var(--grid-row-unit) + 0.5px),
    transparent calc(var(--grid-row-unit) + var(--space-md))
  );
  -webkit-mask-image: repeating-linear-gradient(to right, #000 0 4px, transparent 4px 8px);
  mask-image: repeating-linear-gradient(to right, #000 0 4px, transparent 4px 8px);
}

.overlay-cols {
  position: absolute;
  inset: 0;
  /* Same idea as .overlay-rows, other axis: one line per column's own edge,
     real gap left empty between them. */
  background-image: repeating-linear-gradient(
    to right,
    var(--overlay-line-color) 0,
    var(--overlay-line-color) 1px,
    transparent 1px,
    transparent calc(var(--col-width) - 0.5px),
    var(--overlay-line-color) calc(var(--col-width) - 0.5px),
    var(--overlay-line-color) calc(var(--col-width) + 0.5px),
    transparent calc(var(--col-width) + 0.5px),
    transparent calc(var(--col-width) + var(--space-md))
  );
  -webkit-mask-image: repeating-linear-gradient(to bottom, #000 0 4px, transparent 4px 8px);
  mask-image: repeating-linear-gradient(to bottom, #000 0 4px, transparent 4px 8px);
}

.widget-grid {
  display: contents;
}
</style>

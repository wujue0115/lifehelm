<script setup lang="ts">
import { computed } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import { getWidgetDefinition } from '@/widgets/registry'
import WidgetChrome from '@/widgets/WidgetChrome.vue'
import type { SavedViewConfig, WidgetLayoutEntry } from '@/types/saved-view'

const props = defineProps<{
  layout: WidgetLayoutEntry[]
  editable: boolean
}>()
const emit = defineEmits<{ 'update:layout': [WidgetLayoutEntry[]] }>()

const localLayout = computed({
  get: () => props.layout,
  set: (value: WidgetLayoutEntry[]) => emit('update:layout', value),
})

function updateSpan(instanceId: string, colSpan: number, rowSpan: number): void {
  emit(
    'update:layout',
    props.layout.map((entry) =>
      entry.instanceId === instanceId ? { ...entry, colSpan, rowSpan } : entry,
    ),
  )
}

function removeWidget(instanceId: string): void {
  emit(
    'update:layout',
    props.layout.filter((entry) => entry.instanceId !== instanceId),
  )
}

function updateConfig(instanceId: string, config: SavedViewConfig): void {
  emit(
    'update:layout',
    props.layout.map((entry) => (entry.instanceId === instanceId ? { ...entry, config } : entry)),
  )
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
      handle=".widget-drag-handle"
      :disabled="!editable"
      :animation="150"
    >
      <WidgetChrome
        v-for="entry in localLayout"
        :key="entry.instanceId"
        :title-key="getWidgetDefinition(entry.widgetId).titleKey"
        :editable="editable"
        :col-span="entry.colSpan"
        :row-span="entry.rowSpan"
        :min-col-span="getWidgetDefinition(entry.widgetId).minColSpan"
        :min-row-span="getWidgetDefinition(entry.widgetId).minRowSpan"
        @resize="(colSpan, rowSpan) => updateSpan(entry.instanceId, colSpan, rowSpan)"
        @remove="removeWidget(entry.instanceId)"
      >
        <component
          :is="getWidgetDefinition(entry.widgetId).component"
          :instance-id="entry.instanceId"
          :config="entry.config"
          @update:config="(config: SavedViewConfig) => updateConfig(entry.instanceId, config)"
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
  grid-template-columns: repeat(12, 1fr);
  grid-auto-flow: dense;
  grid-auto-rows: var(--grid-row-unit);
  gap: var(--space-md);
  min-height: 120px;
}

.grid-overlay {
  --col-width: calc((100% - 11 * var(--space-md)) / 12);
  --overlay-line-color: color-mix(in srgb, var(--color-border-strong) 50%, var(--color-ink-muted) 50%);
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

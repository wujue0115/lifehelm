<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useWorkItemsStore } from '@/stores/workItems'
import { computeStats } from '@/utils/stats'
import { resolveColor } from '@/utils/colors'
import type { BreakdownViewConfig, ViewConfig } from '@/types/view'
import type { Priority } from '@/types/work-item'
import type { TagColorKey } from '@/config/tagColors'
import ActionIcon from '@/components/ActionIcon.vue'
import ColorSettings from '@/components/ColorSettings.vue'

defineOptions({ inheritAttrs: false })

const props = defineProps<{ instanceId: string; config?: ViewConfig }>()
const emit = defineEmits<{ 'update:config': [ViewConfig] }>()

const { t } = useI18n()
const store = useWorkItemsStore()
const stats = computed(() => computeStats(store.items, store.statuses, store.priorities))
const maxStatusCount = computed(() => Math.max(1, ...stats.value.statusCounts.map((s) => s.count)))

const cfg = (props.config ?? {}) as Partial<BreakdownViewConfig>
const statusColors = ref<Record<string, TagColorKey>>({ ...cfg.statusColors })
const priorityColors = ref<Partial<Record<Priority, TagColorKey>>>({ ...cfg.priorityColors })
const tagColors = ref<Record<string, TagColorKey>>({ ...cfg.tagColors })
const settingsOpen = ref(false)

let persistTimer: ReturnType<typeof setTimeout> | undefined
function schedulePersist(): void {
  clearTimeout(persistTimer)
  persistTimer = setTimeout(() => {
    emit('update:config', {
      statusColors: statusColors.value,
      priorityColors: priorityColors.value,
      tagColors: tagColors.value,
    })
  }, 400)
}
watch([statusColors, priorityColors, tagColors], schedulePersist, { deep: true })

// Same rule as List/Board/Calendar: assigning a per-view tag color
// registers the tag so it keeps existing even after every item wearing it
// is retagged or deleted.
function onViewTagColorsUpdate(next: Record<string, TagColorKey>): void {
  tagColors.value = next
  for (const tagName of Object.keys(next)) {
    store.ensureTagRegistered(tagName)
  }
}

// The bar-fill is a solid color here, not the tinted badge mix — a chart
// segment reads better at full saturation than a badge's subtle tint.
function barStyle(name: string, count: number): Record<string, string> {
  const color = resolveColor(name, store.statuses, statusColors.value)
  return {
    width: `${(count / maxStatusCount.value) * 100}%`,
    ...(color ? { background: `var(--tag-color-${color})` } : {}),
  }
}
</script>

<template>
  <div class="breakdown-panel">
    <div class="toolbar">
      <button
        type="button"
        class="btn-ghost action-btn"
        :title="t('colorSettings.trigger')"
        @click="settingsOpen = true"
      >
        <ActionIcon type="settings" />
      </button>
    </div>

    <ColorSettings
      :open="settingsOpen"
      :statuses="store.sortedStatuses"
      :priorities="store.sortedPriorities"
      :tag-names="store.allTags"
      :tag-registry="store.tags"
      :view-status-colors="statusColors"
      :view-priority-colors="priorityColors"
      :view-tag-colors="tagColors"
      @update:view-status-colors="(v) => (statusColors = v)"
      @update:view-priority-colors="(v) => (priorityColors = v)"
      @update:view-tag-colors="onViewTagColorsUpdate"
      @close="settingsOpen = false"
    />

    <div class="bar-list">
      <div v-for="status in stats.statusCounts" :key="status.columnId" class="bar-row">
        <span class="type-body-sm bar-label">{{ status.name }}</span>
        <div class="bar-track">
          <div class="bar-fill" :style="barStyle(status.name, status.count)"></div>
        </div>
        <span class="type-caption bar-count">{{ status.count }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.breakdown-panel {
  min-width: 0;
}

.toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: var(--space-xs);
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  min-height: auto;
}

.bar-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.bar-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.bar-label {
  width: 100px;
  flex-shrink: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bar-track {
  flex: 1;
  background: var(--color-canvas-app);
  border-radius: var(--rounded-xs);
  height: 10px;
  overflow: hidden;
}

.bar-fill {
  background: var(--color-ink);
  height: 100%;
  border-radius: var(--rounded-xs);
}

.bar-count {
  width: 32px;
  text-align: right;
  color: var(--color-ink-secondary);
}
</style>

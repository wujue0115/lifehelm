<script setup lang="ts">
import { computed } from 'vue'
import type { Priority } from '@/types/work-item'
import type { TagColorKey } from '@/config/tagColors'
import { usePriorityLabel } from '@/composables/usePriorityLabel'

const props = defineProps<{ priority: Priority; color?: TagColorKey }>()

const priorityLabel = usePriorityLabel()
const label = computed(() => priorityLabel(props.priority))
const style = computed(() =>
  props.color ? { '--badge-color': `var(--tag-color-${props.color})` } : undefined,
)
</script>

<template>
  <span class="badge type-label" :class="[priority, { colored: color }]" :style="style">{{
    label
  }}</span>
</template>

<style scoped>
/* border-radius is {rounded.lg}, not {rounded.full} — see StatusBadge.vue
   for why chips need a radius-scale-responsive value rather than a
   circle-guaranteeing fixed one. */
.badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: var(--rounded-lg);
  color: var(--color-ink-secondary);
  border: 1px solid var(--color-border-subtle);
  white-space: nowrap;
}

.badge.low {
  color: var(--color-ink-muted);
}

.badge.high {
  border: 1.5px solid var(--color-ink);
  color: var(--color-ink);
}

.badge.urgent {
  background: var(--color-ink);
  color: var(--color-canvas-surface);
  border-color: var(--color-ink);
}

/* Opt-in per-view coloring — see StatusBadge.vue for the rationale. Comes
   after .low/.high/.urgent so an explicitly assigned color always wins
   over the grayscale escalation. */
.badge.colored {
  background: color-mix(in srgb, var(--badge-color) 16%, var(--color-canvas-surface));
  border-color: color-mix(in srgb, var(--badge-color) 55%, var(--color-border-strong));
  color: var(--color-ink);
}
</style>

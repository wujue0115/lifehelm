<script setup lang="ts">
import { computed } from 'vue'
import type { TagColorKey } from '@/config/tagColors'

const props = defineProps<{ label: string; color?: TagColorKey }>()

const style = computed(() =>
  props.color ? { '--badge-color': `var(--tag-color-${props.color})` } : undefined,
)
</script>

<template>
  <span class="tag type-label" :class="{ colored: color }" :style="style">{{ label }}</span>
</template>

<style scoped>
.tag {
  display: inline-block;
  padding: 2px 10px;
  border-radius: var(--rounded-full);
  background: var(--color-canvas-app);
  color: var(--color-ink-secondary);
  margin-right: 4px;
  white-space: nowrap;
}

/* Opt-in per-view coloring — see StatusBadge.vue for the rationale. */
.tag.colored {
  background: color-mix(in srgb, var(--badge-color) 16%, var(--color-canvas-surface));
  border: 1px solid color-mix(in srgb, var(--badge-color) 55%, var(--color-border-strong));
  color: var(--color-ink);
}
</style>

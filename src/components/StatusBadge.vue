<script setup lang="ts">
import { computed } from 'vue'
import type { TagColorKey } from '@/config/tagColors'

const props = defineProps<{ name: string; completed?: boolean; color?: TagColorKey }>()

const style = computed(() =>
  props.color ? { '--badge-color': `var(--tag-color-${props.color})` } : undefined,
)
</script>

<template>
  <span class="badge type-label" :class="{ filled: completed, colored: color }" :style="style">{{
    name
  }}</span>
</template>

<style scoped>
.badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: var(--rounded-full);
  border: 1px solid var(--color-border-strong);
  color: var(--color-ink-secondary);
  background: var(--color-canvas-surface);
  white-space: nowrap;
}

.badge.filled {
  background: var(--color-ink);
  color: var(--color-canvas-surface);
  border-color: var(--color-ink);
}

/* Opt-in per-view coloring (DESIGN.md "Status/Priority/Tag Color") — a
   tint mixed into the badge's own surface/border tokens, never a solid
   fill, so it stays legible in both themes without a per-color contrast
   check. Comes after .filled so an explicitly assigned color wins even
   on the "completed" status. */
.badge.colored {
  background: color-mix(in srgb, var(--badge-color) 16%, var(--color-canvas-surface));
  border-color: color-mix(in srgb, var(--badge-color) 55%, var(--color-border-strong));
  color: var(--color-ink);
}
</style>

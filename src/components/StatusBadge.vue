<script setup lang="ts">
defineProps<{ name: string; completed?: boolean }>()
</script>

<template>
  <span class="badge type-label" :class="{ filled: completed }">{{ name }}</span>
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
</style>

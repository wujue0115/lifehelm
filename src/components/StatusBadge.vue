<script setup lang="ts">
defineProps<{ name: string; completed?: boolean }>()
</script>

<template>
  <span class="badge type-micro-cap" :class="{ filled: completed }">{{ name }}</span>
</template>

<style scoped>
.badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: var(--rounded-full);
  border: 1px solid var(--color-ink);
  color: var(--color-ink);
  background: var(--color-canvas-light);
  white-space: nowrap;
}

.badge.filled {
  background: var(--color-ink);
  color: var(--color-on-primary);
}
</style>

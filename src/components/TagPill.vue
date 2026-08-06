<script setup lang="ts">
defineProps<{ label: string }>()
</script>

<template>
  <span class="tag type-label">{{ label }}</span>
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
</style>

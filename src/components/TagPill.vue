<script setup lang="ts">
defineProps<{ label: string }>()
</script>

<template>
  <span class="tag type-micro-cap">{{ label }}</span>
</template>

<style scoped>
.tag {
  display: inline-block;
  padding: 2px 10px;
  border-radius: var(--rounded-full);
  background: var(--color-canvas-cool);
  color: var(--color-ink-mute);
  margin-right: 4px;
  white-space: nowrap;
}
</style>

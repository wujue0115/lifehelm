<script setup lang="ts">
defineProps<{ modelValue: boolean; label?: string }>()
const emit = defineEmits<{ 'update:modelValue': [boolean] }>()
</script>

<template>
  <button
    type="button"
    class="switch"
    :class="{ on: modelValue }"
    role="switch"
    :aria-checked="modelValue"
    :aria-label="label"
    :title="label"
    @click="emit('update:modelValue', !modelValue)"
  ></button>
</template>

<style scoped>
.switch {
  position: relative;
  width: 34px;
  height: 20px;
  flex-shrink: 0;
  padding: 0;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--rounded-full);
  background: var(--color-canvas-app);
  cursor: pointer;
}

.switch::after {
  content: '';
  position: absolute;
  top: 1px;
  left: 1px;
  width: 16px;
  height: 16px;
  border-radius: var(--rounded-full);
  background: var(--color-canvas-surface);
  border: 1px solid var(--color-border-strong);
  transition: transform 0.15s ease;
}

.switch.on {
  background: var(--color-accent);
  border-color: var(--color-accent);
}

.switch.on::after {
  border-color: var(--color-accent);
  transform: translateX(14px);
}
</style>

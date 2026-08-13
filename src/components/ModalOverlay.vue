<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') emit('close')
}

// Every dialog in the app closes the same three ways: an explicit control
// inside the slot, clicking the backdrop, or Escape. The first is up to
// each consumer; backdrop-click and Escape are centralized here so no
// dialog can drift out of sync with the others. The listener is only live
// while a dialog is actually open — addEventListener/removeEventListener
// are idempotent against the same function reference, so toggling `open`
// repeatedly never double-registers or leaks. onBeforeUnmount covers a
// consumer that unmounts this component outright while still open (e.g.
// ThemeSettingsPanel, whose parent uses v-if instead of an open prop).
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) window.addEventListener('keydown', onKeydown)
    else window.removeEventListener('keydown', onKeydown)
  },
  { immediate: true },
)

onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="overlay" @click.self="emit('close')">
      <slot />
    </div>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
</style>

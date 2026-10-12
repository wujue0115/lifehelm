<script setup lang="ts">
import ModalOverlay from '@/components/ModalOverlay.vue'
import DialogHeader from '@/components/DialogHeader.vue'

// `src === null` means closed, so callers keep a single ref for "which image
// is being viewed" instead of a separate open flag that could drift from it.
defineProps<{ src: string | null; title: string }>()
const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <ModalOverlay :open="src !== null" @close="emit('close')">
    <div class="lightbox card">
      <DialogHeader :title="title" @close="emit('close')" />
      <img v-if="src" :src="src" :alt="title" class="image" />
    </div>
  </ModalOverlay>
</template>

<style scoped>
.lightbox {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  max-width: min(1200px, calc(100vw - 32px));
  max-height: calc(100vh - 32px);
}

.image {
  display: block;
  max-width: 100%;
  max-height: calc(100vh - 120px);
  object-fit: contain;
  margin: 0 auto;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--rounded-sm);
}
</style>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import ModalOverlay from './ModalOverlay.vue'

defineProps<{ open: boolean; title: string; message: string }>()
const emit = defineEmits<{ confirm: []; cancel: [] }>()
const { t } = useI18n()
</script>

<template>
  <ModalOverlay :open="open" @close="emit('cancel')">
    <div class="panel">
      <h2 class="type-section-title title">{{ title }}</h2>
      <p class="type-body">{{ message }}</p>
      <div class="actions">
        <button type="button" class="btn btn-secondary" @click="emit('cancel')">
          {{ t('common.cancel') }}
        </button>
        <button type="button" class="btn btn-primary" @click="emit('confirm')">
          {{ t('common.confirm') }}
        </button>
      </div>
    </div>
  </ModalOverlay>
</template>

<style scoped>
.panel {
  background: var(--color-canvas-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--rounded-lg);
  padding: var(--space-xl);
  max-width: 400px;
  width: 90%;
}

.title {
  margin: 0 0 8px;
}

.actions {
  display: flex;
  gap: var(--space-sm);
  justify-content: flex-end;
  margin-top: var(--space-md);
}
</style>

<script setup lang="ts">
defineProps<{ open: boolean; title: string; message: string }>()
const emit = defineEmits<{ confirm: []; cancel: [] }>()
</script>

<template>
  <div v-if="open" class="overlay" @click.self="emit('cancel')">
    <div class="panel">
      <h2 class="type-section-title title">{{ title }}</h2>
      <p class="type-body">{{ message }}</p>
      <div class="actions">
        <button type="button" class="btn btn-secondary" @click="emit('cancel')">取消</button>
        <button type="button" class="btn btn-primary" @click="emit('confirm')">確認</button>
      </div>
    </div>
  </div>
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

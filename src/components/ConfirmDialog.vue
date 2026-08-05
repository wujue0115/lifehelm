<script setup lang="ts">
defineProps<{ open: boolean; title: string; message: string }>()
const emit = defineEmits<{ confirm: []; cancel: [] }>()
</script>

<template>
  <div v-if="open" class="overlay" @click.self="emit('cancel')">
    <div class="panel">
      <h2 class="type-body-md title">{{ title }}</h2>
      <p class="type-body-md">{{ message }}</p>
      <div class="actions">
        <button
          type="button"
          class="btn btn-ghost-on-light type-button-cap"
          @click="emit('cancel')"
        >
          取消
        </button>
        <button type="button" class="btn btn-filled-cool type-button-cap" @click="emit('confirm')">
          確認
        </button>
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
  background: var(--color-canvas-light);
  border: 1px solid var(--color-ink);
  border-radius: var(--rounded-sm);
  padding: 24px;
  max-width: 400px;
  width: 90%;
}

.title {
  font-weight: 700;
  margin: 0 0 8px;
}

.actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>

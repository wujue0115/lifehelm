<script setup lang="ts">
import { useI18n } from 'vue-i18n'

defineProps<{ title: string }>()
const emit = defineEmits<{ close: [] }>()
const { t } = useI18n()
</script>

<template>
  <div class="panel-header">
    <span class="type-section-title">{{ title }}</span>
    <button
      type="button"
      class="btn btn-ghost close-btn"
      :title="t('common.close')"
      @click="emit('close')"
    >
      ×
    </button>
  </div>
</template>

<style scoped>
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.close-btn {
  padding: 2px 8px;
  min-height: auto;
  font-size: 16px;
  line-height: 1;
}
</style>

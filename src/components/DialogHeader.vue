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

/* Matches the single-icon `.action-btn` footprint used across the app
   (e.g. ListPanel's settings gear): 16px content + 6px padding + 1px
   border on each side = 30px square. `.action-btn` gets there via
   padding alone since its content is a 16px SVG; the "×" glyph here
   isn't 16px wide, so width/height are set explicitly instead of
   padding to land on the same 30px box. */
.close-btn {
  width: 30px;
  height: 30px;
  padding: 0;
  min-height: auto;
  font-size: 16px;
  line-height: 1;
}
</style>

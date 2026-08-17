<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { WIDGET_REGISTRY } from '@/widgets/registry'
import ActionIcon from '@/components/ActionIcon.vue'

const emit = defineEmits<{ add: [widgetId: string] }>()
const { t } = useI18n()

const open = ref(false)

function pick(widgetId: string): void {
  emit('add', widgetId)
  open.value = false
}
</script>

<template>
  <div class="widget-picker">
    <button type="button" class="btn btn-secondary" @click="open = !open">
      <ActionIcon type="add" />
      <span class="icon-label">{{ t('view.addWidget') }}</span>
    </button>
    <div v-if="open" class="picker-menu card">
      <button
        v-for="widget in WIDGET_REGISTRY"
        :key="widget.id"
        type="button"
        class="btn-ghost picker-item"
        @click="pick(widget.id)"
      >
        {{ t(widget.titleKey) }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.widget-picker {
  position: relative;
  display: inline-block;
}

.picker-menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  z-index: 30;
  width: 220px;
  display: flex;
  flex-direction: column;
  gap: var(--space-xxs);
}

.picker-item {
  justify-content: flex-start;
  text-align: left;
  border-radius: var(--rounded-xs);
  padding: 8px 10px;
}
</style>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AdvancedFilterGroup } from '@/types/advanced-filter'
import { countRules } from '@/utils/advancedFilter'
import AdvancedFilterDialog from './AdvancedFilterDialog.vue'
import type { AdvancedFilterContext } from './types'

// Sits in the List/Board/Calendar filter row, right after DateFilter. Owns
// the dialog's open state; the condition tree itself is a v-model passed
// straight through to the dialog and back up to the panel's ViewConfig.
const props = defineProps<{
  modelValue: AdvancedFilterGroup | undefined
  context: AdvancedFilterContext
}>()
const emit = defineEmits<{ 'update:modelValue': [AdvancedFilterGroup | undefined] }>()

const { t } = useI18n()

const open = ref(false)

const activeCount = computed(() => countRules(props.modelValue))
const isActive = computed(() => activeCount.value > 0)
</script>

<template>
  <button
    type="button"
    class="btn btn-secondary advanced-filter-btn"
    :class="{ active: isActive }"
    :title="t('advancedFilter.trigger')"
    :aria-pressed="isActive"
    @click="open = true"
  >
    <svg class="funnel" width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        stroke-linejoin="round"
        stroke-width="4"
        d="m6 9l14.4 16.818v12.626L27.6 42V25.818L42 9z"
      />
    </svg>
    <span v-if="isActive" class="count type-label">{{ activeCount }}</span>
  </button>

  <AdvancedFilterDialog
    :open="open"
    :model-value="modelValue"
    :context="context"
    @update:model-value="emit('update:modelValue', $event)"
    @close="open = false"
  />
</template>

<style scoped>
/* Matches the filter row's other controls in height. When a filter is
   active the button inverts to a solid ink fill — the same "highest-
   emphasis inverts to solid {colors.ink}" move status-badge uses. Ink
   directly, never {colors.accent}: an active filter is a committed value,
   not a primary action / current location / in-progress pick (DESIGN.md
   "Accent (user-configurable)"). */
.advanced-filter-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xxs);
  padding: 0 12px;
  min-height: 36px;
  flex: 0 0 auto;
}

.advanced-filter-btn.active {
  background: var(--color-ink);
  border-color: var(--color-ink);
  color: var(--color-canvas-surface);
}

.funnel {
  flex-shrink: 0;
}

.count {
  line-height: 1;
}
</style>

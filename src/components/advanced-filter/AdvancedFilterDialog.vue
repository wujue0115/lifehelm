<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import ModalOverlay from '@/components/ModalOverlay.vue'
import DialogHeader from '@/components/DialogHeader.vue'
import type { AdvancedFilterGroup } from '@/types/advanced-filter'
import { createGroup, normalizeAdvancedFilter } from '@/utils/advancedFilter'
import AdvancedFilterGroupEditor from './AdvancedFilterGroupEditor.vue'
import type { AdvancedFilterContext } from './types'

const props = defineProps<{
  open: boolean
  modelValue: AdvancedFilterGroup | undefined
  context: AdvancedFilterContext
}>()
const emit = defineEmits<{
  'update:modelValue': [AdvancedFilterGroup | undefined]
  close: []
}>()

const { t } = useI18n()

// Staged: the dialog edits a private deep clone and only writes back on
// Apply, so closing any other way (backdrop, Esc — both handled by
// ModalOverlay) discards a half-built condition tree. Same "preview then
// explicit commit" contract as DateFilter.
const draft = ref<AdvancedFilterGroup>(createGroup())

watch(
  () => props.open,
  (open) => {
    if (!open) return
    // Deep clone via a JSON round-trip — the tree is plain
    // strings/arrays/objects, and this also strips any reactive proxy off
    // the incoming value so the draft is fully detached until Apply.
    draft.value = props.modelValue
      ? (JSON.parse(JSON.stringify(props.modelValue)) as AdvancedFilterGroup)
      : createGroup()
  },
  { immediate: true },
)

function apply(): void {
  emit('update:modelValue', normalizeAdvancedFilter(draft.value))
  emit('close')
}
function clear(): void {
  draft.value = createGroup()
}
</script>

<template>
  <ModalOverlay :open="open" @close="emit('close')">
    <div class="panel">
      <DialogHeader :title="t('advancedFilter.title')" @close="emit('close')" />

      <div class="panel-body">
        <AdvancedFilterGroupEditor
          :group="draft"
          :context="context"
          root
          @update:group="draft = $event"
        />
      </div>

      <div class="footer">
        <button type="button" class="btn btn-secondary compact" @click="clear">
          {{ t('advancedFilter.clear') }}
        </button>
        <button type="button" class="btn btn-primary compact" @click="apply">
          {{ t('advancedFilter.apply') }}
        </button>
      </div>
    </div>
  </ModalOverlay>
</template>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  background: var(--color-canvas-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--rounded-lg);
  padding: var(--space-xl);
  max-width: 620px;
  width: 92%;
  max-height: 80vh;
}

.panel :deep(.panel-header) {
  margin-bottom: var(--space-md);
}

.panel-body {
  overflow-y: auto;
  flex: 1;
}

.footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
  margin-top: var(--space-md);
  padding-top: var(--space-md);
  border-top: 1px solid var(--color-border-subtle);
}

/* A control's own padding stays fixed — same as the global .btn class (see
   DESIGN.md "Appearance spacing"). */
.compact {
  padding: 6px 14px;
  min-height: auto;
}
</style>

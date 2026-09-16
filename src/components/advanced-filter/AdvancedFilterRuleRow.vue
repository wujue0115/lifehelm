<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import SelectMenu from '@/components/SelectMenu.vue'
import DatePicker from '@/components/DatePicker.vue'
import ActionIcon from '@/components/ActionIcon.vue'
import type {
  AdvancedFilterField,
  AdvancedFilterOperator,
  AdvancedFilterRule,
} from '@/types/advanced-filter'
import {
  FIELD_ORDER,
  FIELD_TYPE,
  VALUELESS_OPERATORS,
  coerceOperator,
  operatorsForField,
} from '@/utils/advancedFilter'
import type { AdvancedFilterContext, AdvancedFilterOption } from './types'

// Props-down / events-up: this row never mutates the rule it's handed, it
// emits a fresh rule object and the owning group editor swaps it into the
// draft tree.
const props = defineProps<{ rule: AdvancedFilterRule; context: AdvancedFilterContext }>()
const emit = defineEmits<{ 'update:rule': [AdvancedFilterRule]; remove: [] }>()

const { t } = useI18n()

const fieldOptions = computed<AdvancedFilterOption[]>(() =>
  FIELD_ORDER.map((field) => ({ value: field, label: t(`advancedFilter.field.${field}`) })),
)
const operatorOptions = computed<AdvancedFilterOption[]>(() =>
  operatorsForField(props.rule.field).map((operator) => ({
    value: operator,
    label: t(`advancedFilter.operator.${operator}`),
  })),
)

const fieldType = computed(() => FIELD_TYPE[props.rule.field])
const showValue = computed(() => !VALUELESS_OPERATORS.has(props.rule.operator))

const valueOptions = computed<AdvancedFilterOption[] | null>(() => {
  if (fieldType.value === 'select') {
    return props.rule.field === 'priority'
      ? props.context.priorityOptions
      : props.context.statusOptions
  }
  if (fieldType.value === 'tags') return props.context.tagOptions
  return null
})

function emitRule(patch: Partial<AdvancedFilterRule>): void {
  emit('update:rule', { ...props.rule, ...patch })
}

function setField(value: string): void {
  const field = value as AdvancedFilterField
  // Changing the field can invalidate the operator (and always the value) —
  // snap the operator back to a valid one and clear the stale value.
  emitRule({ field, operator: coerceOperator(field, props.rule.operator), value: '' })
}
function setOperator(value: string): void {
  emitRule({ operator: value as AdvancedFilterOperator })
}
function setValue(value: string): void {
  emitRule({ value })
}
</script>

<template>
  <div class="rule-row">
    <SelectMenu
      class="field-select"
      :model-value="rule.field"
      :options="fieldOptions"
      @update:model-value="setField"
    />
    <SelectMenu
      class="operator-select"
      :model-value="rule.operator"
      :options="operatorOptions"
      @update:model-value="setOperator"
    />

    <template v-if="showValue">
      <SelectMenu
        v-if="valueOptions"
        class="value-control"
        :model-value="rule.value"
        :options="valueOptions"
        @update:model-value="setValue"
      />
      <DatePicker
        v-else-if="fieldType === 'date'"
        class="value-control"
        :model-value="rule.value"
        @update:model-value="setValue"
      />
      <input
        v-else
        class="input type-body value-control"
        type="text"
        :value="rule.value"
        :placeholder="t('advancedFilter.valuePlaceholder')"
        @input="setValue(($event.target as HTMLInputElement).value)"
      />
    </template>
    <span v-else class="value-control" />

    <button
      type="button"
      class="btn btn-ghost action-btn remove-btn"
      :title="t('advancedFilter.removeCondition')"
      @click="emit('remove')"
    >
      <ActionIcon type="delete" />
    </button>
  </div>
</template>

<style scoped>
/* Grid instead of flex so field/operator/value/remove line up in the same
   columns across every rule row in a group — with flex, each SelectMenu
   shrank to fit its own label, so a row with a longer field/operator label
   drifted out of alignment with its siblings. Fixed field/operator tracks
   match SelectMenu's own 140px trigger min-width. The value column is a
   bounded minmax rather than `1fr`: a `fr` track's contribution to this
   row's own max-content size is unreliable once an ancestor (group-editor)
   is itself width:fit-content — a fixed upper bound keeps the row's width
   fully content-derived instead of depending on that. */
.rule-row {
  display: grid;
  grid-template-columns: 140px 140px minmax(120px, 260px) auto;
  align-items: center;
  gap: var(--space-xs);
}

.value-control {
  min-width: 0;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  min-height: auto;
}
</style>

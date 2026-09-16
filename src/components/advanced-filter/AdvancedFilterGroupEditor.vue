<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import SelectMenu from '@/components/SelectMenu.vue'
import ActionIcon from '@/components/ActionIcon.vue'
import type { AdvancedFilterGroup, AdvancedFilterNode } from '@/types/advanced-filter'
import { createGroup, createRule } from '@/utils/advancedFilter'
import AdvancedFilterRuleRow from './AdvancedFilterRuleRow.vue'
import type { AdvancedFilterContext } from './types'

// Recursive: renders one group of the draft tree and, for each child that is
// itself a group, another instance of this component (Vue resolves the
// self-reference by filename). Props-down / events-up throughout — every
// edit emits a fresh group object; the parent (dialog root, or the enclosing
// group editor) swaps it into the tree.
const props = defineProps<{
  group: AdvancedFilterGroup
  context: AdvancedFilterContext
  root?: boolean
}>()
const emit = defineEmits<{ 'update:group': [AdvancedFilterGroup]; remove: [] }>()

const { t } = useI18n()

const combinatorOptions = computed(() => [
  { value: 'and', label: t('advancedFilter.and') },
  { value: 'or', label: t('advancedFilter.or') },
])
const combinatorLabel = computed(() =>
  props.group.combinator === 'or' ? t('advancedFilter.or') : t('advancedFilter.and'),
)

function emitGroup(patch: Partial<AdvancedFilterGroup>): void {
  emit('update:group', { ...props.group, ...patch })
}
function updateChild(index: number, node: AdvancedFilterNode): void {
  emitGroup({ children: props.group.children.map((child, i) => (i === index ? node : child)) })
}
function removeChild(index: number): void {
  emitGroup({ children: props.group.children.filter((_, i) => i !== index) })
}
function addRule(): void {
  emitGroup({ children: [...props.group.children, createRule()] })
}
function addGroup(): void {
  emitGroup({ children: [...props.group.children, createGroup([createRule()])] })
}
function setCombinator(value: string): void {
  emitGroup({ combinator: value === 'or' ? 'or' : 'and' })
}
</script>

<template>
  <div class="group-editor" :class="{ nested: !root }">
    <div v-if="!root" class="group-head">
      <span class="type-label group-tag">{{ t('advancedFilter.groupLabel') }}</span>
      <button
        type="button"
        class="btn btn-ghost action-btn"
        :title="t('advancedFilter.removeGroup')"
        @click="emit('remove')"
      >
        <ActionIcon type="delete" />
      </button>
    </div>

    <p v-if="group.children.length === 0" class="type-caption empty-hint">
      {{ t('advancedFilter.emptyHint') }}
    </p>

    <div v-for="(child, index) in group.children" :key="child.id" class="child-row">
      <div class="rail">
        <span v-if="index === 0" class="type-label rail-text">{{ t('advancedFilter.where') }}</span>
        <SelectMenu
          v-else-if="index === 1"
          class="combinator-select"
          :model-value="group.combinator"
          :options="combinatorOptions"
          @update:model-value="setCombinator"
        />
        <span v-else class="type-label rail-text">{{ combinatorLabel }}</span>
      </div>

      <div class="child-body">
        <AdvancedFilterGroupEditor
          v-if="child.type === 'group'"
          :group="child"
          :context="context"
          @update:group="updateChild(index, $event)"
          @remove="removeChild(index)"
        />
        <AdvancedFilterRuleRow
          v-else
          :rule="child"
          :context="context"
          @update:rule="updateChild(index, $event)"
          @remove="removeChild(index)"
        />
      </div>
    </div>

    <div class="group-actions">
      <button type="button" class="btn btn-ghost add-btn" @click="addRule">
        + {{ t('advancedFilter.addCondition') }}
      </button>
      <button type="button" class="btn btn-ghost add-btn" @click="addGroup">
        + {{ t('advancedFilter.addGroup') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Hug the widest row's content instead of stretching to fill the parent's
   full width — a short 1-condition group (nested or root) shouldn't
   inherit the dialog panel's full width. Capped at 100% so it still
   wraps/clips inside a narrow parent rather than overflowing it. */
.group-editor {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  width: fit-content;
  max-width: 100%;
}

.group-editor.nested {
  background: var(--color-canvas-app);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--rounded-md);
  padding: var(--space-sm);
}

.group-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.group-tag {
  color: var(--color-ink-secondary);
}

.empty-hint {
  color: var(--color-ink-muted);
}

/* Grid so the rail and the rule/group body line up in fixed columns instead
   of a flex-basis approximation — same reasoning as rule-row's grid. Body
   column is `max-content`, not `1fr`: with group-editor now width:fit-
   content, there's no leftover row space to flex into, and `max-content`
   (unlike a flexible track) has unambiguous, content-only intrinsic sizing
   — every child-row still ends up the same final width because they're
   flex items stretched to group-editor's own resolved fit-content width. */
.child-row {
  display: grid;
  grid-template-columns: 84px max-content;
  align-items: start;
  gap: var(--space-xs);
}

.rail {
  display: flex;
  align-items: center;
  min-height: 36px;
}

.rail-text {
  color: var(--color-ink-secondary);
}

.combinator-select {
  width: 100%;
}

.combinator-select :deep(.trigger) {
  min-width: 0;
}

.child-body {
  min-width: 0;
}

.group-actions {
  display: flex;
  gap: var(--space-xs);
  flex-wrap: wrap;
  padding-left: calc(84px + var(--space-xs));
}

/* Match the toolbar gear's single-icon ghost footprint. */
.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  min-height: auto;
}

.add-btn {
  padding: 6px 10px;
  min-height: auto;
  color: var(--color-ink-secondary);
}
</style>

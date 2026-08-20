<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useViewsStore } from '@/stores/views'
import { defaultLayoutEntry } from '@/widgets/registry'
import GridLayout from '@/components/GridLayout.vue'
import WidgetPicker from '@/components/WidgetPicker.vue'
import ActionIcon from '@/components/ActionIcon.vue'
import ChevronIcon from '@/components/ChevronIcon.vue'
import SwitchToggle from '@/components/SwitchToggle.vue'
import ViewIconPicker from '@/components/ViewIconPicker.vue'
import type { View, WidgetLayoutEntry } from '@/types/view'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const viewsStore = useViewsStore()

const editable = computed(() => route.name === 'view-edit')

onMounted(() => {
  if (viewsStore.views.length === 0) viewsStore.fetchAll()
})

const view = computed(() => viewsStore.views.find((v) => v.id === route.params.viewId))

// Edits are staged here and only sent to the server on explicit Save, so
// dragging/resizing widgets doesn't fire a request per mouse-move.
const draftName = ref('')
const draftIcon = ref<string | undefined>(undefined)
const draftLayout = ref<WidgetLayoutEntry[]>([])
const draftFlow = ref(true)
const saving = ref(false)
const saveError = ref<string | null>(null)

function applyViewToDraft(v: View): void {
  draftName.value = v.name
  draftIcon.value = v.icon
  draftLayout.value = v.layout.map((entry) => ({ ...entry }))
  draftFlow.value = v.layoutFlow ?? true
  saveError.value = null
}

watch(
  view,
  (v) => {
    if (v) applyViewToDraft(v)
  },
  { immediate: true },
)

const isDirty = computed(() => {
  if (!view.value) return false
  return (
    draftName.value !== view.value.name ||
    draftIcon.value !== view.value.icon ||
    draftFlow.value !== (view.value.layoutFlow ?? true) ||
    JSON.stringify(draftLayout.value) !== JSON.stringify(view.value.layout)
  )
})

async function saveChanges(): Promise<void> {
  if (!view.value || !isDirty.value) return
  saving.value = true
  saveError.value = null
  try {
    await viewsStore.updateView(view.value.id, {
      name: draftName.value,
      icon: draftIcon.value,
      layout: draftLayout.value,
      layoutFlow: draftFlow.value,
    })
    router.back()
  } catch (err) {
    saveError.value = (err as Error).message
  } finally {
    saving.value = false
  }
}

function onLayoutChange(layout: WidgetLayoutEntry[]): void {
  draftLayout.value = layout
}
function onAddWidget(widgetId: string): void {
  draftLayout.value = [...draftLayout.value, defaultLayoutEntry(widgetId)]
}
function onToggleFlow(value: boolean): void {
  draftFlow.value = value
}

const editingName = ref(false)
const nameInput = ref('')

function startRenameView(): void {
  nameInput.value = draftName.value
  editingName.value = true
}

function finishRenameView(): void {
  const name = nameInput.value.trim()
  if (name) draftName.value = name
  editingName.value = false
}
</script>

<template>
  <div v-if="viewsStore.loading || !view" class="renderer-status">
    <p v-if="viewsStore.loading" class="type-body">{{ t('common.loading') }}</p>
    <p v-else class="type-body error">{{ t('view.notFound') }}</p>
  </div>
  <main v-else class="view-page">
    <div v-if="editable" class="name-header">
      <ViewIconPicker v-model="draftIcon" :template-type="view.templateType" />
      <input
        v-if="editingName"
        v-model="nameInput"
        class="input type-page-title name-input"
        @blur="finishRenameView"
        @keyup.enter="finishRenameView"
      />
      <template v-else>
        <h1 class="type-page-title">{{ draftName }}</h1>
        <button type="button" class="icon-btn" :title="t('view.rename')" @click="startRenameView">
          <ActionIcon type="edit" />
        </button>
      </template>
    </div>
    <div v-if="editable" class="layout-toolbar">
      <RouterLink to="/templates" class="btn btn-secondary">
        <ChevronIcon direction="back" />
        <span class="icon-label">{{ t('view.backToTemplates') }}</span>
      </RouterLink>
      <WidgetPicker @add="onAddWidget" />
      <div class="toolbar-right">
        <span v-if="saveError" class="type-body-sm error">{{ saveError }}</span>
        <div class="flow-toggle">
          <span class="type-label">{{ t('view.flowLayout') }}</span>
          <SwitchToggle
            :model-value="draftFlow"
            :label="draftFlow ? t('view.disableFlow') : t('view.enableFlow')"
            @update:model-value="onToggleFlow"
          />
        </div>
        <button
          type="button"
          class="btn btn-primary"
          :disabled="!isDirty || saving"
          @click="saveChanges"
        >
          {{ saving ? t('common.saving') : t('common.save') }}
        </button>
      </div>
    </div>
    <GridLayout
      :layout="draftLayout"
      :editable="editable"
      :flow="draftFlow"
      @update:layout="onLayoutChange"
    />
  </main>
</template>

<style scoped>
.view-page {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  padding: var(--space-xl);
}

.name-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.name-header h1 {
  margin: 0;
}

.name-input {
  max-width: 400px;
}

/* border-radius matches every other button's {rounded.md}. Hover adds a
   light accent tint background (same 12% mix SelectMenu's own
   `.option.selected` uses) on top of the existing color shift, not the
   plain `{colors.surface-hover}` gray other ghost surfaces use. Padding
   bumped from 0 to 2px so the new hover background has room to read as a
   rounded box around the icon rather than hugging its glyph exactly. */
.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-radius: var(--rounded-md);
  cursor: pointer;
  color: var(--color-ink-muted);
  padding: 2px;
}

.icon-btn:hover {
  color: var(--color-ink);
  background: color-mix(in srgb, var(--color-accent) 12%, transparent);
}

.layout-toolbar {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-left: auto;
}

.flow-toggle {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  color: var(--color-ink-secondary);
}

.renderer-status {
  padding: var(--space-xl);
}

.error {
  font-weight: 700;
}
</style>

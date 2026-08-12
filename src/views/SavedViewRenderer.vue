<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useSavedViewsStore } from '@/stores/savedViews'
import { defaultLayoutEntry } from '@/widgets/registry'
import GridLayout from '@/components/GridLayout.vue'
import WidgetPicker from '@/components/WidgetPicker.vue'
import ActionIcon from '@/components/ActionIcon.vue'
import ChevronIcon from '@/components/ChevronIcon.vue'
import SwitchToggle from '@/components/SwitchToggle.vue'
import type { SavedView, WidgetLayoutEntry } from '@/types/saved-view'

const route = useRoute()
const { t } = useI18n()
const savedViewsStore = useSavedViewsStore()

const editable = computed(() => route.name === 'saved-view-edit')

onMounted(() => {
  if (savedViewsStore.views.length === 0) savedViewsStore.fetchAll()
})

const view = computed(() => savedViewsStore.views.find((v) => v.id === route.params.viewId))

// Edits are staged here and only sent to the server on explicit Save, so
// dragging/resizing widgets doesn't fire a request per mouse-move.
const draftName = ref('')
const draftLayout = ref<WidgetLayoutEntry[]>([])
const draftFlow = ref(true)
const saving = ref(false)
const saveError = ref<string | null>(null)

function applyViewToDraft(v: SavedView): void {
  draftName.value = v.name
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
    draftFlow.value !== (view.value.layoutFlow ?? true) ||
    JSON.stringify(draftLayout.value) !== JSON.stringify(view.value.layout)
  )
})

async function saveChanges(): Promise<void> {
  if (!view.value || !isDirty.value) return
  saving.value = true
  saveError.value = null
  try {
    await savedViewsStore.updateView(view.value.id, {
      name: draftName.value,
      layout: draftLayout.value,
      layoutFlow: draftFlow.value,
    })
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
  <div v-if="savedViewsStore.loading || !view" class="renderer-status">
    <p v-if="savedViewsStore.loading" class="type-body">{{ t('common.loading') }}</p>
    <p v-else class="type-body error">{{ t('savedView.notFound') }}</p>
  </div>
  <main v-else class="saved-view-page">
    <div v-if="editable" class="name-header">
      <input
        v-if="editingName"
        v-model="nameInput"
        class="input type-page-title name-input"
        @blur="finishRenameView"
        @keyup.enter="finishRenameView"
      />
      <template v-else>
        <h1 class="type-page-title">{{ draftName }}</h1>
        <button
          type="button"
          class="icon-btn"
          :title="t('savedView.rename')"
          @click="startRenameView"
        >
          <ActionIcon type="edit" />
        </button>
      </template>
    </div>
    <div v-if="editable" class="layout-toolbar">
      <RouterLink to="/templates" class="btn btn-secondary">
        <ChevronIcon direction="back" />
        <span class="icon-label">{{ t('savedView.backToTemplates') }}</span>
      </RouterLink>
      <WidgetPicker @add="onAddWidget" />
      <div class="toolbar-right">
        <span v-if="saveError" class="type-body-sm error">{{ saveError }}</span>
        <div class="flow-toggle">
          <span class="type-label">{{ t('savedView.flowLayout') }}</span>
          <SwitchToggle
            :model-value="draftFlow"
            :label="draftFlow ? t('savedView.disableFlow') : t('savedView.enableFlow')"
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
.saved-view-page {
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

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-ink-muted);
  padding: 0;
}

.icon-btn:hover {
  color: var(--color-ink);
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

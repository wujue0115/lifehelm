<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useSavedViewsStore } from '@/stores/savedViews'
import { defaultLayoutEntry } from '@/widgets/registry'
import GridLayout from '@/components/GridLayout.vue'
import WidgetPicker from '@/components/WidgetPicker.vue'
import ActionIcon from '@/components/ActionIcon.vue'
import ChevronIcon from '@/components/ChevronIcon.vue'
import type { WidgetLayoutEntry } from '@/types/saved-view'

const route = useRoute()
const { t } = useI18n()
const savedViewsStore = useSavedViewsStore()

const editable = computed(() => route.name === 'saved-view-edit')

onMounted(() => {
  if (savedViewsStore.views.length === 0) savedViewsStore.fetchAll()
})

const view = computed(() => savedViewsStore.views.find((v) => v.id === route.params.viewId))

function onLayoutChange(layout: WidgetLayoutEntry[]): void {
  if (view.value) savedViewsStore.updateView(view.value.id, { layout })
}
function onAddWidget(widgetId: string): void {
  if (view.value) onLayoutChange([...view.value.layout, defaultLayoutEntry(widgetId)])
}

const editingName = ref(false)
const nameDraft = ref('')

function startRenameView(): void {
  if (!view.value) return
  nameDraft.value = view.value.name
  editingName.value = true
}

async function saveRenameView(): Promise<void> {
  if (!view.value) return
  const name = nameDraft.value.trim()
  if (name && name !== view.value.name) {
    await savedViewsStore.updateView(view.value.id, { name })
  }
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
        v-model="nameDraft"
        class="input type-page-title name-input"
        @blur="saveRenameView"
        @keyup.enter="saveRenameView"
      />
      <template v-else>
        <h1 class="type-page-title">{{ view.name }}</h1>
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
    </div>
    <GridLayout :layout="view.layout" :editable="editable" @update:layout="onLayoutChange" />
  </main>
</template>

<style scoped>
.saved-view-page {
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

.renderer-status {
  padding: var(--space-xl);
}

.error {
  font-weight: 700;
}
</style>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useSavedViewsStore } from '@/stores/savedViews'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import SwitchToggle from '@/components/SwitchToggle.vue'
import ActionIcon from '@/components/ActionIcon.vue'

const { t } = useI18n()
const router = useRouter()
const savedViewsStore = useSavedViewsStore()

const pendingDeleteId = ref<string | null>(null)

onMounted(() => {
  if (savedViewsStore.views.length === 0) savedViewsStore.fetchAll()
})

async function createPage(): Promise<void> {
  const created = await savedViewsStore.createView({
    name: t('templates.untitledName'),
    templateType: 'list',
    pinned: false,
    layout: [],
  })
  router.push(`/views/${created.id}/edit`)
}

async function duplicate(id: string, name: string): Promise<void> {
  await savedViewsStore.duplicateView(id, t('savedView.duplicateNameSuffix', { name }))
}

function requestDelete(id: string): void {
  pendingDeleteId.value = id
}

async function confirmDelete(): Promise<void> {
  if (pendingDeleteId.value) await savedViewsStore.deleteView(pendingDeleteId.value)
  pendingDeleteId.value = null
}
</script>

<template>
  <main class="template-manager">
    <div class="header">
      <button type="button" class="btn btn-primary" @click="createPage">
        {{ t('templates.newPage') }}
      </button>
    </div>
    <div class="table-card">
      <table v-if="savedViewsStore.views.length" class="table">
        <thead>
          <tr class="type-label">
            <th>{{ t('templates.columnName') }}</th>
            <th>{{ t('templates.columnPinned') }}</th>
            <th>{{ t('templates.columnActions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="view in savedViewsStore.views" :key="view.id">
            <td>
              <RouterLink :to="`/views/${view.id}/edit`" class="view-link type-body">
                {{ view.name }}
              </RouterLink>
            </td>
            <td>
              <SwitchToggle
                :model-value="view.pinned"
                :label="view.pinned ? t('savedView.unpin') : t('savedView.pin')"
                @update:model-value="(pinned) => savedViewsStore.updateView(view.id, { pinned })"
              />
            </td>
            <td class="actions">
              <RouterLink
                :to="`/views/${view.id}/edit`"
                class="btn-ghost action-btn"
                :title="t('savedView.editLayout')"
              >
                <ActionIcon type="edit" />
              </RouterLink>
              <button
                type="button"
                class="btn-ghost action-btn"
                :title="t('savedView.duplicate')"
                @click="duplicate(view.id, view.name)"
              >
                <ActionIcon type="duplicate" />
              </button>
              <button
                type="button"
                class="btn-ghost action-btn"
                :disabled="view.id.startsWith('default-')"
                :title="
                  view.id.startsWith('default-')
                    ? t('savedView.defaultViewProtected')
                    : t('savedView.delete')
                "
                @click="requestDelete(view.id)"
              >
                <ActionIcon type="delete" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-else class="type-body empty">{{ t('templates.empty') }}</p>
    </div>

    <ConfirmDialog
      :open="pendingDeleteId !== null"
      :title="t('savedView.deleteConfirmTitle')"
      :message="t('savedView.deleteConfirmMessage')"
      @confirm="confirmDelete"
      @cancel="pendingDeleteId = null"
    />
  </main>
</template>

<style scoped>
.template-manager {
  padding: var(--space-xl);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.header {
  display: flex;
  justify-content: flex-end;
}

.table-card {
  background: var(--color-canvas-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--rounded-md);
  overflow: hidden;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th {
  text-align: left;
  padding: 10px 12px;
  color: var(--color-ink-secondary);
  border-bottom: 1px solid var(--color-border-strong);
}

.table td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--color-border-subtle);
}

.table tr:last-child td {
  border-bottom: none;
}

.view-link {
  color: var(--color-ink);
  text-decoration: none;
}

.view-link:hover {
  text-decoration: underline;
}

.actions {
  display: flex;
  gap: var(--space-xs);
  flex-wrap: wrap;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  min-height: auto;
}

.empty {
  color: var(--color-ink-muted);
  padding: var(--space-xxl) 0;
  text-align: center;
}
</style>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useViewsStore } from '@/stores/views'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import SwitchToggle from '@/components/SwitchToggle.vue'
import ActionIcon from '@/components/ActionIcon.vue'
import SortIcon from '@/components/SortIcon.vue'

type SortKey = 'name' | 'pinned'

const { t } = useI18n()
const router = useRouter()
const viewsStore = useViewsStore()

const pendingDeleteId = ref<string | null>(null)
const sortKey = ref<SortKey | null>(null)
const sortDir = ref<'asc' | 'desc'>('asc')

const sortedViews = computed(() => {
  if (sortKey.value === null) return viewsStore.views
  const list = [...viewsStore.views]
  list.sort((a, b) => {
    const result =
      sortKey.value === 'name' ? a.name.localeCompare(b.name) : Number(a.pinned) - Number(b.pinned)
    return sortDir.value === 'asc' ? result : -result
  })
  return list
})

function toggleSort(key: SortKey): void {
  if (sortKey.value !== key) {
    sortKey.value = key
    sortDir.value = 'asc'
  } else if (sortDir.value === 'asc') {
    sortDir.value = 'desc'
  } else {
    sortKey.value = null
  }
}

function sortDirFor(key: SortKey): 'asc' | 'desc' | 'none' {
  return sortKey.value === key ? sortDir.value : 'none'
}

onMounted(() => {
  if (viewsStore.views.length === 0) viewsStore.fetchAll()
})

async function createPage(): Promise<void> {
  const created = await viewsStore.createView({
    name: t('templates.untitledName'),
    templateType: 'list',
    pinned: false,
    layout: [],
  })
  router.push(`/views/${created.id}/edit`)
}

async function duplicate(id: string, name: string): Promise<void> {
  await viewsStore.duplicateView(id, t('view.duplicateNameSuffix', { name }))
}

function requestDelete(id: string): void {
  pendingDeleteId.value = id
}

async function confirmDelete(): Promise<void> {
  if (pendingDeleteId.value) await viewsStore.deleteView(pendingDeleteId.value)
  pendingDeleteId.value = null
}
</script>

<template>
  <main class="template-manager">
    <div class="header">
      <button type="button" class="btn btn-primary" @click="createPage">
        <ActionIcon type="add" />
        <span class="icon-label">{{ t('templates.newPage') }}</span>
      </button>
    </div>
    <div class="table-card">
      <table v-if="sortedViews.length" class="table">
        <thead>
          <tr class="type-label">
            <th
              class="sortable"
              :aria-sort="
                sortKey === 'name' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'
              "
              @click="toggleSort('name')"
            >
              <span class="th-label">
                {{ t('templates.columnName') }}
                <SortIcon class="sort-indicator" :direction="sortDirFor('name')" />
              </span>
            </th>
            <th
              class="sortable"
              :aria-sort="
                sortKey === 'pinned' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'
              "
              @click="toggleSort('pinned')"
            >
              <span class="th-label">
                {{ t('templates.columnPinned') }}
                <SortIcon class="sort-indicator" :direction="sortDirFor('pinned')" />
              </span>
            </th>
            <th>{{ t('templates.columnActions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="view in sortedViews" :key="view.id">
            <td>
              <RouterLink :to="`/views/${view.id}/edit`" class="view-link type-body">
                {{ view.name }}
              </RouterLink>
            </td>
            <td>
              <SwitchToggle
                :model-value="view.pinned"
                :label="view.pinned ? t('view.unpin') : t('view.pin')"
                @update:model-value="(pinned) => viewsStore.updateView(view.id, { pinned })"
              />
            </td>
            <td class="actions">
              <RouterLink
                :to="`/views/${view.id}/edit`"
                class="btn btn-ghost action-btn"
                :title="t('view.editLayout')"
              >
                <ActionIcon type="edit" />
              </RouterLink>
              <button
                type="button"
                class="btn btn-ghost action-btn"
                :title="t('view.duplicate')"
                @click="duplicate(view.id, view.name)"
              >
                <ActionIcon type="duplicate" />
              </button>
              <button
                type="button"
                class="btn btn-ghost action-btn"
                :disabled="view.id.startsWith('default-')"
                :title="
                  view.id.startsWith('default-') ? t('view.defaultViewProtected') : t('view.delete')
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
      :title="t('view.deleteConfirmTitle')"
      :message="t('view.deleteConfirmMessage')"
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

.table th.sortable {
  cursor: pointer;
  user-select: none;
}

.table th.sortable:hover {
  color: var(--color-ink);
}

.th-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  line-height: 16px;
}

.sort-indicator {
  font-size: 16px;
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

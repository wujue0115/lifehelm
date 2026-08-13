import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api } from '@/api/client'
import type { View } from '@/types/view'

export const useViewsStore = defineStore('views', () => {
  const views = ref<View[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const pinnedViews = computed(() => views.value.filter((view) => view.pinned))

  async function fetchAll(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      views.value = await api.listViews()
    } catch (err) {
      error.value = (err as Error).message
    } finally {
      loading.value = false
    }
  }

  async function createView(input: Partial<View>): Promise<View> {
    const created = await api.createView(input)
    views.value.push(created)
    return created
  }

  function applyUpdatedView(updated: View): View {
    const index = views.value.findIndex((view) => view.id === updated.id)
    if (index !== -1) views.value[index] = updated
    return updated
  }

  async function updateView(id: string, input: Partial<View>): Promise<View> {
    return applyUpdatedView(await api.updateView(id, input))
  }

  async function deleteView(id: string): Promise<void> {
    await api.deleteView(id)
    views.value = views.value.filter((view) => view.id !== id)
  }

  async function duplicateView(id: string, name: string): Promise<View> {
    const source = views.value.find((view) => view.id === id)
    if (!source) throw new Error('view not found')
    return createView({
      name,
      templateType: source.templateType,
      pinned: false,
      layout: source.layout.map((entry) => ({
        ...entry,
        instanceId: crypto.randomUUID(),
        config: entry.config ? { ...entry.config } : undefined,
      })),
    })
  }

  return {
    views,
    loading,
    error,
    pinnedViews,
    fetchAll,
    createView,
    updateView,
    deleteView,
    duplicateView,
  }
})

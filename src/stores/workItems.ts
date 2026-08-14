import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api } from '@/api/client'
import type {
  PriorityOption,
  StatusOption,
  TagOption,
  TimeEntry,
  WorkItem,
} from '@/types/work-item'
import { getDoneStatusName } from '@/utils/status'

export const useWorkItemsStore = defineStore('workItems', () => {
  const items = ref<WorkItem[]>([])
  const statuses = ref<StatusOption[]>([])
  const tags = ref<TagOption[]>([])
  const priorities = ref<PriorityOption[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const sortedStatuses = computed(() => [...statuses.value].sort((a, b) => a.order - b.order))
  const doneStatusName = computed(() => getDoneStatusName(statuses.value))
  const allTags = computed(() => {
    const tagSet = new Set<string>()
    for (const item of items.value) {
      for (const tag of item.tags) tagSet.add(tag)
    }
    for (const tag of tags.value) tagSet.add(tag.name)
    return Array.from(tagSet).sort()
  })

  // Registered tags carry a persisted `order`; tags that only exist because
  // an item references them (never explicitly added as a board column) have
  // no order to honor, so they're appended alphabetically after the ordered
  // ones. Used for the board's tag-grouped columns, which need a stable,
  // user-arranged order — unlike `allTags`, which stays alphabetical for
  // filter dropdowns/suggestions where findability matters more.
  const sortedTagNames = computed(() => {
    const ordered = [...tags.value].sort((a, b) => a.order - b.order).map((tag) => tag.name)
    const known = new Set(ordered)
    const unregistered = allTags.value.filter((name) => !known.has(name))
    return [...ordered, ...unregistered]
  })

  // Same shape as sortedTagNames: registered priorities (the 'low'/'medium'/
  // 'high' defaults plus any board-added custom ones) in persisted `order`,
  // then any priority value an item references but that never got
  // registered (e.g. hand-edited data) appended at the end.
  const sortedPriorities = computed(() => {
    const ordered = [...priorities.value].sort((a, b) => a.order - b.order)
    const known = new Set(ordered.map((priority) => priority.name))
    const unregisteredNames = new Set<string>()
    for (const item of items.value) {
      if (!known.has(item.priority)) unregisteredNames.add(item.priority)
    }
    return [
      ...ordered,
      ...Array.from(unregisteredNames)
        .sort()
        .map((name) => ({ id: name, name, order: ordered.length })),
    ]
  })

  function isItemCompleted(item: WorkItem): boolean {
    return item.status === doneStatusName.value
  }

  async function fetchAll(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const [fetchedItems, fetchedStatuses, fetchedTags, fetchedPriorities] = await Promise.all([
        api.listItems(),
        api.getStatuses(),
        api.getTags(),
        api.getPriorities(),
      ])
      items.value = fetchedItems
      statuses.value = fetchedStatuses
      tags.value = fetchedTags
      priorities.value = fetchedPriorities
    } catch (err) {
      error.value = (err as Error).message
    } finally {
      loading.value = false
    }
  }

  async function createItem(input: Partial<WorkItem>): Promise<WorkItem> {
    const created = await api.createItem(input)
    items.value.push(created)
    return created
  }

  function applyUpdatedItem(updated: WorkItem): WorkItem {
    const index = items.value.findIndex((item) => item.id === updated.id)
    if (index !== -1) items.value[index] = updated
    return updated
  }

  async function updateItem(id: string, input: Partial<WorkItem>): Promise<WorkItem> {
    return applyUpdatedItem(await api.updateItem(id, input))
  }

  async function deleteItem(id: string): Promise<void> {
    await api.deleteItem(id)
    items.value = items.value.filter((item) => item.id !== id)
  }

  async function updateStatuses(newStatuses: StatusOption[]): Promise<void> {
    statuses.value = await api.updateStatuses(newStatuses)
  }

  async function updateTags(newTags: TagOption[]): Promise<void> {
    tags.value = await api.updateTags(newTags)
  }

  async function ensureTagRegistered(name: string): Promise<void> {
    if (tags.value.some((tag) => tag.name === name)) return
    const nextOrder = tags.value.reduce((max, tag) => Math.max(max, tag.order), -1) + 1
    await updateTags([...tags.value, { id: crypto.randomUUID(), name, order: nextOrder }])
  }

  async function updatePriorities(newPriorities: PriorityOption[]): Promise<void> {
    priorities.value = await api.updatePriorities(newPriorities)
  }

  async function ensurePriorityRegistered(name: string): Promise<void> {
    if (priorities.value.some((priority) => priority.name === name)) return
    const nextOrder =
      priorities.value.reduce((max, priority) => Math.max(max, priority.order), -1) + 1
    await updatePriorities([
      ...priorities.value,
      { id: crypto.randomUUID(), name, order: nextOrder },
    ])
  }

  async function addComment(itemId: string, text: string): Promise<WorkItem> {
    return applyUpdatedItem(await api.addComment(itemId, text))
  }

  async function deleteComment(itemId: string, commentId: string): Promise<WorkItem> {
    return applyUpdatedItem(await api.deleteComment(itemId, commentId))
  }

  async function addAttachment(
    itemId: string,
    filename: string,
    mimeType: string,
    dataBase64: string,
  ): Promise<WorkItem> {
    return applyUpdatedItem(await api.addAttachment(itemId, filename, mimeType, dataBase64))
  }

  async function deleteAttachment(itemId: string, attachmentId: string): Promise<WorkItem> {
    return applyUpdatedItem(await api.deleteAttachment(itemId, attachmentId))
  }

  async function addTimeEntry(itemId: string, input?: Partial<TimeEntry>): Promise<WorkItem> {
    return applyUpdatedItem(await api.addTimeEntry(itemId, input))
  }

  async function updateTimeEntry(
    itemId: string,
    entryId: string,
    input: Partial<TimeEntry>,
  ): Promise<WorkItem> {
    return applyUpdatedItem(await api.updateTimeEntry(itemId, entryId, input))
  }

  async function deleteTimeEntry(itemId: string, entryId: string): Promise<WorkItem> {
    return applyUpdatedItem(await api.deleteTimeEntry(itemId, entryId))
  }

  return {
    items,
    statuses,
    tags,
    priorities,
    sortedStatuses,
    doneStatusName,
    allTags,
    sortedTagNames,
    sortedPriorities,
    isItemCompleted,
    loading,
    error,
    fetchAll,
    createItem,
    updateItem,
    deleteItem,
    updateStatuses,
    updateTags,
    ensureTagRegistered,
    updatePriorities,
    ensurePriorityRegistered,
    addComment,
    deleteComment,
    addAttachment,
    deleteAttachment,
    addTimeEntry,
    updateTimeEntry,
    deleteTimeEntry,
  }
})

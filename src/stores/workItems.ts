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
import type { TagColorKey } from '@/config/tagColors'
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
  const celebrating = ref(false)
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
    const before = items.value.find((item) => item.id === id)
    const wasCompleted = before ? isItemCompleted(before) : false
    const updated = applyUpdatedItem(await api.updateItem(id, input))
    if (!wasCompleted && isItemCompleted(updated)) celebrating.value = true
    return updated
  }

  function endCelebration(): void {
    celebrating.value = false
  }

  async function deleteItem(id: string): Promise<void> {
    await api.deleteItem(id)
    items.value = items.value.filter((item) => item.id !== id)
  }

  async function updateStatuses(newStatuses: StatusOption[]): Promise<void> {
    statuses.value = await api.updateStatuses(newStatuses)
  }

  // Every status is always a real, registered StatusOption (unlike tags/
  // priorities, there's no free-text path that could reference an
  // unregistered name), so this never needs an ensure/register fallback.
  async function setStatusColor(name: string, color: TagColorKey | undefined): Promise<void> {
    const updated = statuses.value.map((status) =>
      status.name === name ? { ...status, color } : status,
    )
    await updateStatuses(updated)
  }

  async function updateTags(newTags: TagOption[]): Promise<void> {
    tags.value = await api.updateTags(newTags)
  }

  async function ensureTagRegistered(name: string): Promise<void> {
    if (tags.value.some((tag) => tag.name === name)) return
    const nextOrder = tags.value.reduce((max, tag) => Math.max(max, tag.order), -1) + 1
    await updateTags([...tags.value, { id: crypto.randomUUID(), name, order: nextOrder }])
  }

  // Unlike status, a tag color can target a name that isn't registered yet
  // (an item-only tag never explicitly added via the board) — assigning it a
  // color is itself the registration moment, same as ListPanel's existing
  // "assigning a color registers the tag" behavior.
  async function setTagColor(name: string, color: TagColorKey | undefined): Promise<void> {
    const existing = tags.value.find((tag) => tag.name === name)
    if (existing) {
      const updated = tags.value.map((tag) => (tag.name === name ? { ...tag, color } : tag))
      await updateTags(updated)
    } else if (color) {
      const nextOrder = tags.value.reduce((max, tag) => Math.max(max, tag.order), -1) + 1
      await updateTags([...tags.value, { id: crypto.randomUUID(), name, order: nextOrder, color }])
    }
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

  // Same registration-on-assignment rule as setTagColor — sortedPriorities
  // can surface a name that's only synthesized from item data, not backed by
  // a real PriorityOption yet.
  async function setPriorityColor(name: string, color: TagColorKey | undefined): Promise<void> {
    const existing = priorities.value.find((priority) => priority.name === name)
    if (existing) {
      const updated = priorities.value.map((priority) =>
        priority.name === name ? { ...priority, color } : priority,
      )
      await updatePriorities(updated)
    } else if (color) {
      const nextOrder =
        priorities.value.reduce((max, priority) => Math.max(max, priority.order), -1) + 1
      await updatePriorities([
        ...priorities.value,
        { id: crypto.randomUUID(), name, order: nextOrder, color },
      ])
    }
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
    celebrating,
    loading,
    error,
    fetchAll,
    createItem,
    updateItem,
    endCelebration,
    deleteItem,
    updateStatuses,
    setStatusColor,
    updateTags,
    ensureTagRegistered,
    setTagColor,
    updatePriorities,
    ensurePriorityRegistered,
    setPriorityColor,
    addComment,
    deleteComment,
    addAttachment,
    deleteAttachment,
    addTimeEntry,
    updateTimeEntry,
    deleteTimeEntry,
  }
})

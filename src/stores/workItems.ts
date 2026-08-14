import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api } from '@/api/client'
import type { BoardColumn, Tag, TimeEntry, WorkItem } from '@/types/work-item'
import { getDoneColumnId } from '@/utils/board'

export const useWorkItemsStore = defineStore('workItems', () => {
  const items = ref<WorkItem[]>([])
  const board = ref<BoardColumn[]>([])
  const tags = ref<Tag[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const sortedBoard = computed(() => [...board.value].sort((a, b) => a.order - b.order))
  const doneColumnId = computed(() => getDoneColumnId(board.value))
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

  function isItemCompleted(item: WorkItem): boolean {
    return item.statusId === doneColumnId.value
  }

  async function fetchAll(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const [fetchedItems, fetchedBoard, fetchedTags] = await Promise.all([
        api.listItems(),
        api.getBoard(),
        api.getTags(),
      ])
      items.value = fetchedItems
      board.value = fetchedBoard
      tags.value = fetchedTags
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

  async function updateBoard(columns: BoardColumn[]): Promise<void> {
    board.value = await api.updateBoard(columns)
  }

  async function updateTags(newTags: Tag[]): Promise<void> {
    tags.value = await api.updateTags(newTags)
  }

  async function ensureTagRegistered(name: string): Promise<void> {
    if (tags.value.some((tag) => tag.name === name)) return
    const nextOrder = tags.value.reduce((max, tag) => Math.max(max, tag.order), -1) + 1
    await updateTags([...tags.value, { id: crypto.randomUUID(), name, order: nextOrder }])
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
    board,
    tags,
    sortedBoard,
    doneColumnId,
    allTags,
    sortedTagNames,
    isItemCompleted,
    loading,
    error,
    fetchAll,
    createItem,
    updateItem,
    deleteItem,
    updateBoard,
    updateTags,
    ensureTagRegistered,
    addComment,
    deleteComment,
    addAttachment,
    deleteAttachment,
    addTimeEntry,
    updateTimeEntry,
    deleteTimeEntry,
  }
})

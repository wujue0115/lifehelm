import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api } from '@/api/client'
import type { BoardColumn, TimeEntry, WorkItem } from '@/types/work-item'

export const useWorkItemsStore = defineStore('workItems', () => {
  const items = ref<WorkItem[]>([])
  const board = ref<BoardColumn[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const sortedBoard = computed(() => [...board.value].sort((a, b) => a.order - b.order))
  const lastColumnId = computed(() => sortedBoard.value[sortedBoard.value.length - 1]?.id)

  function isItemCompleted(item: WorkItem): boolean {
    return item.statusId === lastColumnId.value
  }

  async function fetchAll(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const [fetchedItems, fetchedBoard] = await Promise.all([api.listItems(), api.getBoard()])
      items.value = fetchedItems
      board.value = fetchedBoard
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
    sortedBoard,
    lastColumnId,
    isItemCompleted,
    loading,
    error,
    fetchAll,
    createItem,
    updateItem,
    deleteItem,
    updateBoard,
    addComment,
    deleteComment,
    addAttachment,
    deleteAttachment,
    addTimeEntry,
    updateTimeEntry,
    deleteTimeEntry,
  }
})

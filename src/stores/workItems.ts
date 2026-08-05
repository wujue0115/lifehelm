import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api } from '@/api/client'
import type { BoardColumn, WorkItem } from '@/types/work-item'

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

  async function updateItem(id: string, input: Partial<WorkItem>): Promise<WorkItem> {
    const updated = await api.updateItem(id, input)
    const index = items.value.findIndex((item) => item.id === id)
    if (index !== -1) items.value[index] = updated
    return updated
  }

  async function deleteItem(id: string): Promise<void> {
    await api.deleteItem(id)
    items.value = items.value.filter((item) => item.id !== id)
  }

  async function updateBoard(columns: BoardColumn[]): Promise<void> {
    board.value = await api.updateBoard(columns)
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
  }
})

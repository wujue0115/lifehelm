import type { BoardColumn, WorkItem } from '@/types/work-item'

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(body.error ?? `Request failed: ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export const api = {
  listItems: () => request<WorkItem[]>('/api/items'),
  createItem: (input: Partial<WorkItem>) =>
    request<WorkItem>('/api/items', { method: 'POST', body: JSON.stringify(input) }),
  getItem: (id: string) => request<WorkItem>(`/api/items/${id}`),
  updateItem: (id: string, input: Partial<WorkItem>) =>
    request<WorkItem>(`/api/items/${id}`, { method: 'PUT', body: JSON.stringify(input) }),
  deleteItem: (id: string) => request<void>(`/api/items/${id}`, { method: 'DELETE' }),

  getBoard: () => request<BoardColumn[]>('/api/board'),
  updateBoard: (columns: BoardColumn[]) =>
    request<BoardColumn[]>('/api/board', { method: 'PUT', body: JSON.stringify(columns) }),
}

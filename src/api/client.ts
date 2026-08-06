import type { BoardColumn, TimeEntry, WorkItem } from '@/types/work-item'

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

  addComment: (itemId: string, text: string) =>
    request<WorkItem>(`/api/items/${itemId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),
  deleteComment: (itemId: string, commentId: string) =>
    request<WorkItem>(`/api/items/${itemId}/comments/${commentId}`, { method: 'DELETE' }),

  addAttachment: (itemId: string, filename: string, mimeType: string, dataBase64: string) =>
    request<WorkItem>(`/api/items/${itemId}/attachments`, {
      method: 'POST',
      body: JSON.stringify({ filename, mimeType, dataBase64 }),
    }),
  deleteAttachment: (itemId: string, attachmentId: string) =>
    request<WorkItem>(`/api/items/${itemId}/attachments/${attachmentId}`, { method: 'DELETE' }),
  attachmentUrl: (attachmentId: string) => `/api/attachments/${attachmentId}`,

  addTimeEntry: (itemId: string, input?: Partial<TimeEntry>) =>
    request<WorkItem>(`/api/items/${itemId}/time-entries`, {
      method: 'POST',
      body: JSON.stringify(input ?? {}),
    }),
  updateTimeEntry: (itemId: string, entryId: string, input: Partial<TimeEntry>) =>
    request<WorkItem>(`/api/items/${itemId}/time-entries/${entryId}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    }),
  deleteTimeEntry: (itemId: string, entryId: string) =>
    request<WorkItem>(`/api/items/${itemId}/time-entries/${entryId}`, { method: 'DELETE' }),
}

import type {
  PriorityOption,
  StatusOption,
  TagOption,
  TimeEntry,
  WorkItem,
} from '@/types/work-item'
import type { ThemeConfig } from '@/types/theme-config'
import type { ExportConfig } from '@/types/export-config'
import type { View } from '@/types/view'

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

  getStatuses: () => request<StatusOption[]>('/api/status'),
  updateStatuses: (statuses: StatusOption[]) =>
    request<StatusOption[]>('/api/status', { method: 'PUT', body: JSON.stringify(statuses) }),

  getTags: () => request<TagOption[]>('/api/tags'),
  updateTags: (tags: TagOption[]) =>
    request<TagOption[]>('/api/tags', { method: 'PUT', body: JSON.stringify(tags) }),

  getPriorities: () => request<PriorityOption[]>('/api/priorities'),
  updatePriorities: (priorities: PriorityOption[]) =>
    request<PriorityOption[]>('/api/priorities', {
      method: 'PUT',
      body: JSON.stringify(priorities),
    }),

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

  getThemeConfig: () => request<ThemeConfig>('/api/theme-config'),
  updateThemeConfig: (config: ThemeConfig) =>
    request<ThemeConfig>('/api/theme-config', { method: 'PUT', body: JSON.stringify(config) }),

  getExportConfig: () => request<ExportConfig>('/api/export-config'),
  updateExportConfig: (config: ExportConfig) =>
    request<ExportConfig>('/api/export-config', { method: 'PUT', body: JSON.stringify(config) }),

  listViews: () => request<View[]>('/api/views'),
  createView: (input: Partial<View>) =>
    request<View>('/api/views', { method: 'POST', body: JSON.stringify(input) }),
  getView: (id: string) => request<View>(`/api/views/${id}`),
  updateView: (id: string, input: Partial<View>) =>
    request<View>(`/api/views/${id}`, { method: 'PUT', body: JSON.stringify(input) }),
  deleteView: (id: string) => request<void>(`/api/views/${id}`, { method: 'DELETE' }),
}

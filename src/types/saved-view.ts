export type SavedViewTemplateType = 'list' | 'board' | 'calendar' | 'dashboard'

export interface WidgetLayoutEntry {
  instanceId: string
  widgetId: string
  colSpan: number
  rowSpan: number
  config?: SavedViewConfig
}

export interface ListViewConfig {
  statusFilter: string
  priorityFilter: string
  tagFilter: string
  search: string
  sortKey: string
  sortDir: 'asc' | 'desc'
}

export type SavedViewConfig = Partial<ListViewConfig> | Record<string, never>

export const DEFAULT_LIST_CONFIG: ListViewConfig = {
  statusFilter: 'all',
  priorityFilter: 'all',
  tagFilter: 'all',
  search: '',
  sortKey: 'updatedAt',
  sortDir: 'desc',
}

export interface SavedView {
  id: string
  name: string
  templateType: SavedViewTemplateType
  pinned: boolean
  createdAt: string
  updatedAt: string
  layout: WidgetLayoutEntry[]
}

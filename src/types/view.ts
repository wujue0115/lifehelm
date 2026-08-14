import type { Priority } from './work-item.js'
import type { TagColorKey } from '../config/tagColors.js'

export type ViewTemplateType = 'list' | 'board' | 'calendar' | 'dashboard'

export interface WidgetLayoutEntry {
  instanceId: string
  widgetId: string
  colSpan: number
  rowSpan: number
  colStart?: number
  rowStart?: number
  config?: ViewConfig
}

export interface ListViewConfig {
  statusFilter: string
  priorityFilter: string
  tagFilter: string
  search: string
  sortKey: string
  sortDir: 'asc' | 'desc'
  statusColors?: Record<string, TagColorKey>
  priorityColors?: Partial<Record<Priority, TagColorKey>>
  tagColors?: Record<string, TagColorKey>
}

export type BoardGroupBy = 'status' | 'priority' | 'tag'

export interface BoardViewConfig {
  groupBy: BoardGroupBy
  priorityOrder?: Priority[]
}

export type ViewConfig = Partial<ListViewConfig> | Partial<BoardViewConfig> | Record<string, never>

export const DEFAULT_LIST_CONFIG: ListViewConfig = {
  statusFilter: 'all',
  priorityFilter: 'all',
  tagFilter: 'all',
  search: '',
  sortKey: 'updatedAt',
  sortDir: 'desc',
}

export interface View {
  id: string
  name: string
  templateType: ViewTemplateType
  pinned: boolean
  createdAt: string
  updatedAt: string
  layout: WidgetLayoutEntry[]
  /** When false, widgets keep their explicit colStart/rowStart instead of auto-packing. Defaults to true. */
  layoutFlow?: boolean
}

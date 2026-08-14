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

// Per-view override layer for the global status/priority/tag colors (see
// PriorityOption/StatusOption/TagOption.color in work-item.ts). Shared by
// every widget whose panel has a color-settings button — the view's own
// mapping wins over the global color when both are set for the same name.
export interface ColorConfig {
  statusColors?: Record<string, TagColorKey>
  priorityColors?: Partial<Record<Priority, TagColorKey>>
  tagColors?: Record<string, TagColorKey>
}

// Shared by every widget with a status/priority/tag + text filter row —
// currently List and Board. 'all' is the sentinel for "no filter" on the
// three select-driven fields (matching the option value each panel's
// dropdown uses), not an empty string.
export interface FilterConfig {
  statusFilter?: string
  priorityFilter?: string
  tagFilter?: string
  search?: string
}

export interface ListViewConfig extends ColorConfig, FilterConfig {
  statusFilter: string
  priorityFilter: string
  tagFilter: string
  search: string
  sortKey: string
  sortDir: 'asc' | 'desc'
}

export type BoardGroupBy = 'status' | 'priority' | 'tag'

export interface BoardViewConfig extends ColorConfig, FilterConfig {
  groupBy: BoardGroupBy
}

export type CalendarViewConfig = ColorConfig & FilterConfig

// The dashboard breakdown widgets (BreakdownStatus/Priority/Tag) — color
// only, no filters: each is a small aggregate-over-all-items chart, not a
// list of items to narrow down.
export type BreakdownViewConfig = ColorConfig

export type ViewConfig =
  | Partial<ListViewConfig>
  | Partial<BoardViewConfig>
  | Partial<CalendarViewConfig>
  | Partial<BreakdownViewConfig>
  | Record<string, never>

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

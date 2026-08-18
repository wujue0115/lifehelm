import type { Priority } from './work-item.js'
import type { TagColorKey } from '../config/tagColors.js'
import type { DateFilterPreset } from '../utils/dateFilterPresets.js'

export type ViewTemplateType = 'list' | 'board' | 'calendar' | 'dashboard'

export interface WidgetLayoutEntry {
  instanceId: string
  widgetId: string
  colSpan: number
  rowSpan: number
  colStart?: number
  rowStart?: number
  config?: ViewConfig
  /** Per-instance override for the widget's own title-key label (WidgetChrome's header) — lets two List panels in the same view read as e.g. "Backlog" / "In Review" instead of both just "List". Unset falls back to the widget definition's titleKey. */
  title?: string
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
// List, Board, and Calendar. `statusFilter`/`priorityFilter`/`tagFilter`
// are the specifically-included values for each field (MultiSelectMenu's
// `modelValue`) — an empty array is "no restriction," not an empty string
// or a sentinel value. dateFilterCustomStart/End only matter when
// dateFilterPreset is 'custom' (see DateFilter.vue/dateFilterPresets.ts) —
// they stay populated even after switching to a different preset, so
// re-selecting "custom" restores the last-picked range instead of an empty
// one.
export interface FilterConfig {
  statusFilter?: string[]
  priorityFilter?: string[]
  tagFilter?: string[]
  search?: string
  dateFilterPreset?: DateFilterPreset
  dateFilterCustomStart?: string
  dateFilterCustomEnd?: string
}

export interface ListViewConfig extends ColorConfig, FilterConfig {
  statusFilter: string[]
  priorityFilter: string[]
  tagFilter: string[]
  search: string
  dateFilterPreset: DateFilterPreset
  dateFilterCustomStart: string
  dateFilterCustomEnd: string
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
  statusFilter: [],
  priorityFilter: [],
  tagFilter: [],
  search: '',
  dateFilterPreset: 'all',
  dateFilterCustomStart: '',
  dateFilterCustomEnd: '',
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

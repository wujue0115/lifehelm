import type { Component } from 'vue'
import type { WidgetLayoutEntry } from '@/types/saved-view'
import StatTotal from './StatTotal.vue'
import StatCompletion from './StatCompletion.vue'
import StatOverdue from './StatOverdue.vue'
import StatDueToday from './StatDueToday.vue'
import StatTrackedTime from './StatTrackedTime.vue'
import BreakdownStatus from './BreakdownStatus.vue'
import BreakdownPriority from './BreakdownPriority.vue'
import BreakdownTag from './BreakdownTag.vue'
import ListPanel from './ListPanel.vue'
import BoardPanel from './BoardPanel.vue'
import CalendarPanel from './CalendarPanel.vue'

export interface WidgetDefinition {
  id: string
  component: Component
  titleKey: string
  defaultColSpan: number
  defaultRowSpan: number
  minColSpan: number
  minRowSpan: number
}

export const WIDGET_REGISTRY: WidgetDefinition[] = [
  {
    id: 'stat-total',
    component: StatTotal,
    titleKey: 'dashboard.total',
    defaultColSpan: 3,
    defaultRowSpan: 4,
    minColSpan: 2,
    minRowSpan: 2,
  },
  {
    id: 'stat-completion',
    component: StatCompletion,
    titleKey: 'dashboard.completionRate',
    defaultColSpan: 3,
    defaultRowSpan: 4,
    minColSpan: 2,
    minRowSpan: 2,
  },
  {
    id: 'stat-overdue',
    component: StatOverdue,
    titleKey: 'dashboard.overdue',
    defaultColSpan: 3,
    defaultRowSpan: 4,
    minColSpan: 2,
    minRowSpan: 2,
  },
  {
    id: 'stat-due-today',
    component: StatDueToday,
    titleKey: 'dashboard.dueToday',
    defaultColSpan: 3,
    defaultRowSpan: 4,
    minColSpan: 2,
    minRowSpan: 2,
  },
  {
    id: 'stat-tracked-time',
    component: StatTrackedTime,
    titleKey: 'dashboard.trackedTime',
    defaultColSpan: 3,
    defaultRowSpan: 4,
    minColSpan: 2,
    minRowSpan: 2,
  },
  {
    id: 'breakdown-status',
    component: BreakdownStatus,
    titleKey: 'dashboard.statusBreakdown',
    defaultColSpan: 6,
    defaultRowSpan: 8,
    minColSpan: 3,
    minRowSpan: 4,
  },
  {
    id: 'breakdown-priority',
    component: BreakdownPriority,
    titleKey: 'dashboard.priorityBreakdown',
    defaultColSpan: 6,
    defaultRowSpan: 8,
    minColSpan: 3,
    minRowSpan: 4,
  },
  {
    id: 'breakdown-tag',
    component: BreakdownTag,
    titleKey: 'dashboard.tagBreakdown',
    defaultColSpan: 12,
    defaultRowSpan: 8,
    minColSpan: 3,
    minRowSpan: 4,
  },
  {
    id: 'list',
    component: ListPanel,
    titleKey: 'nav.list',
    defaultColSpan: 12,
    defaultRowSpan: 16,
    minColSpan: 6,
    minRowSpan: 6,
  },
  {
    id: 'board',
    component: BoardPanel,
    titleKey: 'nav.board',
    defaultColSpan: 12,
    defaultRowSpan: 16,
    minColSpan: 6,
    minRowSpan: 6,
  },
  {
    id: 'calendar',
    component: CalendarPanel,
    titleKey: 'nav.calendar',
    defaultColSpan: 12,
    defaultRowSpan: 16,
    minColSpan: 6,
    minRowSpan: 6,
  },
]

export function getWidgetDefinition(id: string): WidgetDefinition {
  const found = WIDGET_REGISTRY.find((w) => w.id === id)
  if (!found) throw new Error(`Unknown widget id: ${id}`)
  return found
}

export function defaultLayoutEntry(widgetId: string): WidgetLayoutEntry {
  const def = getWidgetDefinition(widgetId)
  return {
    instanceId: crypto.randomUUID(),
    widgetId,
    colSpan: def.defaultColSpan,
    rowSpan: def.defaultRowSpan,
  }
}

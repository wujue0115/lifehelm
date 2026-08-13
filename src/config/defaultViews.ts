import { DEFAULT_LIST_CONFIG, type View } from '../types/view.js'

const SEED_TIMESTAMP = '2024-01-01T00:00:00.000Z'

export const DEFAULT_VIEWS: View[] = [
  {
    id: 'default-list',
    name: 'List',
    templateType: 'list',
    pinned: true,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
    layout: [
      {
        instanceId: 'seed-list-panel',
        widgetId: 'list',
        colSpan: 12,
        rowSpan: 16,
        config: DEFAULT_LIST_CONFIG,
      },
    ],
  },
  {
    id: 'default-board',
    name: 'Board',
    templateType: 'board',
    pinned: true,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
    layout: [{ instanceId: 'seed-board-panel', widgetId: 'board', colSpan: 12, rowSpan: 16 }],
  },
  {
    id: 'default-calendar',
    name: 'Calendar',
    templateType: 'calendar',
    pinned: true,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
    layout: [{ instanceId: 'seed-calendar-panel', widgetId: 'calendar', colSpan: 12, rowSpan: 16 }],
  },
  {
    id: 'default-dashboard',
    name: 'Dashboard',
    templateType: 'dashboard',
    pinned: true,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
    layout: [
      { instanceId: 'seed-stat-total', widgetId: 'stat-total', colSpan: 3, rowSpan: 4 },
      { instanceId: 'seed-stat-completion', widgetId: 'stat-completion', colSpan: 3, rowSpan: 4 },
      { instanceId: 'seed-stat-overdue', widgetId: 'stat-overdue', colSpan: 3, rowSpan: 4 },
      { instanceId: 'seed-stat-due-today', widgetId: 'stat-due-today', colSpan: 3, rowSpan: 4 },
      {
        instanceId: 'seed-stat-tracked-time',
        widgetId: 'stat-tracked-time',
        colSpan: 3,
        rowSpan: 4,
      },
      {
        instanceId: 'seed-breakdown-status',
        widgetId: 'breakdown-status',
        colSpan: 6,
        rowSpan: 8,
      },
      {
        instanceId: 'seed-breakdown-priority',
        widgetId: 'breakdown-priority',
        colSpan: 6,
        rowSpan: 8,
      },
      { instanceId: 'seed-breakdown-tag', widgetId: 'breakdown-tag', colSpan: 12, rowSpan: 8 },
    ],
  },
]

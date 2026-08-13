import type { BoardColumn, Priority, WorkItem } from '@/types/work-item'
import { getDueStatus } from './dueDate'
import { getDoneColumnId } from './board'

export interface StatusCount {
  columnId: string
  name: string
  count: number
}

export interface TagCount {
  tag: string
  count: number
}

export interface DashboardStats {
  total: number
  completed: number
  completionRate: number
  overdueCount: number
  dueTodayCount: number
  dueSoonCount: number
  statusCounts: StatusCount[]
  tagCounts: TagCount[]
  priorityCounts: Record<Priority, number>
  totalTrackedSeconds: number
}

export function computeStats(items: WorkItem[], board: BoardColumn[]): DashboardStats {
  const sortedBoard = [...board].sort((a, b) => a.order - b.order)
  const doneColumnId = getDoneColumnId(board)

  const total = items.length
  const completed = items.filter((item) => item.statusId === doneColumnId).length
  const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100)

  let overdueCount = 0
  let dueTodayCount = 0
  let dueSoonCount = 0
  const priorityCounts: Record<Priority, number> = { low: 0, medium: 0, high: 0, urgent: 0 }
  const tagMap = new Map<string, number>()
  let totalTrackedSeconds = 0

  for (const item of items) {
    priorityCounts[item.priority] += 1
    for (const tag of item.tags) tagMap.set(tag, (tagMap.get(tag) ?? 0) + 1)
    for (const entry of item.timeEntries) totalTrackedSeconds += entry.durationSeconds ?? 0

    const isCompleted = item.statusId === doneColumnId
    const status = getDueStatus(item.dueDate, isCompleted)
    if (status === 'overdue') overdueCount += 1
    else if (status === 'due-today') dueTodayCount += 1
    else if (status === 'due-soon') dueSoonCount += 1
  }

  const statusCounts: StatusCount[] = sortedBoard.map((column) => ({
    columnId: column.id,
    name: column.name,
    count: items.filter((item) => item.statusId === column.id).length,
  }))

  const tagCounts: TagCount[] = Array.from(tagMap.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)

  return {
    total,
    completed,
    completionRate,
    overdueCount,
    dueTodayCount,
    dueSoonCount,
    statusCounts,
    tagCounts,
    priorityCounts,
    totalTrackedSeconds,
  }
}

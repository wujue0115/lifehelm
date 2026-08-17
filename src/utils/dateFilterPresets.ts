// Resolves a DateFilter preset into a concrete ['YYYY-MM-DD', 'YYYY-MM-DD']
// range, relative to "today". Kept separate from DateFilter.vue so the date
// math is independently testable and shared by every panel (List/Board/
// Calendar) that filters work items by date.
import { dateKey } from './calendarGrid'

export type DateFilterPreset =
  | 'all'
  | 'today'
  | 'thisWeek'
  | 'thisFortnight'
  | 'thisMonth'
  | 'thisYear'
  | 'lastWeek'
  | 'lastTwoWeeks'
  | 'lastMonth'
  | 'lastYear'
  | 'custom'

export interface DateRange {
  start: string
  end: string
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

// Sunday-start week, matching CalendarPanel/DatePicker's weekday grid
// (both format weekday labels starting from a Sunday reference date).
function startOfWeek(date: Date): Date {
  return addDays(date, -date.getDay())
}

// `thisFortnight` needs a fixed reference point so its 14-day blocks stay
// stable across year boundaries — anchoring to Jan 1 instead would silently
// shrink the block containing New Year's Day. 1970-01-04 is a Sunday, so it
// lines up with `startOfWeek` above.
const FORTNIGHT_EPOCH = new Date(1970, 0, 4)
const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000

function startOfFortnight(date: Date): Date {
  const weekStart = startOfWeek(date)
  const weeksSinceEpoch = Math.round(
    (weekStart.getTime() - FORTNIGHT_EPOCH.getTime()) / MS_PER_WEEK,
  )
  const fortnightIndex = Math.floor(weeksSinceEpoch / 2)
  return addDays(FORTNIGHT_EPOCH, fortnightIndex * 14)
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}
function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}
function startOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 0, 1)
}
function endOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 11, 31)
}

function range(start: Date, end: Date): DateRange {
  return { start: dateKey(start), end: dateKey(end) }
}

// Preset groups as they appear in DateFilter.vue's popover: "current period
// containing today" (today/thisWeek/thisFortnight/thisMonth/thisYear) vs.
// "the period immediately before the current one"
// (lastWeek/lastTwoWeeks/lastMonth/lastYear) — the former reuses today, the
// latter is entirely in the past and never includes today.
export function resolveDateFilterRange(
  preset: DateFilterPreset,
  custom: { start: string; end: string },
  today: Date = new Date(),
): DateRange | null {
  switch (preset) {
    case 'all':
      return null
    case 'today':
      return range(today, today)
    case 'thisWeek': {
      const start = startOfWeek(today)
      return range(start, addDays(start, 6))
    }
    case 'thisFortnight': {
      const start = startOfFortnight(today)
      return range(start, addDays(start, 13))
    }
    case 'thisMonth':
      return range(startOfMonth(today), endOfMonth(today))
    case 'thisYear':
      return range(startOfYear(today), endOfYear(today))
    case 'lastWeek': {
      const start = addDays(startOfWeek(today), -7)
      return range(start, addDays(start, 6))
    }
    case 'lastTwoWeeks': {
      const start = addDays(startOfWeek(today), -14)
      return range(start, addDays(start, 13))
    }
    case 'lastMonth': {
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      return range(startOfMonth(lastMonth), endOfMonth(lastMonth))
    }
    case 'lastYear': {
      const lastYear = new Date(today.getFullYear() - 1, 0, 1)
      return range(startOfYear(lastYear), endOfYear(lastYear))
    }
    case 'custom':
      if (!custom.start && !custom.end) return null
      return { start: custom.start || custom.end, end: custom.end || custom.start }
  }
}

// A work item matches a resolved date range if its own date span (start–due,
// falling back to whichever of the two is set when only one is) overlaps the
// filter range at all — not just an exact match — so e.g. a multi-day item
// that merely starts before "this week" but is still due during it still
// shows up. Items with neither date set never match an active date filter.
// itemStart/itemDue are full ISO datetime strings (WorkItem.startDate/
// dueDate) — sliced to a 'YYYY-MM-DD' key first, same as CalendarPanel does
// when bucketing items onto day cells.
export function itemMatchesDateRange(
  itemStart: string | null,
  itemDue: string | null,
  filterRange: DateRange,
): boolean {
  if (!itemStart && !itemDue) return false
  const effectiveStart = (itemStart ?? itemDue)!.slice(0, 10)
  const effectiveEnd = (itemDue ?? itemStart)!.slice(0, 10)
  return effectiveStart <= filterRange.end && effectiveEnd >= filterRange.start
}

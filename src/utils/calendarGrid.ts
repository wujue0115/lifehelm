// Shared month-grid math for anything rendering a calendar (CalendarPanel's
// month view, DatePicker's popover). A "week" is always exactly 7 cells,
// padded with the trailing days of the previous/next month so every row is
// full — never a ragged first/last week.

export interface CalendarCell {
  date: Date
  key: string
  inMonth: boolean
  isToday: boolean
}

export function dateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function buildMonthWeeks(monthStart: Date): CalendarCell[][] {
  const year = monthStart.getFullYear()
  const month = monthStart.getMonth()
  const firstWeekday = monthStart.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayKey = dateKey(new Date())

  const toCell = (date: Date, inMonth: boolean): CalendarCell => ({
    date,
    key: dateKey(date),
    inMonth,
    isToday: dateKey(date) === todayKey,
  })

  const cells: CalendarCell[] = []
  for (let i = firstWeekday; i > 0; i--) {
    cells.push(toCell(new Date(year, month, 1 - i), false))
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(toCell(new Date(year, month, day), true))
  }
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1]
    if (!last) break
    const next = new Date(last.date.getFullYear(), last.date.getMonth(), last.date.getDate() + 1)
    cells.push(toCell(next, false))
  }

  const weeks: CalendarCell[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

export type DueStatus = 'overdue' | 'due-today' | 'due-soon' | 'none'

const DUE_SOON_WINDOW_DAYS = 3

function dateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getDueStatus(
  dueDate: string | null,
  isCompleted: boolean,
  now: Date = new Date(),
): DueStatus {
  if (!dueDate || isCompleted) return 'none'

  const dueKey = dueDate.slice(0, 10)
  const nowKey = dateKey(now)

  if (dueKey < nowKey) return 'overdue'
  if (dueKey === nowKey) return 'due-today'

  const dueDateObj = new Date(`${dueKey}T00:00:00`)
  const nowDateObj = new Date(`${nowKey}T00:00:00`)
  const diffDays = Math.round((dueDateObj.getTime() - nowDateObj.getTime()) / 86_400_000)

  return diffDays <= DUE_SOON_WINDOW_DAYS ? 'due-soon' : 'none'
}

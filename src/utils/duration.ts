export type Translate = (key: string, params?: Record<string, unknown>) => string

export function formatDuration(totalSeconds: number, t: Translate): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = Math.floor(totalSeconds % 60)

  if (hours > 0) return t('timeTracker.hours', { h: hours, m: minutes })
  if (minutes > 0) return t('timeTracker.minutes', { m: minutes, s: seconds })
  return t('timeTracker.seconds', { s: seconds })
}

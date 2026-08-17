const REGEX_FORMAT = /\[([^\]]+)\]|Y{1,4}|M{1,4}|D{1,2}|H{1,2}|h{1,2}|m{1,2}|s{1,2}/g

export const DEFAULT_DATE_TIME_FORMAT = 'YYYY/MM/DD HH:mm:ss'

type DateInput = Date | string

function normalizeDate(date: DateInput): Date {
  if (date instanceof Date || typeof date === 'string') return new Date(date)
  throw new Error('Invalid date')
}

export function formatDateTime(
  date: DateInput,
  formatString = DEFAULT_DATE_TIME_FORMAT,
  timeZone?: string,
): string {
  const formatter = new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
    ...(timeZone && { timeZone }),
  })

  // https://github.com/nodejs/node/issues/52244
  // https://stackoverflow.com/questions/63136636/intl-datetimeformat-works-in-different-way-in-node-and-browser
  // Typed as a fixed-shape object (not Record<string, string>) so the
  // destructure below isn't `string | undefined` under
  // noUncheckedIndexedAccess — the six fields are always present since the
  // formatter above always requests all six.
  const parts: {
    year: string
    month: string
    day: string
    hour: string
    minute: string
    second: string
  } = { year: '', month: '', day: '', hour: '', minute: '', second: '' }
  for (const part of formatter.formatToParts(normalizeDate(date))) {
    if (part.type in parts) parts[part.type as keyof typeof parts] = part.value
  }
  const { year, month, day, hour, minute, second } = parts

  const matches: Record<string, () => string | number> = {
    YY: () => year.substring(2),
    YYYY: () => year,
    M: () => +month,
    MM: () => month,
    D: () => +day,
    DD: () => day,
    H: () => +hour,
    HH: () => hour,
    h: () => +hour % 12 || 12,
    hh: () => `${+hour % 12 || 12}`.padStart(2, '0'),
    m: () => +minute,
    mm: () => minute,
    s: () => +second,
    ss: () => second,
  }

  return formatString.replace(
    REGEX_FORMAT,
    (match, literal) => literal ?? String(matches[match] ? matches[match]() : match),
  )
}

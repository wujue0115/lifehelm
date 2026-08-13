export const TAG_COLOR_KEYS = [
  'red',
  'orange',
  'amber',
  'green',
  'teal',
  'blue',
  'purple',
  'pink',
] as const

export type TagColorKey = (typeof TAG_COLOR_KEYS)[number]

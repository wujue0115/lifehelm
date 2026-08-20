// The picker's full option set — includes the 4 template-type icons (so a
// user can explicitly pick "list" even for a Board-type view) plus generic
// glyphs unrelated to any template type. `ViewIcon.vue` renders each by id.
export const VIEW_ICON_IDS = [
  'list',
  'board',
  'calendar',
  'dashboard',
  'star',
  'flag',
  'folder',
  'tag',
  'bolt',
  'heart',
  'bookmark',
  'target',
  'clock',
  'inbox',
  'layers',
  'user',
  'lightbulb',
  'pin',
  'clipboard',
  'globe',
] as const

export type ViewIconId = (typeof VIEW_ICON_IDS)[number]

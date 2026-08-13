import type { BoardColumn } from '@/types/work-item'

// The completed column is whichever one has `isDone: true`. Boards saved
// before that field existed have it unset on every column — for those,
// fall back to "last by order" so existing boards keep behaving exactly as
// they did before, until someone explicitly (re-)marks a done column via
// the UI. This fallback is intentionally NOT persisted anywhere: once a
// column is explicitly marked, order can change freely (columns added or
// removed) without ever again silently moving which status counts as done.
export function getDoneColumnId(board: BoardColumn[]): string | undefined {
  const explicit = board.find((column) => column.isDone)
  if (explicit) return explicit.id
  const sorted = [...board].sort((a, b) => a.order - b.order)
  return sorted[sorted.length - 1]?.id
}

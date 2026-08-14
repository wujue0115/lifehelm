// Open-ended: 'low'/'medium'/'high' are the built-in, i18n-labeled defaults
// (see PriorityOption below), but the board lets users register arbitrary
// additional priority values, so this can't stay a closed union.
export type Priority = string

// All three registries below share this shape. WorkItem never references any
// of them by `id` — status/priority/tag are all matched by `name` (see
// WorkItem.status/priority/tags) — so `id` here is purely a stable key for
// storage/list-rendering (Vue :key), not a lookup handle. A practical
// consequence: renaming an entry's `name` orphans any WorkItem still holding
// the old name, since nothing re-links by `id`.
export interface PriorityOption {
  id: string
  name: string
  order: number
}

export interface StatusOption {
  id: string
  name: string
  order: number
  /** Marks this column as the "completed" state — explicit and independent of
   * `order`/position, so deleting and re-adding a column never silently
   * changes which status counts as done. At most one column should have this
   * set true at a time. */
  isDone?: boolean
}

export interface TagOption {
  id: string
  name: string
  order: number
}

export interface TimeEntry {
  id: string
  startedAt: string
  endedAt: string | null
  durationSeconds: number | null
  note: string
}

export interface Comment {
  id: string
  text: string
  createdAt: string
}

export interface AttachmentMeta {
  id: string
  filename: string
  mimeType: string
  size: number
  uploadedAt: string
}

export interface WorkItem {
  id: string
  title: string
  description: string
  status: string
  priority: Priority
  tags: string[]
  startDate: string | null
  dueDate: string | null
  createdAt: string
  updatedAt: string
  comments: Comment[]
  attachments: AttachmentMeta[]
  timeEntries: TimeEntry[]
}

export type Priority = 'low' | 'medium' | 'high' | 'urgent'

export interface BoardColumn {
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
  statusId: string
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

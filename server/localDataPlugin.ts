import { randomUUID } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import type {
  AttachmentMeta,
  Comment,
  PriorityOption,
  StatusOption,
  TagOption,
  TimeEntry,
  WorkItem,
} from '../src/types/work-item.js'
import type { ThemeConfig } from '../src/types/theme-config.js'
import type { View } from '../src/types/view.js'
import { DEFAULT_VIEWS } from '../src/config/defaultViews.js'
import {
  deleteAttachmentFile,
  readAttachmentFile,
  readConfigJsonFile,
  readConfigJsonFileOrSeed,
  readJsonFile,
  readJsonFileOrSeed,
  writeAttachmentFile,
  writeConfigJsonFile,
  writeJsonFile,
} from './dataStore.js'

const ITEMS_FILE = 'items.json'
const STATUS_FILE = 'status.json'
const TAGS_FILE = 'tags.json'
const PRIORITIES_FILE = 'priorities.json'
const VIEWS_FILE = 'views.json'
const THEME_CONFIG_FILE = 'appearance.json'

const DEFAULT_THEME_CONFIG: ThemeConfig = {
  accentColor: null,
  fontId: 'default',
  radiusScale: 1,
  spacingScale: 1,
}

// Same id format as tags (randomUUID, not a semantic string) — status/
// priority are matched by `name`, same as tags, so `id` here is just a
// stable key, not a reference handle. See the comment above StatusOption.
const DEFAULT_STATUSES: StatusOption[] = [
  { id: randomUUID(), name: '待處理', order: 0 },
  { id: randomUUID(), name: '進行中', order: 1 },
  { id: randomUUID(), name: '已完成', order: 2, isDone: true },
]

const DEFAULT_TAGS: TagOption[] = []

const DEFAULT_PRIORITIES: PriorityOption[] = [
  { id: randomUUID(), name: 'low', order: 0 },
  { id: randomUUID(), name: 'medium', order: 1 },
  { id: randomUUID(), name: 'high', order: 2 },
]

async function readBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  if (chunks.length === 0) return undefined
  return JSON.parse(Buffer.concat(chunks).toString('utf-8'))
}

function sendJson(res: ServerResponse, status: number, data: unknown): void {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(data))
}

function sendNoContent(res: ServerResponse): void {
  res.statusCode = 204
  res.end()
}

export function localDataPlugin(): Plugin {
  return {
    name: 'local-data-api',
    configureServer(server) {
      server.middlewares.use('/api', async (req, res) => {
        try {
          const url = new URL(req.url ?? '/', 'http://localhost')
          const segments = url.pathname.split('/').filter(Boolean)
          const method = req.method ?? 'GET'

          if (segments[0] === 'items' && segments.length === 1) {
            if (method === 'GET') {
              const items = await readJsonFile<WorkItem[]>(ITEMS_FILE, [])
              return sendJson(res, 200, items)
            }
            if (method === 'POST') {
              const body = (await readBody(req)) as Partial<WorkItem> | undefined
              const items = await readJsonFile<WorkItem[]>(ITEMS_FILE, [])
              const statuses = await readJsonFileOrSeed<StatusOption[]>(
                STATUS_FILE,
                DEFAULT_STATUSES,
              )
              const now = new Date().toISOString()
              const newItem: WorkItem = {
                id: randomUUID(),
                title: body?.title ?? '',
                description: body?.description ?? '',
                status: body?.status ?? statuses[0]?.name ?? '',
                priority: body?.priority ?? 'medium',
                tags: body?.tags ?? [],
                startDate: body?.startDate ?? null,
                dueDate: body?.dueDate ?? null,
                createdAt: now,
                updatedAt: now,
                comments: [],
                attachments: [],
                timeEntries: [],
              }
              items.push(newItem)
              await writeJsonFile(ITEMS_FILE, items)
              return sendJson(res, 201, newItem)
            }
          }

          if (segments[0] === 'items' && segments.length === 2) {
            const id = segments[1]
            const items = await readJsonFile<WorkItem[]>(ITEMS_FILE, [])
            const index = items.findIndex((item) => item.id === id)

            if (method === 'GET') {
              if (index === -1) return sendJson(res, 404, { error: 'not found' })
              return sendJson(res, 200, items[index])
            }
            if (method === 'PUT') {
              if (index === -1) return sendJson(res, 404, { error: 'not found' })
              const existing = items[index]
              if (!existing) return sendJson(res, 404, { error: 'not found' })
              const body = (await readBody(req)) as Partial<WorkItem> | undefined
              const updated: WorkItem = {
                ...existing,
                ...body,
                id: existing.id,
                createdAt: existing.createdAt,
                updatedAt: new Date().toISOString(),
              }
              items[index] = updated
              await writeJsonFile(ITEMS_FILE, items)
              return sendJson(res, 200, updated)
            }
            if (method === 'DELETE') {
              if (index === -1) return sendJson(res, 404, { error: 'not found' })
              const [removed] = items.splice(index, 1)
              await writeJsonFile(ITEMS_FILE, items)
              if (removed) {
                for (const attachment of removed.attachments) {
                  await deleteAttachmentFile(attachment.id)
                }
              }
              return sendNoContent(res)
            }
          }

          if (segments[0] === 'items' && segments.length === 3 && segments[2] === 'comments') {
            const id = segments[1]
            const items = await readJsonFile<WorkItem[]>(ITEMS_FILE, [])
            const index = items.findIndex((item) => item.id === id)
            if (index === -1) return sendJson(res, 404, { error: 'not found' })
            const existing = items[index]
            if (!existing) return sendJson(res, 404, { error: 'not found' })

            if (method === 'POST') {
              const body = (await readBody(req)) as { text?: string } | undefined
              const text = body?.text?.trim()
              if (!text) return sendJson(res, 400, { error: 'text is required' })
              const comment: Comment = {
                id: randomUUID(),
                text,
                createdAt: new Date().toISOString(),
              }
              const updated: WorkItem = {
                ...existing,
                comments: [...existing.comments, comment],
                updatedAt: new Date().toISOString(),
              }
              items[index] = updated
              await writeJsonFile(ITEMS_FILE, items)
              return sendJson(res, 201, updated)
            }
          }

          if (segments[0] === 'items' && segments.length === 4 && segments[2] === 'comments') {
            const id = segments[1]
            const commentId = segments[3]
            const items = await readJsonFile<WorkItem[]>(ITEMS_FILE, [])
            const index = items.findIndex((item) => item.id === id)
            if (index === -1) return sendJson(res, 404, { error: 'not found' })
            const existing = items[index]
            if (!existing) return sendJson(res, 404, { error: 'not found' })

            if (method === 'DELETE') {
              const updated: WorkItem = {
                ...existing,
                comments: existing.comments.filter((comment) => comment.id !== commentId),
                updatedAt: new Date().toISOString(),
              }
              items[index] = updated
              await writeJsonFile(ITEMS_FILE, items)
              return sendJson(res, 200, updated)
            }
          }

          if (segments[0] === 'items' && segments.length === 3 && segments[2] === 'attachments') {
            const id = segments[1]
            const items = await readJsonFile<WorkItem[]>(ITEMS_FILE, [])
            const index = items.findIndex((item) => item.id === id)
            if (index === -1) return sendJson(res, 404, { error: 'not found' })
            const existing = items[index]
            if (!existing) return sendJson(res, 404, { error: 'not found' })

            if (method === 'POST') {
              const body = (await readBody(req)) as
                | { filename?: string; mimeType?: string; dataBase64?: string }
                | undefined
              if (!body?.filename || !body.dataBase64) {
                return sendJson(res, 400, { error: 'filename and dataBase64 are required' })
              }
              const attachmentId = randomUUID()
              const meta: AttachmentMeta = {
                id: attachmentId,
                filename: body.filename,
                mimeType: body.mimeType ?? 'application/octet-stream',
                size: Buffer.byteLength(body.dataBase64, 'base64'),
                uploadedAt: new Date().toISOString(),
              }
              await writeAttachmentFile({ ...meta, dataBase64: body.dataBase64 })
              const updated: WorkItem = {
                ...existing,
                attachments: [...existing.attachments, meta],
                updatedAt: new Date().toISOString(),
              }
              items[index] = updated
              await writeJsonFile(ITEMS_FILE, items)
              return sendJson(res, 201, updated)
            }
          }

          if (segments[0] === 'items' && segments.length === 4 && segments[2] === 'attachments') {
            const id = segments[1]
            const attachmentId = segments[3]
            const items = await readJsonFile<WorkItem[]>(ITEMS_FILE, [])
            const index = items.findIndex((item) => item.id === id)
            if (index === -1) return sendJson(res, 404, { error: 'not found' })
            const existing = items[index]
            if (!existing) return sendJson(res, 404, { error: 'not found' })

            if (method === 'DELETE') {
              await deleteAttachmentFile(attachmentId)
              const updated: WorkItem = {
                ...existing,
                attachments: existing.attachments.filter(
                  (attachment) => attachment.id !== attachmentId,
                ),
                updatedAt: new Date().toISOString(),
              }
              items[index] = updated
              await writeJsonFile(ITEMS_FILE, items)
              return sendJson(res, 200, updated)
            }
          }

          if (segments[0] === 'attachments' && segments.length === 2 && method === 'GET') {
            const attachmentId = segments[1]
            const stored = await readAttachmentFile(attachmentId)
            if (!stored) return sendJson(res, 404, { error: 'not found' })
            const buffer = Buffer.from(stored.dataBase64, 'base64')
            const asciiFallback = stored.filename.replace(/[^\x20-\x7E]/g, '_')
            res.statusCode = 200
            res.setHeader('Content-Type', stored.mimeType)
            res.setHeader(
              'Content-Disposition',
              `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(stored.filename)}`,
            )
            res.setHeader('Content-Length', buffer.length)
            res.end(buffer)
            return
          }

          if (segments[0] === 'items' && segments.length === 3 && segments[2] === 'time-entries') {
            const id = segments[1]
            const items = await readJsonFile<WorkItem[]>(ITEMS_FILE, [])
            const index = items.findIndex((item) => item.id === id)
            if (index === -1) return sendJson(res, 404, { error: 'not found' })
            const existing = items[index]
            if (!existing) return sendJson(res, 404, { error: 'not found' })

            if (method === 'POST') {
              const body = (await readBody(req)) as Partial<TimeEntry> | undefined
              const startedAt = body?.startedAt ?? new Date().toISOString()
              const endedAt = body?.endedAt ?? null
              const durationSeconds = endedAt
                ? Math.max(
                    0,
                    Math.round(
                      (new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000,
                    ),
                  )
                : null
              const entry: TimeEntry = {
                id: randomUUID(),
                startedAt,
                endedAt,
                durationSeconds,
                note: body?.note ?? '',
              }
              const updated: WorkItem = {
                ...existing,
                timeEntries: [...existing.timeEntries, entry],
                updatedAt: new Date().toISOString(),
              }
              items[index] = updated
              await writeJsonFile(ITEMS_FILE, items)
              return sendJson(res, 201, updated)
            }
          }

          if (segments[0] === 'items' && segments.length === 4 && segments[2] === 'time-entries') {
            const id = segments[1]
            const entryId = segments[3]
            const items = await readJsonFile<WorkItem[]>(ITEMS_FILE, [])
            const index = items.findIndex((item) => item.id === id)
            if (index === -1) return sendJson(res, 404, { error: 'not found' })
            const existing = items[index]
            if (!existing) return sendJson(res, 404, { error: 'not found' })

            if (method === 'PUT') {
              const entryIndex = existing.timeEntries.findIndex((entry) => entry.id === entryId)
              if (entryIndex === -1) return sendJson(res, 404, { error: 'not found' })
              const entry = existing.timeEntries[entryIndex]
              if (!entry) return sendJson(res, 404, { error: 'not found' })

              const body = (await readBody(req)) as Partial<TimeEntry> | undefined
              const startedAt = body?.startedAt ?? entry.startedAt
              const endedAt =
                body?.endedAt !== undefined
                  ? body.endedAt
                  : (entry.endedAt ?? new Date().toISOString())
              const note = body?.note ?? entry.note
              const durationSeconds = endedAt
                ? Math.max(
                    0,
                    Math.round(
                      (new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000,
                    ),
                  )
                : null
              const updatedEntry: TimeEntry = {
                id: entry.id,
                startedAt,
                endedAt,
                durationSeconds,
                note,
              }
              const timeEntries = [...existing.timeEntries]
              timeEntries[entryIndex] = updatedEntry
              const updated: WorkItem = {
                ...existing,
                timeEntries,
                updatedAt: new Date().toISOString(),
              }
              items[index] = updated
              await writeJsonFile(ITEMS_FILE, items)
              return sendJson(res, 200, updated)
            }
            if (method === 'DELETE') {
              const updated: WorkItem = {
                ...existing,
                timeEntries: existing.timeEntries.filter((entry) => entry.id !== entryId),
                updatedAt: new Date().toISOString(),
              }
              items[index] = updated
              await writeJsonFile(ITEMS_FILE, items)
              return sendJson(res, 200, updated)
            }
          }

          if (segments[0] === 'status' && segments.length === 1) {
            if (method === 'GET') {
              const statuses = await readJsonFileOrSeed<StatusOption[]>(
                STATUS_FILE,
                DEFAULT_STATUSES,
              )
              return sendJson(res, 200, statuses)
            }
            if (method === 'PUT') {
              const body = (await readBody(req)) as StatusOption[] | undefined
              const statuses = body ?? []
              await writeJsonFile(STATUS_FILE, statuses)
              return sendJson(res, 200, statuses)
            }
          }

          if (segments[0] === 'tags' && segments.length === 1) {
            if (method === 'GET') {
              const tags = await readJsonFileOrSeed<TagOption[]>(TAGS_FILE, DEFAULT_TAGS)
              return sendJson(res, 200, tags)
            }
            if (method === 'PUT') {
              const body = (await readBody(req)) as TagOption[] | undefined
              const tags = body ?? []
              await writeJsonFile(TAGS_FILE, tags)
              return sendJson(res, 200, tags)
            }
          }

          if (segments[0] === 'priorities' && segments.length === 1) {
            if (method === 'GET') {
              const priorities = await readJsonFileOrSeed<PriorityOption[]>(
                PRIORITIES_FILE,
                DEFAULT_PRIORITIES,
              )
              return sendJson(res, 200, priorities)
            }
            if (method === 'PUT') {
              const body = (await readBody(req)) as PriorityOption[] | undefined
              const priorities = body ?? []
              await writeJsonFile(PRIORITIES_FILE, priorities)
              return sendJson(res, 200, priorities)
            }
          }

          if (segments[0] === 'views' && segments.length === 1) {
            if (method === 'GET') {
              const views = await readConfigJsonFileOrSeed<View[]>(VIEWS_FILE, DEFAULT_VIEWS)
              return sendJson(res, 200, views)
            }
            if (method === 'POST') {
              const body = (await readBody(req)) as Partial<View> | undefined
              const views = await readConfigJsonFileOrSeed<View[]>(VIEWS_FILE, DEFAULT_VIEWS)
              const now = new Date().toISOString()
              const newView: View = {
                id: randomUUID(),
                name: body?.name ?? '',
                templateType: body?.templateType ?? 'list',
                pinned: body?.pinned ?? false,
                createdAt: now,
                updatedAt: now,
                layout: body?.layout ?? [],
              }
              views.push(newView)
              await writeConfigJsonFile(VIEWS_FILE, views)
              return sendJson(res, 201, newView)
            }
          }

          if (segments[0] === 'views' && segments.length === 2) {
            const id = segments[1]
            const views = await readConfigJsonFileOrSeed<View[]>(VIEWS_FILE, DEFAULT_VIEWS)
            const index = views.findIndex((view) => view.id === id)

            if (method === 'GET') {
              if (index === -1) return sendJson(res, 404, { error: 'not found' })
              return sendJson(res, 200, views[index])
            }
            if (method === 'PUT') {
              if (index === -1) return sendJson(res, 404, { error: 'not found' })
              const existing = views[index]
              if (!existing) return sendJson(res, 404, { error: 'not found' })
              const body = (await readBody(req)) as Partial<View> | undefined
              const updated: View = {
                ...existing,
                ...body,
                id: existing.id,
                createdAt: existing.createdAt,
                updatedAt: new Date().toISOString(),
              }
              views[index] = updated
              await writeConfigJsonFile(VIEWS_FILE, views)
              return sendJson(res, 200, updated)
            }
            if (method === 'DELETE') {
              if (index === -1) return sendJson(res, 404, { error: 'not found' })
              views.splice(index, 1)
              await writeConfigJsonFile(VIEWS_FILE, views)
              return sendNoContent(res)
            }
          }

          if (segments[0] === 'theme-config' && segments.length === 1) {
            if (method === 'GET') {
              const config = await readConfigJsonFile<ThemeConfig>(
                THEME_CONFIG_FILE,
                DEFAULT_THEME_CONFIG,
              )
              return sendJson(res, 200, config)
            }
            if (method === 'PUT') {
              const body = (await readBody(req)) as Partial<ThemeConfig> | undefined
              const config: ThemeConfig = { ...DEFAULT_THEME_CONFIG, ...body }
              await writeConfigJsonFile(THEME_CONFIG_FILE, config)
              return sendJson(res, 200, config)
            }
          }

          return sendJson(res, 404, { error: 'not found' })
        } catch (error) {
          sendJson(res, 500, { error: (error as Error).message })
        }
      })
    },
  }
}

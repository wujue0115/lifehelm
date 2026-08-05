import { randomUUID } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import type { BoardColumn, WorkItem } from '../src/types/work-item.js'
import { readJsonFile, readJsonFileOrSeed, writeJsonFile } from './dataStore.js'

const ITEMS_FILE = 'items.json'
const BOARD_FILE = 'board.json'

const DEFAULT_BOARD: BoardColumn[] = [
  { id: 'todo', name: '待處理', order: 0 },
  { id: 'doing', name: '進行中', order: 1 },
  { id: 'done', name: '已完成', order: 2 },
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
              const board = await readJsonFileOrSeed<BoardColumn[]>(BOARD_FILE, DEFAULT_BOARD)
              const now = new Date().toISOString()
              const newItem: WorkItem = {
                id: randomUUID(),
                title: body?.title ?? '',
                description: body?.description ?? '',
                statusId: body?.statusId ?? board[0]?.id ?? 'todo',
                priority: body?.priority ?? 'medium',
                tags: body?.tags ?? [],
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
              items.splice(index, 1)
              await writeJsonFile(ITEMS_FILE, items)
              return sendNoContent(res)
            }
          }

          if (segments[0] === 'board' && segments.length === 1) {
            if (method === 'GET') {
              const board = await readJsonFileOrSeed<BoardColumn[]>(BOARD_FILE, DEFAULT_BOARD)
              return sendJson(res, 200, board)
            }
            if (method === 'PUT') {
              const body = (await readBody(req)) as BoardColumn[] | undefined
              const board = body ?? []
              await writeJsonFile(BOARD_FILE, board)
              return sendJson(res, 200, board)
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

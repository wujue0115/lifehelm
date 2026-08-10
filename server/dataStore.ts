import { existsSync } from 'node:fs'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'

const DATA_DIR = path.resolve(process.cwd(), '.data')
const ATTACHMENTS_DIR = path.join(DATA_DIR, 'attachments')
const ROOT_DIR = process.cwd()

async function ensureDataDir(): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true })
}

async function ensureAttachmentsDir(): Promise<void> {
  await mkdir(ATTACHMENTS_DIR, { recursive: true })
}

export async function readJsonFile<T>(filename: string, fallback: T): Promise<T> {
  await ensureDataDir()
  const filePath = path.join(DATA_DIR, filename)
  if (!existsSync(filePath)) return fallback
  const raw = await readFile(filePath, 'utf-8')
  return JSON.parse(raw) as T
}

export async function writeJsonFile<T>(filename: string, data: T): Promise<void> {
  await ensureDataDir()
  const filePath = path.join(DATA_DIR, filename)
  await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

export async function readJsonFileOrSeed<T>(filename: string, seed: T): Promise<T> {
  await ensureDataDir()
  const filePath = path.join(DATA_DIR, filename)
  if (!existsSync(filePath)) {
    await writeJsonFile(filename, seed)
    return seed
  }
  const raw = await readFile(filePath, 'utf-8')
  return JSON.parse(raw) as T
}

export async function readRootJsonFile<T>(filename: string, fallback: T): Promise<T> {
  const filePath = path.join(ROOT_DIR, filename)
  if (!existsSync(filePath)) return fallback
  const raw = await readFile(filePath, 'utf-8')
  return JSON.parse(raw) as T
}

export async function writeRootJsonFile<T>(filename: string, data: T): Promise<void> {
  const filePath = path.join(ROOT_DIR, filename)
  await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

export interface StoredAttachment {
  id: string
  filename: string
  mimeType: string
  size: number
  uploadedAt: string
  dataBase64: string
}

export async function readAttachmentFile(id: string): Promise<StoredAttachment | null> {
  await ensureAttachmentsDir()
  const filePath = path.join(ATTACHMENTS_DIR, `${id}.json`)
  if (!existsSync(filePath)) return null
  const raw = await readFile(filePath, 'utf-8')
  return JSON.parse(raw) as StoredAttachment
}

export async function writeAttachmentFile(attachment: StoredAttachment): Promise<void> {
  await ensureAttachmentsDir()
  const filePath = path.join(ATTACHMENTS_DIR, `${attachment.id}.json`)
  await writeFile(filePath, JSON.stringify(attachment), 'utf-8')
}

export async function deleteAttachmentFile(id: string): Promise<void> {
  const filePath = path.join(ATTACHMENTS_DIR, `${id}.json`)
  if (existsSync(filePath)) await rm(filePath)
}

import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const DATA_DIR = path.resolve(process.cwd(), '.data')

async function ensureDataDir(): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true })
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

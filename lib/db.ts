import { createClient, type Client } from '@libsql/client/http'

let client: Client
let initPromise: Promise<void> | null = null

async function retry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn()
    } catch (err) {
      if (i === maxRetries) throw err
      // Turso 冷启动：等 1.5s 后重试
      await new Promise(r => setTimeout(r, 1500))
    }
  }
  throw new Error('unreachable')
}

export function getDb(): Client {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL
    const authToken = process.env.TURSO_AUTH_TOKEN

    if (!url || !authToken) {
      throw new Error('Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN env vars')
    }

    client = createClient({ url, authToken })
    // 预热连接（带重试），阻塞首次请求直到就绪
    initPromise = retry(async () => {
      await client.execute('SELECT 1')
      await initSchema(client)
    })
  }
  return client
}

/** 等待数据库就绪（冷启动预热） */
export async function ensureDb(): Promise<void> {
  getDb() // 触发初始化
  if (initPromise) await initPromise
}

/** Convert array-based Turso rows to objects keyed by column name */
export function rowsToObjects<T>(columns: string[], rows: unknown[][]): T[] {
  return rows.map(row => {
    const obj: Record<string, unknown> = {}
    columns.forEach((col, i) => { obj[col] = row[i] })
    return obj as T
  })
}

async function initSchema(db: Client): Promise<void> {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS fabrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      width REAL,
      unit TEXT NOT NULL,
      price REAL,
      store TEXT,
      purchase_date TEXT,
      photo_path TEXT,
      photos TEXT DEFAULT '[]',
      status TEXT DEFAULT 'idle',
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)
}

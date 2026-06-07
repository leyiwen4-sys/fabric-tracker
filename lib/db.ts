const TURSO_URL = process.env.TURSO_DATABASE_URL || ''
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN || ''

type TursoRow = Array<unknown>

interface TursoResult {
  columns: string[]
  rows: TursoRow[]
  rowsAffected: number
  lastInsertRowid: string | null
}

function getUrl(): string {
  if (!TURSO_URL) throw new Error('Missing TURSO_DATABASE_URL env var')
  // libsql:// → https://
  const url = TURSO_URL.replace('libsql://', 'https://')
  return url + '/v2/pipeline'
}

/** 将 JS 原始值转为 Turso pipeline 要求的带类型参数 */
function typedArg(v: unknown): Record<string, unknown> {
  if (v === null || v === undefined) return { type: 'null' }
  if (typeof v === 'number') {
    return Number.isInteger(v) ? { type: 'integer', value: String(v) } : { type: 'real', value: String(v) }
  }
  return { type: 'text', value: String(v) }
}

export async function execute(sql: string, args?: unknown[]): Promise<TursoResult> {
  if (!TURSO_TOKEN) throw new Error('Missing TURSO_AUTH_TOKEN env var')

  const typedArgs = (args || []).map(typedArg)

  const body = JSON.stringify({
    requests: [
      { type: 'execute', stmt: { sql, args: typedArgs } },
    ],
  })

  const res = await fetch(getUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TURSO_TOKEN}`,
    },
    body,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Turso HTTP ${res.status}: ${text.slice(0, 200)}`)
  }

  const json = await res.json() as any
  const result = json.results?.[0]?.response?.result

  if (!result) {
    throw new Error('Unexpected Turso response: ' + JSON.stringify(json).slice(0, 200))
  }

  return {
    columns: result.cols?.map((c: any) => c.name) || [],
    rows: result.rows || [],
    rowsAffected: result.rows_affected || 0,
    lastInsertRowid: result.last_insert_rowid || null,
  }
}

let schemaReady = false

export async function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    await initSchema()
    schemaReady = true
  }
}

async function initSchema(): Promise<void> {
  await execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)
  await execute(`
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

/** Convert Turso rows to typed objects keyed by column name */
export function rowsToObjects<T>(columns: string[], rows: TursoRow[]): T[] {
  return rows.map(row => {
    const obj: Record<string, unknown> = {}
    columns.forEach((col, i) => { obj[col] = row[i] })
    return obj as T
  })
}

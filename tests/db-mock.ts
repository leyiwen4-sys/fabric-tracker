// 共享测试工具 — 用内存存储模拟数据库
import { vi } from 'vitest'

type Row = Record<string, unknown>

// 内存模拟数据库
const users: Row[] = []
const fabrics: Row[] = []
let nextUserId = 1
let nextFabricId = 1

export function resetTestDb() {
  users.length = 0
  fabrics.length = 0
  nextUserId = 1
  nextFabricId = 1
}

/** 解析 SQL 字符串中的 ? 占位符，用于简单匹配 */
function sqlPattern(sql: string): string {
  return sql.replace(/\s+/g, ' ').trim()
}

function rowsToObjects(columns: string[], rows: unknown[][]): Row[] {
  return rows.map(row => {
    const obj: Row = {}
    columns.forEach((col, i) => { obj[col] = row[i] })
    return obj
  })
}

/** Mock execute 工厂 — 返回一个绑定到当前内存库的 execute 实现 */
export function createMockExecute() {
  return vi.fn(async (sql: string, args?: unknown[]): Promise<{
    columns: string[]
    rows: unknown[][]
    rowsAffected: number
    lastInsertRowid: string | null
  }> => {
    const s = sqlPattern(sql)
    const a = args || []

    // CREATE TABLE — 无操作
    if (s.includes('CREATE TABLE IF NOT EXISTS')) {
      return { columns: [], rows: [], rowsAffected: 0, lastInsertRowid: null }
    }

    // INSERT INTO users
    if (s.includes('INSERT INTO users')) {
      const id = nextUserId++
      // a: [email, password_hash] (2 params) or [email, password_hash, ...] (more params)
      users.push({ id, email: a[0], password_hash: a[1], created_at: new Date().toISOString() })
      return { columns: [], rows: [], rowsAffected: 1, lastInsertRowid: String(id) }
    }

    // SELECT ... FROM users WHERE email = ?
    if (s.includes('FROM users WHERE email = ?')) {
      const user = users.find(u => u.email === a[0])
      if (!user) return { columns: ['id'], rows: [], rowsAffected: 0, lastInsertRowid: null }
      if (s.includes('SELECT id, email, password_hash')) {
        return {
          columns: ['id', 'email', 'password_hash'],
          rows: [[user.id, user.email, user.password_hash]],
          rowsAffected: 0, lastInsertRowid: null,
        }
      }
      return { columns: ['id'], rows: [[user.id]], rowsAffected: 0, lastInsertRowid: null }
    }

    // SELECT id FROM users WHERE id = ?
    if (s.includes('SELECT id FROM users WHERE id = ?')) {
      const user = users.find(u => u.id === a[0])
      return user
        ? { columns: ['id'], rows: [[user.id]], rowsAffected: 0, lastInsertRowid: null }
        : { columns: ['id'], rows: [], rowsAffected: 0, lastInsertRowid: null }
    }

    // SELECT * FROM fabrics WHERE id = ? AND user_id = ?
    if (s.includes('SELECT * FROM fabrics WHERE id = ? AND user_id = ?')) {
      const fabric = fabrics.find(f => f.id === a[0] && f.user_id === a[1])
      return fabric
        ? { columns: fabricCols, rows: [fabricCols.map(c => fabric[c])], rowsAffected: 0, lastInsertRowid: null }
        : { columns: fabricCols, rows: [], rowsAffected: 0, lastInsertRowid: null }
    }

    // SELECT * FROM fabrics WHERE user_id = ? ... (with optional filters and ORDER BY)
    if (s.includes('SELECT * FROM fabrics WHERE user_id = ?')) {
      let result = fabrics.filter(f => f.user_id === a[0])

      // 按 ? 占位符位置提取筛选参数：a[0]=user_id, a[1]=type?, a[1|2]=status?, a[last-2..last]=search?
      let paramIdx = 1 // 跳过 a[0]=user_id

      // type filter
      if (s.includes('AND type = ?')) {
        const typeArg = a[paramIdx++]
        if (typeArg !== undefined && typeArg !== null) {
          result = result.filter(f => f.type === typeArg)
        }
      }

      // status filter
      if (s.includes('AND status = ?')) {
        const statusArg = a[paramIdx++]
        if (statusArg !== undefined && statusArg !== null) {
          result = result.filter(f => f.status === statusArg)
        }
      }

      // search filter (3 LIKE params)
      if (s.includes('AND (name LIKE ? OR store LIKE ? OR notes LIKE ?)')) {
        // search args 是最后 3 个参数
        const searchTerm = a[a.length - 3]
        if (searchTerm) {
          const term = String(searchTerm).replace(/%/g, '')
          result = result.filter(f =>
            String(f.name || '').includes(term) ||
            String(f.store || '').includes(term) ||
            String(f.notes || '').includes(term)
          )
        }
      }

      // ORDER BY
      if (s.includes('ORDER BY')) {
        const orderClause = s.split('ORDER BY')[1].trim()
        result = sortFabrics(result, orderClause)
      } else {
        // default
        result = [...result].sort((a, b) => {
          const d = String(b.created_at).localeCompare(String(a.created_at))
          return d !== 0 ? d : (Number(b.id) - Number(a.id))
        })
      }

      return {
        columns: fabricCols,
        rows: result.map(f => fabricCols.map(c => f[c])),
        rowsAffected: 0,
        lastInsertRowid: null,
      }
    }

    // INSERT INTO fabrics
    if (s.includes('INSERT INTO fabrics')) {
      const id = nextFabricId++
      const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
      const fabric: Row = {
        id,
        user_id: a[0], name: a[1], type: a[2], width: a[3], unit: a[4],
        price: a[5], store: a[6], purchase_date: a[7], photo_path: a[8],
        photos: a[9], status: a[10], notes: a[11],
        created_at: now, updated_at: now,
      }
      fabrics.push(fabric)
      return { columns: [], rows: [], rowsAffected: 1, lastInsertRowid: String(id) }
    }

    // UPDATE fabrics
    if (s.includes('UPDATE fabrics SET')) {
      const id = a[12], userId = a[13]
      const idx = fabrics.findIndex(f => f.id === id && f.user_id === userId)
      if (idx === -1) {
        return { columns: [], rows: [], rowsAffected: 0, lastInsertRowid: null }
      }
      fabrics[idx] = {
        ...fabrics[idx],
        name: a[0], type: a[1], width: a[2], unit: a[3],
        price: a[4], store: a[5], purchase_date: a[6], photo_path: a[7],
        photos: a[8], status: a[9], notes: a[10], updated_at: a[11],
      }
      return { columns: [], rows: [], rowsAffected: 1, lastInsertRowid: null }
    }

    // DELETE FROM fabrics
    if (s.includes('DELETE FROM fabrics')) {
      const idx = fabrics.findIndex(f => f.id === a[0] && f.user_id === a[1])
      if (idx >= 0) { fabrics.splice(idx, 1); return { columns: [], rows: [], rowsAffected: 1, lastInsertRowid: null } }
      return { columns: [], rows: [], rowsAffected: 0, lastInsertRowid: null }
    }

    // SELECT COUNT(*)... stats queries
    if (s.includes('SELECT COUNT(*)') || s.includes('SELECT type,') || s.includes('SELECT status,')) {
      return handleStatsQuery(s, a)
    }

    // 未知 SQL — 空结果
    console.warn('[mock db] unhandled SQL:', sql.slice(0, 100))
    return { columns: [], rows: [], rowsAffected: 0, lastInsertRowid: null }
  })
}

const fabricCols = ['id', 'user_id', 'name', 'type', 'width', 'unit', 'price', 'store', 'purchase_date', 'photo_path', 'photos', 'status', 'notes', 'created_at', 'updated_at']

function sortFabrics(result: Row[], orderClause: string): Row[] {
  const sorted = [...result]
  const [col, dir] = orderClause.replace(/,/g, '').split(/\s+/)

  sorted.sort((a, b) => {
    const va = a[col], vb = b[col]
    if (va === null || va === undefined) return 1
    if (vb === null || vb === undefined) return -1
    if (typeof va === 'number' && typeof vb === 'number') {
      return dir === 'DESC' ? vb - va : va - vb
    }
    const cmp = String(va).localeCompare(String(vb))
    return dir === 'DESC' ? -cmp : cmp
  })

  // secondary sort by id
  if (!col || col === 'id') return sorted
  sorted.sort((a, b) => {
    const va = a[col], vb = b[col]
    if (va === vb || (va === null && vb === null)) {
      return dir === 'DESC' ? Number(b.id) - Number(a.id) : Number(a.id) - Number(b.id)
    }
    return 0 // keep primary sort
  })

  return sorted
}

function handleStatsQuery(s: string, _args: unknown[]) {
  // Total count
  if (s.includes("SELECT COUNT(*) as count") && s.includes('price')) {
    const userId = _args[0]
    const userFabrics = fabrics.filter(f => f.user_id === userId)
    const totalCount = userFabrics.length
    const totalSpend = userFabrics.reduce((sum, f) => sum + (Number(f.price) || 0), 0)
    return {
      columns: ['total_count', 'total_spend'],
      rows: [[totalCount, totalSpend]],
      rowsAffected: 0,
      lastInsertRowid: null,
    }
  }

  // By type
  if (s.includes('SELECT type, COUNT(*) as count')) {
    const userId = _args[0]
    const userFabrics = fabrics.filter(f => f.user_id === userId)
    const byType: Record<string, number> = {}
    userFabrics.forEach(f => { byType[String(f.type)] = (byType[String(f.type)] || 0) + 1 })
    return {
      columns: ['type', 'count'],
      rows: Object.entries(byType).map(([k, v]) => [k, v]),
      rowsAffected: 0,
      lastInsertRowid: null,
    }
  }

  // By status
  if (s.includes('SELECT status, COUNT(*) as count')) {
    const userId = _args[0]
    const userFabrics = fabrics.filter(f => f.user_id === userId)
    const byStatus: Record<string, number> = {}
    userFabrics.forEach(f => { byStatus[String(f.status)] = (byStatus[String(f.status)] || 0) + 1 })
    return {
      columns: ['status', 'count'],
      rows: Object.entries(byStatus).map(([k, v]) => [k, v]),
      rowsAffected: 0,
      lastInsertRowid: null,
    }
  }

  return { columns: [], rows: [], rowsAffected: 0, lastInsertRowid: null }
}

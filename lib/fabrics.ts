import { execute, ensureSchema, rowsToObjects } from './db'

export interface Fabric {
  id: number
  user_id: number
  name: string
  type: string
  width: number | null
  unit: string
  price: number | null
  store: string | null
  purchase_date: string | null
  photo_path: string | null
  photos: string
  status: string
  notes: string | null
  created_at: string
  updated_at: string
}

export type FabricInput = Omit<Fabric, 'id' | 'created_at' | 'updated_at'>

export async function getAllFabrics(
  userId: number,
  options?: { type?: string; search?: string; sort?: string }
): Promise<Fabric[]> {
  await ensureSchema()
  let sql = 'SELECT * FROM fabrics WHERE user_id = ?'
  const params: unknown[] = [userId]

  if (options?.type) {
    sql += ' AND type = ?'
    params.push(options.type)
  }
  if (options?.search) {
    const q = `%${options.search}%`
    sql += ' AND (name LIKE ? OR store LIKE ? OR notes LIKE ?)'
    params.push(q, q, q)
  }

  sql += ' ORDER BY created_at DESC, id DESC'
  const result = await execute(sql, params)
  return rowsToObjects<Fabric>(result.columns, result.rows)
}

export async function getFabricById(id: number, userId: number): Promise<Fabric | null> {
  await ensureSchema()
  const result = await execute(
    'SELECT * FROM fabrics WHERE id = ? AND user_id = ?',
    [id, userId]
  )
  const rows = rowsToObjects<Fabric>(result.columns, result.rows)
  return rows[0] || null
}

export async function createFabric(data: FabricInput): Promise<Fabric> {
  await ensureSchema()
  const defaults = {
    width: null,
    price: null,
    store: null,
    purchase_date: null,
    photo_path: null,
    photos: '[]',
    status: 'idle',
    notes: null,
  }
  const row = { ...defaults, ...data }
  const result = await execute(
    `INSERT INTO fabrics (user_id, name, type, width, unit, price, store, purchase_date, photo_path, photos, status, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [row.user_id, row.name, row.type, row.width, row.unit, row.price, row.store, row.purchase_date, row.photo_path, row.photos, row.status, row.notes]
  )
  const id = Number(result.lastInsertRowid)
  return (await getFabricById(id, data.user_id))!
}

export async function updateFabric(id: number, userId: number, data: Partial<FabricInput>): Promise<Fabric | null> {
  await ensureSchema()
  const existing = await getFabricById(id, userId)
  if (!existing) return null

  const merged = { ...existing, ...data, updated_at: new Date().toISOString() }

  await execute(
    `UPDATE fabrics SET
       name = ?, type = ?, width = ?, unit = ?,
       price = ?, store = ?, purchase_date = ?,
       photo_path = ?, photos = ?, status = ?,
       notes = ?, updated_at = ?
     WHERE id = ? AND user_id = ?`,
    [merged.name, merged.type, merged.width, merged.unit, merged.price, merged.store, merged.purchase_date, merged.photo_path, merged.photos, merged.status, merged.notes, merged.updated_at, id, userId]
  )

  return getFabricById(id, userId)
}

export async function deleteFabric(id: number, userId: number): Promise<boolean> {
  await ensureSchema()
  const result = await execute(
    'DELETE FROM fabrics WHERE id = ? AND user_id = ?',
    [id, userId]
  )
  return result.rowsAffected > 0
}

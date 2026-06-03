import { getDb } from './db'

export interface Fabric {
  id: number
  name: string
  type: string
  width: number | null
  unit: string
  price: number | null
  store: string | null
  purchase_date: string | null
  photo_path: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type FabricInput = Omit<Fabric, 'id' | 'created_at' | 'updated_at'>

export function getAllFabrics(type?: string, sort: string = 'created_at_desc'): Fabric[] {
  const db = getDb()
  let sql = 'SELECT * FROM fabrics'
  const params: any[] = []

  if (type) {
    sql += ' WHERE type = ?'
    params.push(type)
  }

  sql += ' ORDER BY created_at DESC, id DESC'
  return db.prepare(sql).all(...params) as Fabric[]
}

export function getFabricById(id: number): Fabric | null {
  const db = getDb()
  const result = db.prepare('SELECT * FROM fabrics WHERE id = ?').get(id)
  return (result as Fabric) || null
}

export function createFabric(data: FabricInput): Fabric {
  const db = getDb()
  const defaults = {
    width: null,
    price: null,
    store: null,
    purchase_date: null,
    photo_path: null,
    notes: null,
  }
  const row = { ...defaults, ...data }
  const stmt = db.prepare(`
    INSERT INTO fabrics (name, type, width, unit, price, store, purchase_date, photo_path, notes)
    VALUES (@name, @type, @width, @unit, @price, @store, @purchase_date, @photo_path, @notes)
  `)
  const result = stmt.run(row)
  return getFabricById(result.lastInsertRowid as number)!
}

export function updateFabric(id: number, data: Partial<FabricInput>): Fabric | null {
  const existing = getFabricById(id)
  if (!existing) return null

  const db = getDb()
  const merged = { ...existing, ...data, updated_at: new Date().toISOString() }

  db.prepare(`
    UPDATE fabrics SET
      name = @name, type = @type, width = @width, unit = @unit,
      price = @price, store = @store, purchase_date = @purchase_date,
      photo_path = @photo_path, notes = @notes, updated_at = @updated_at
    WHERE id = @id
  `).run(merged)

  return getFabricById(id)
}

export function deleteFabric(id: number): boolean {
  const db = getDb()
  const result = db.prepare('DELETE FROM fabrics WHERE id = ?').run(id)
  return result.changes > 0
}

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { getDb } from '@/lib/db'

describe('Database initialization', () => {
  afterAll(() => {
    const db = getDb()
    db.exec('DROP TABLE IF EXISTS fabrics')
  })

  it('should create fabrics table with correct schema', () => {
    const db = getDb()
    const columns = db.prepare("PRAGMA table_info('fabrics')").all() as any[]
    const columnNames = columns.map((c: any) => c.name)

    expect(columnNames).toContain('id')
    expect(columnNames).toContain('name')
    expect(columnNames).toContain('type')
    expect(columnNames).toContain('width')
    expect(columnNames).toContain('unit')
    expect(columnNames).toContain('price')
    expect(columnNames).toContain('store')
    expect(columnNames).toContain('purchase_date')
    expect(columnNames).toContain('photo_path')
    expect(columnNames).toContain('notes')
    expect(columnNames).toContain('created_at')
    expect(columnNames).toContain('updated_at')
  })

  it('should not error on repeated getDb() calls', () => {
    const db1 = getDb()
    const db2 = getDb()
    expect(db1).toBe(db2) // singleton
  })
})

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { getDb } from '@/lib/db'
import { createFabric, getFabricById, getAllFabrics, updateFabric, deleteFabric } from '@/lib/fabrics'

const TEST_USER_ID = 1

describe('Database initialization', () => {
  beforeAll(() => {
    const db = getDb()
    db.prepare('INSERT OR IGNORE INTO users (id, email, password_hash) VALUES (?, ?, ?)').run(
      TEST_USER_ID, 'test@example.com', 'hashed_password'
    )
  })

  afterAll(() => {
    const db = getDb()
    db.exec('DELETE FROM fabrics')
    db.exec('DELETE FROM users')
  })

  it('should create fabrics table with correct schema', () => {
    const db = getDb()
    const columns = db.prepare("PRAGMA table_info('fabrics')").all() as any[]
    const columnNames = columns.map((c: any) => c.name)

    expect(columnNames).toContain('id')
    expect(columnNames).toContain('user_id')
    expect(columnNames).toContain('name')
    expect(columnNames).toContain('type')
    expect(columnNames).toContain('width')
    expect(columnNames).toContain('unit')
    expect(columnNames).toContain('price')
    expect(columnNames).toContain('store')
    expect(columnNames).toContain('purchase_date')
    expect(columnNames).toContain('photo_path')
    expect(columnNames).toContain('photos')
    expect(columnNames).toContain('status')
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

describe('Fabrics CRUD', () => {
  beforeAll(() => {
    const db = getDb()
    db.prepare('INSERT OR IGNORE INTO users (id, email, password_hash) VALUES (?, ?, ?)').run(
      TEST_USER_ID, 'test@example.com', 'hashed_password'
    )
  })

  afterAll(() => {
    const db = getDb()
    db.exec('DELETE FROM fabrics')
    db.exec('DELETE FROM users')
  })

  const sampleFabric = {
    user_id: TEST_USER_ID,
    name: '碎花亚麻',
    type: '棉麻混纺',
    width: 145,
    unit: '米',
    price: 28,
    store: '晓港布料市场 2F-38',
    purchase_date: '2026-05-15',
    photos: '[]',
    status: 'idle',
    notes: '适合做春夏连衣裙',
  }

  it('createFabric should insert and return a fabric with id and timestamps', () => {
    const result = createFabric(sampleFabric)
    expect(result.id).toBeGreaterThan(0)
    expect(result.name).toBe('碎花亚麻')
    expect(result.width).toBe(145)
    expect(result.created_at).toBeTruthy()
    expect(result.updated_at).toBeTruthy()
  })

  it('getAllFabrics should return all fabrics', () => {
    createFabric({ ...sampleFabric, name: '水洗牛仔蓝' })
    const list = getAllFabrics(TEST_USER_ID)
    expect(list.length).toBeGreaterThanOrEqual(2)
    expect(list[0].name).toBe('水洗牛仔蓝') // latest first
  })

  it('getAllFabrics should support search', () => {
    createFabric({ ...sampleFabric, name: '独一无二测试名' })
    const list = getAllFabrics(1, { search: '独一无二' })
    expect(list.length).toBe(1)
  })

  it('getFabricById should return the correct fabric', () => {
    const created = createFabric({ ...sampleFabric, name: '真丝素绉缎' })
    const found = getFabricById(created.id, TEST_USER_ID)
    expect(found).not.toBeNull()
    expect(found!.name).toBe('真丝素绉缎')
  })

  it('getFabricById should return null for nonexistent id', () => {
    const found = getFabricById(99999, TEST_USER_ID)
    expect(found).toBeNull()
  })

  it('updateFabric should modify and return updated fabric', () => {
    const created = createFabric({ ...sampleFabric, name: '羊毛格纹' })
    const updated = updateFabric(created.id, TEST_USER_ID, { name: '羊毛格纹（加厚）', price: 130 })
    expect(updated).not.toBeNull()
    expect(updated!.name).toBe('羊毛格纹（加厚）')
    expect(updated!.price).toBe(130)
    expect(updated!.type).toBe(created.type) // unchanged field
  })

  it('deleteFabric should remove the fabric', () => {
    const created = createFabric({ ...sampleFabric, name: '待删除布料' })
    const result = deleteFabric(created.id, TEST_USER_ID)
    expect(result).toBe(true)
    expect(getFabricById(created.id, TEST_USER_ID)).toBeNull()
  })
})

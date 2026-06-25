import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { resetTestDb } from '../db-mock'

// 使用 lib/__mocks__/db.ts 手动 mock
vi.mock('@/lib/db')

const { createFabric, getFabricById, getAllFabrics, updateFabric, deleteFabric } = await import('@/lib/fabrics')

const TEST_USER_ID = 1

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

describe('Fabrics CRUD', () => {
  beforeAll(() => { resetTestDb() })
  afterAll(() => { resetTestDb() })

  it('createFabric — 新增并返回带 id 和时间戳的布料', async () => {
    const result = await createFabric(sampleFabric)
    expect(result.id).toBeGreaterThan(0)
    expect(result.name).toBe('碎花亚麻')
    expect(result.width).toBe(145)
    expect(result.created_at).toBeTruthy()
    expect(result.updated_at).toBeTruthy()
  })

  it('getAllFabrics — 返回用户所有布料', async () => {
    await createFabric({ ...sampleFabric, name: '水洗牛仔蓝' })
    const list = await getAllFabrics(TEST_USER_ID)
    expect(list.length).toBeGreaterThanOrEqual(2)
  })

  it('getAllFabrics — 按类型筛选', async () => {
    const list = await getAllFabrics(TEST_USER_ID, { type: '棉麻混纺' })
    expect(list.length).toBeGreaterThanOrEqual(1)
    expect(list.every(f => f.type === '棉麻混纺')).toBe(true)
  })

  it('getAllFabrics — 按状态筛选', async () => {
    await createFabric({ ...sampleFabric, name: '用完的', status: 'empty' })
    const list = await getAllFabrics(TEST_USER_ID, { status: 'empty' })
    expect(list.every(f => f.status === 'empty')).toBe(true)
  })

  it('getAllFabrics — 按价格升序', async () => {
    resetTestDb()
    await createFabric({ ...sampleFabric, name: '便宜', price: 10 })
    await createFabric({ ...sampleFabric, name: '贵', price: 100 })
    const list = await getAllFabrics(TEST_USER_ID, { sort: 'price_asc' })
    expect(list[0].price).toBeLessThanOrEqual(list[list.length - 1].price!)
  })

  it('getAllFabrics — 默认按创建时间倒序', async () => {
    resetTestDb()
    await createFabric({ ...sampleFabric, name: '先' })
    await new Promise(r => setTimeout(r, 50))
    await createFabric({ ...sampleFabric, name: '后' })
    const list = await getAllFabrics(TEST_USER_ID)
    expect(list[0].name).toBe('后')
  })

  it('getFabricById — 返回正确布料', async () => {
    resetTestDb()
    const created = await createFabric({ ...sampleFabric, name: '真丝素绉缎' })
    const found = await getFabricById(created.id, TEST_USER_ID)
    expect(found).not.toBeNull()
    expect(found!.name).toBe('真丝素绉缎')
  })

  it('getFabricById — 不存在返回 null', async () => {
    expect(await getFabricById(99999, TEST_USER_ID)).toBeNull()
  })

  it('updateFabric — 修改并返回更新后的布料', async () => {
    const created = await createFabric({ ...sampleFabric, name: '羊毛格纹' })
    const updated = await updateFabric(created.id, TEST_USER_ID, { name: '羊毛格纹（加厚）', price: 130 })
    expect(updated).not.toBeNull()
    expect(updated!.name).toBe('羊毛格纹（加厚）')
    expect(updated!.price).toBe(130)
    expect(updated!.type).toBe(created.type)
  })

  it('deleteFabric — 删除布料', async () => {
    const created = await createFabric({ ...sampleFabric, name: '待删除' })
    expect(await deleteFabric(created.id, TEST_USER_ID)).toBe(true)
    expect(await getFabricById(created.id, TEST_USER_ID)).toBeNull()
  })
})

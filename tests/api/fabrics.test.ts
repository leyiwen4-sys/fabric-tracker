// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { resetTestDb } from '../db-mock'

vi.mock('@/lib/db')

const fabricsRoute = await import('@/app/api/fabrics/route')
const fabricsIdRoute = await import('@/app/api/fabrics/[id]/route')
const { GET, POST } = fabricsRoute
const { GET: GET_ONE, PUT } = fabricsIdRoute

beforeAll(() => { resetTestDb() })
afterAll(() => { resetTestDb() })

describe('GET /api/fabrics', () => {
  it('should return 401 when not authenticated', async () => {
    const res = await GET(new Request('http://localhost/api/fabrics'))
    const json = await res.json()
    expect(res.status).toBe(401)
    expect(json.success).toBe(false)
  })
})

describe('POST /api/fabrics', () => {
  it('should return 401 when not authenticated', async () => {
    const formData = new FormData()
    formData.append('name', 'test')
    formData.append('type', '棉')
    formData.append('unit', '米')
    const res = await POST(
      new Request('http://localhost/api/fabrics', { method: 'POST', body: formData })
    )
    expect(res.status).toBe(401)
  })
})

describe('GET /api/fabrics/[id]', () => {
  it('should return 401 when not authenticated', async () => {
    const res = await GET_ONE(
      new Request('http://localhost/api/fabrics/1'),
      { params: Promise.resolve({ id: '1' }) }
    )
    expect(res.status).toBe(401)
  })
})

describe('PUT /api/fabrics/[id]', () => {
  it('should return 401 when not authenticated', async () => {
    const res = await PUT(
      new Request('http://localhost/api/fabrics/1'),
      { params: Promise.resolve({ id: '1' }) }
    )
    expect(res.status).toBe(401)
  })

  it('should return 401 for unauthenticated PUT (auth checked before id validation)', async () => {
    const formData = new FormData()
    formData.append('name', 'updated')
    const res = await PUT(
      new Request('http://localhost/api/fabrics/abc', { method: 'PUT', body: formData }),
      { params: Promise.resolve({ id: 'abc' }) }
    )
    // 认证检查优先于 ID 验证，未登录请求返回 401
    expect(res.status).toBe(401)
  })
})

// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { GET, POST } from '@/app/api/fabrics/route'
import { GET as GET_ONE, PUT, DELETE } from '@/app/api/fabrics/[id]/route'
import { getDb } from '@/lib/db'
import { NextRequest } from 'next/server'
import { signToken } from '@/lib/auth'

let authToken: string

beforeAll(async () => {
  // Create a test user for auth
  const db = getDb()
  db.prepare('INSERT OR IGNORE INTO users (id, email, password_hash) VALUES (1, ?, ?)').run('test@test.com', 'hash')
  authToken = await signToken({ userId: 1, email: 'test@test.com' })
})

afterAll(() => {
  const db = getDb()
  db.exec('DELETE FROM fabrics')
  db.exec('DELETE FROM users')
})

// Helper: wrap request with auth cookie
function authRequest(url: string, options?: RequestInit): NextRequest {
  const req = new NextRequest(new URL(url), options)
  req.cookies.set('token', authToken)
  return req
}

describe('GET /api/fabrics', () => {
  it('should return 401 when not authenticated', async () => {
    const res = await GET(new NextRequest(new URL('http://localhost/api/fabrics')))
    const json = await res.json()
    expect(res.status).toBe(401)
    expect(json.success).toBe(false)
  })

  it('should return success with fabric list', async () => {
    const res = await GET(authRequest('http://localhost/api/fabrics'))
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(Array.isArray(json.data)).toBe(true)
  })
})

describe('POST /api/fabrics', () => {
  it('should return 401 when not authenticated', async () => {
    const formData = new FormData()
    formData.append('name', 'test')
    formData.append('type', '棉')
    formData.append('unit', '米')
    const req = new NextRequest(new URL('http://localhost/api/fabrics'), {
      method: 'POST',
      body: formData,
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('should return 400 when name is missing', async () => {
    const formData = new FormData()
    formData.append('type', '棉')
    formData.append('unit', '米')
    const req = authRequest('http://localhost/api/fabrics', {
      method: 'POST',
      body: formData,
    })
    const res = await POST(req)
    const json = await res.json()
    expect(res.status).toBe(400)
    expect(json.success).toBe(false)
  })

  it('should create a fabric with valid data', async () => {
    const formData = new FormData()
    formData.append('name', '测试布料')
    formData.append('type', '棉')
    formData.append('unit', '米')
    formData.append('width', '150')
    formData.append('price', '35')
    formData.append('store', '测试店铺')
    formData.append('purchase_date', '2026-06-01')
    formData.append('notes', '测试备注')
    const req = authRequest('http://localhost/api/fabrics', {
      method: 'POST',
      body: formData,
    })
    const res = await POST(req)
    const json = await res.json()
    expect(res.status).toBe(201)
    expect(json.success).toBe(true)
    expect(json.data.name).toBe('测试布料')
    expect(json.data.id).toBeGreaterThan(0)
  })
})

describe('GET /api/fabrics/[id]', () => {
  it('should return 401 when not authenticated', async () => {
    const res = await GET_ONE(
      new NextRequest(new URL('http://localhost/api/fabrics/1')),
      { params: Promise.resolve({ id: '1' }) }
    )
    expect(res.status).toBe(401)
  })

  it('should return 400 for invalid id', async () => {
    const res = await GET_ONE(
      authRequest('http://localhost/api/fabrics/abc'),
      { params: Promise.resolve({ id: 'abc' }) }
    )
    expect(res.status).toBe(400)
  })

  it('should return 404 for nonexistent id', async () => {
    const res = await GET_ONE(
      authRequest('http://localhost/api/fabrics/99999'),
      { params: Promise.resolve({ id: '99999' }) }
    )
    expect(res.status).toBe(404)
  })
})

describe('PUT /api/fabrics/[id]', () => {
  it('should return 401 when not authenticated', async () => {
    const res = await PUT(
      new NextRequest(new URL('http://localhost/api/fabrics/1')),
      { params: Promise.resolve({ id: '1' }) }
    )
    expect(res.status).toBe(401)
  })

  it('should return 400 for invalid id', async () => {
    const formData = new FormData()
    formData.append('name', 'updated')
    const req = authRequest('http://localhost/api/fabrics/abc', {
      method: 'PUT',
      body: formData,
    })
    const res = await PUT(req, { params: Promise.resolve({ id: 'abc' }) })
    expect(res.status).toBe(400)
  })
})

describe('DELETE /api/fabrics/[id]', () => {
  it('should return 401 when not authenticated', async () => {
    const res = await DELETE(
      new NextRequest(new URL('http://localhost/api/fabrics/1')),
      { params: Promise.resolve({ id: '1' }) }
    )
    expect(res.status).toBe(401)
  })

  it('should return 400 for invalid id', async () => {
    const res = await DELETE(
      authRequest('http://localhost/api/fabrics/abc'),
      { params: Promise.resolve({ id: 'abc' }) }
    )
    expect(res.status).toBe(400)
  })
})

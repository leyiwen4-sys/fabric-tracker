import { describe, it, expect, afterAll } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/fabrics/route'
import { getDb } from '@/lib/db'

describe('GET /api/fabrics', () => {
  afterAll(() => {
    const db = getDb()
    db.exec('DELETE FROM fabrics')
  })

  it('should return success with fabric list', async () => {
    const res = await GET(new NextRequest(new URL('http://localhost/api/fabrics')))
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(Array.isArray(json.data)).toBe(true)
  })
})

describe('POST /api/fabrics', () => {
  afterAll(() => {
    const db = getDb()
    db.exec('DELETE FROM fabrics')
  })

  it('should return 400 when name is missing', async () => {
    const formData = new FormData()
    formData.append('type', '棉')
    formData.append('unit', '米')
    const req = new NextRequest(new URL('http://localhost/api/fabrics'), {
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
    const req = new NextRequest(new URL('http://localhost/api/fabrics'), {
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

// Helper function used in tests below
function createRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(new URL(url), options)
}

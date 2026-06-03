// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { GET } from '@/app/api/stats/route'
import { getDb } from '@/lib/db'
import { signToken } from '@/lib/auth'
import { NextRequest } from 'next/server'

let token: string

beforeAll(async () => {
  const db = getDb()
  db.prepare('INSERT OR IGNORE INTO users (id, email, password_hash) VALUES (99, ?, ?)').run('stats@test.com', 'hash')
  token = await signToken({ userId: 99, email: 'stats@test.com' })
})

afterAll(() => {
  const db = getDb()
  db.exec('DELETE FROM fabrics WHERE user_id = 99')
  db.exec('DELETE FROM users WHERE id = 99')
})

describe('GET /api/stats', () => {
  it('should return stats for current user', async () => {
    const req = new NextRequest('http://localhost/api/stats')
    req.cookies.set('token', token)
    const res = await GET(req)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data).toHaveProperty('totalCount')
    expect(json.data).toHaveProperty('totalSpend')
    expect(json.data).toHaveProperty('byType')
    expect(json.data).toHaveProperty('byStatus')
  })

  it('should return 401 without auth', async () => {
    const req = new NextRequest('http://localhost/api/stats')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })
})

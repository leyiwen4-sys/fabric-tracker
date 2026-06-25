// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { resetTestDb } from '../db-mock'

vi.mock('@/lib/db')

const { GET } = await import('@/app/api/stats/route')

beforeAll(() => { resetTestDb() })
afterAll(() => { resetTestDb() })

describe('GET /api/stats', () => {
  it('should return 401 without auth', async () => {
    const res = await GET(new Request('http://localhost/api/stats'))
    expect(res.status).toBe(401)
  })
})

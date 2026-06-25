// @vitest-environment node

import { describe, it, expect, afterAll, vi } from 'vitest'
import { resetTestDb } from '../db-mock'

vi.mock('@/lib/db')

const { POST: Register } = await import('@/app/api/auth/register/route')
const { POST: Login } = await import('@/app/api/auth/login/route')
const { POST: Logout } = await import('@/app/api/auth/logout/route')
const { GET: Me } = await import('@/app/api/auth/me/route')

afterAll(() => { resetTestDb() })

describe('POST /api/auth/register', () => {
  it('should register a new user', async () => {
    const res = await Register(
      new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', password: '123456' }),
      })
    )
    const json = await res.json()
    expect(res.status).toBe(201)
    expect(json.success).toBe(true)
    expect(json.data.email).toBe('test@example.com')
  })

  it('should reject duplicate email', async () => {
    const res = await Register(
      new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', password: '123456' }),
      })
    )
    expect(res.status).toBe(400)
  })

  it('should reject invalid email', async () => {
    const res = await Register(
      new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email: 'notanemail', password: '123456' }),
      })
    )
    expect(res.status).toBe(400)
  })

  it('should reject short password', async () => {
    const res = await Register(
      new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email: 'new@test.com', password: '123' }),
      })
    )
    expect(res.status).toBe(400)
  })
})

describe('POST /api/auth/login', () => {
  it('should login with correct credentials', async () => {
    const res = await Login(
      new Request('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', password: '123456' }),
      })
    )
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.email).toBe('test@example.com')
  })

  it('should reject wrong password', async () => {
    const res = await Login(
      new Request('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', password: 'wrong' }),
      })
    )
    expect(res.status).toBe(401)
  })

  it('should reject nonexistent email', async () => {
    const res = await Login(
      new Request('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'nobody@test.com', password: '123456' }),
      })
    )
    expect(res.status).toBe(401)
  })
})

describe('GET /api/auth/me', () => {
  it('should return 401 without cookie', async () => {
    const res = await Me(new Request('http://localhost/api/auth/me'))
    expect(res.status).toBe(401)
  })
})

describe('POST /api/auth/logout', () => {
  it('should clear cookie', async () => {
    const res = await Logout(
      new Request('http://localhost/api/auth/logout', { method: 'POST' })
    )
    const json = await res.json()
    expect(json.success).toBe(true)
  })
})

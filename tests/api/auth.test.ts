// @vitest-environment node

import { describe, it, expect, afterAll } from 'vitest'
import { POST as Register } from '@/app/api/auth/register/route'
import { POST as Login } from '@/app/api/auth/login/route'
import { getDb } from '@/lib/db'
import { NextRequest } from 'next/server'

afterAll(() => {
  const db = getDb()
  db.exec('DELETE FROM fabrics')
  db.exec('DELETE FROM users')
})

describe('POST /api/auth/register', () => {
  it('should register a new user', async () => {
    const res = await Register(
      new NextRequest('http://localhost/api/auth/register', {
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
      new NextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', password: '123456' }),
      })
    )
    expect(res.status).toBe(400)
  })

  it('should reject invalid email', async () => {
    const res = await Register(
      new NextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email: 'notanemail', password: '123456' }),
      })
    )
    expect(res.status).toBe(400)
  })

  it('should reject short password', async () => {
    const res = await Register(
      new NextRequest('http://localhost/api/auth/register', {
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
      new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', password: '123456' }),
      })
    )
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.email).toBe('test@example.com')
    expect(res.cookies.get('token')).toBeDefined()
  })

  it('should reject wrong password', async () => {
    const res = await Login(
      new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', password: 'wrong' }),
      })
    )
    expect(res.status).toBe(401)
  })

  it('should reject nonexistent email', async () => {
    const res = await Login(
      new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'nobody@test.com', password: '123456' }),
      })
    )
    expect(res.status).toBe(401)
  })
})

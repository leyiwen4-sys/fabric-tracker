// @vitest-environment node

import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword, signToken, verifyToken } from '@/lib/auth'

describe('hashPassword', () => {
  it('should return a hash string different from input', async () => {
    const hash = await hashPassword('mypassword123')
    expect(hash).not.toBe('mypassword123')
    expect(hash.length).toBeGreaterThan(30)
  })
})

describe('verifyPassword', () => {
  it('should return true for correct password', async () => {
    const hash = await hashPassword('mypassword123')
    const result = await verifyPassword('mypassword123', hash)
    expect(result).toBe(true)
  })

  it('should return false for wrong password', async () => {
    const hash = await hashPassword('mypassword123')
    const result = await verifyPassword('wrongpassword', hash)
    expect(result).toBe(false)
  })
})

describe('signToken + verifyToken', () => {
  it('should sign and verify a JWT with correct payload', async () => {
    const token = await signToken({ userId: 1, email: 'test@test.com' })
    expect(typeof token).toBe('string')

    const payload = await verifyToken(token)
    expect(payload).not.toBeNull()
    expect(payload!.userId).toBe(1)
    expect(payload!.email).toBe('test@test.com')
  })

  it('should return null for invalid token', async () => {
    const payload = await verifyToken('invalid.token.here')
    expect(payload).toBeNull()
  })
})

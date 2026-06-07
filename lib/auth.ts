import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import { execute, ensureSchema, rowsToObjects } from './db'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-secret-change-in-production'
)

const COOKIE_NAME = 'token'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export interface JwtPayload {
  userId: number
  email: string
}

export async function signToken(payload: JwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as JwtPayload
  } catch {
    return null
  }
}

export function getCookieName(): string {
  return COOKIE_NAME
}

export function getCookieOptions(): { name: string; httpOnly: boolean; secure: boolean; sameSite: 'lax'; path: string; maxAge: number } {
  return {
    name: COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  }
}

/** Verify user exists in DB — used by API routes */
export async function getUserIdFromRequest(request: Request): Promise<number | null> {
  const cookieHeader = request.headers.get('cookie') || ''
  const token = cookieHeader
    .split(';')
    .map(c => c.trim())
    .find(c => c.startsWith(`${COOKIE_NAME}=`))
    ?.split('=')[1]
  if (!token) return null

  const payload = await verifyToken(token)
  if (!payload?.userId) return null

  await ensureSchema()
  const result = await execute('SELECT id FROM users WHERE id = ?', [payload.userId])
  const users = rowsToObjects<{ id: number }>(result.columns, result.rows)
  return users[0]?.id || null
}

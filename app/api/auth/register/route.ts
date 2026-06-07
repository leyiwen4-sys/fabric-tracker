import { NextRequest, NextResponse } from 'next/server'
import { hashPassword } from '@/lib/auth'
import { getDb, rowsToObjects } from '@/lib/db'

export async function GET() {
  return NextResponse.json({ ok: true, route: 'register' })
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Validate email format
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: '请输入有效的邮箱地址' },
        { status: 400 }
      )
    }

    // Validate password length
    if (!password || password.length < 6) {
      return NextResponse.json(
        { success: false, error: '密码长度不能少于 6 位' },
        { status: 400 }
      )
    }

    const db = getDb()

    // Check if email already exists
    const existingResult = await db.execute({ sql: 'SELECT id FROM users WHERE email = ?', args: [email] })
    const existing = rowsToObjects<{ id: number }>(existingResult.columns, existingResult.rows)
    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, error: '该邮箱已被注册' },
        { status: 400 }
      )
    }

    const passwordHash = await hashPassword(password)
    const result = await db.execute({
      sql: 'INSERT INTO users (email, password_hash) VALUES (?, ?)',
      args: [email, passwordHash],
    })

    return NextResponse.json(
      { success: true, data: { id: Number(result.lastInsertRowid), email } },
      { status: 201 }
    )
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Register error:', msg)
    return NextResponse.json(
      { success: false, error: '注册失败：' + msg },
      { status: 500 }
    )
  }
}

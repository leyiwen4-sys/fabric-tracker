import { NextRequest, NextResponse } from 'next/server'
import { hashPassword } from '@/lib/auth'
import { getDb } from '@/lib/db'

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
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
    if (existing) {
      return NextResponse.json(
        { success: false, error: '该邮箱已被注册' },
        { status: 400 }
      )
    }

    const passwordHash = await hashPassword(password)
    const result = db.prepare(
      'INSERT INTO users (email, password_hash) VALUES (?, ?)'
    ).run(email, passwordHash)

    return NextResponse.json(
      { success: true, data: { id: result.lastInsertRowid, email } },
      { status: 201 }
    )
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '注册失败，请重试' },
      { status: 500 }
    )
  }
}

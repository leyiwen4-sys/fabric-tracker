import { NextRequest, NextResponse } from 'next/server'
import { verifyPassword, signToken, getCookieOptions } from '@/lib/auth'
import { getDb } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: '请输入邮箱和密码' },
        { status: 400 }
      )
    }

    const db = getDb()
    const user = db.prepare(
      'SELECT id, email, password_hash FROM users WHERE email = ?'
    ).get(email) as any

    if (!user) {
      return NextResponse.json(
        { success: false, error: '邮箱或密码错误' },
        { status: 401 }
      )
    }

    const valid = await verifyPassword(password, user.password_hash)
    if (!valid) {
      return NextResponse.json(
        { success: false, error: '邮箱或密码错误' },
        { status: 401 }
      )
    }

    const token = await signToken({ userId: user.id, email: user.email })
    const opts = getCookieOptions()

    const response = NextResponse.json({
      success: true,
      data: { id: user.id, email: user.email },
    })

    response.cookies.set(opts.name, token, {
      httpOnly: opts.httpOnly,
      secure: opts.secure,
      sameSite: opts.sameSite,
      path: opts.path,
      maxAge: opts.maxAge,
    })

    return response
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '登录失败，请重试' },
      { status: 500 }
    )
  }
}

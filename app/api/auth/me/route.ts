import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getCookieName } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(getCookieName())?.value
    if (!token) {
      return NextResponse.json(
        { success: false, error: '未登录' },
        { status: 401 }
      )
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { success: false, error: '登录已过期' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { id: payload.userId, email: payload.email },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '认证失败' },
      { status: 401 }
    )
  }
}

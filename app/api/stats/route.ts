import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getCookieName } from '@/lib/auth'
import { getDb } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(getCookieName())?.value
    if (!token) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 })
    }
    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ success: false, error: '登录已过期' }, { status: 401 })
    }

    const db = getDb()
    const userId = payload.userId

    const { count } = db.prepare('SELECT COUNT(*) as count FROM fabrics WHERE user_id = ?').get(userId) as any
    const { total } = db.prepare('SELECT COALESCE(SUM(price), 0) as total FROM fabrics WHERE user_id = ?').get(userId) as any
    const byType = db.prepare('SELECT type, COUNT(*) as count FROM fabrics WHERE user_id = ? GROUP BY type ORDER BY count DESC').all(userId)
    const byStatus = db.prepare('SELECT status, COUNT(*) as count FROM fabrics WHERE user_id = ? GROUP BY status').all(userId)

    return NextResponse.json({
      success: true,
      data: { totalCount: count, totalSpend: total, byType, byStatus },
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: '获取统计失败' }, { status: 500 })
  }
}

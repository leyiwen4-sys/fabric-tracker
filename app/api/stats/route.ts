import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromRequest } from '@/lib/auth'
import { getDb, rowsToObjects } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 })
    }

    const db = getDb()

    const countResult = await db.execute({ sql: 'SELECT COUNT(*) as count FROM fabrics WHERE user_id = ?', args: [userId] })
    const count = (rowsToObjects<{ count: number }>(countResult.columns, countResult.rows)[0]?.count) || 0

    const totalResult = await db.execute({ sql: 'SELECT COALESCE(SUM(price), 0) as total FROM fabrics WHERE user_id = ?', args: [userId] })
    const total = (rowsToObjects<{ total: number }>(totalResult.columns, totalResult.rows)[0]?.total) || 0

    const byTypeResult = await db.execute({ sql: 'SELECT type, COUNT(*) as count FROM fabrics WHERE user_id = ? GROUP BY type ORDER BY count DESC', args: [userId] })
    const byType = rowsToObjects(byTypeResult.columns, byTypeResult.rows)

    const byStatusResult = await db.execute({ sql: 'SELECT status, COUNT(*) as count FROM fabrics WHERE user_id = ? GROUP BY status', args: [userId] })
    const byStatus = rowsToObjects(byStatusResult.columns, byStatusResult.rows)

    return NextResponse.json({
      success: true,
      data: { totalCount: count, totalSpend: total, byType, byStatus },
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: '获取统计失败' }, { status: 500 })
  }
}

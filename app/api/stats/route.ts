import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromRequest } from '@/lib/auth'
import { execute, ensureSchema, rowsToObjects } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 })
    }

    await ensureSchema()

    const countResult = await execute('SELECT COUNT(*) as count FROM fabrics WHERE user_id = ?', [userId])
    const count = (rowsToObjects<{ count: number }>(countResult.columns, countResult.rows)[0]?.count) || 0

    const totalResult = await execute('SELECT COALESCE(SUM(price), 0) as total FROM fabrics WHERE user_id = ?', [userId])
    const total = (rowsToObjects<{ total: number }>(totalResult.columns, totalResult.rows)[0]?.total) || 0

    const byTypeResult = await execute('SELECT type, COUNT(*) as count FROM fabrics WHERE user_id = ? GROUP BY type ORDER BY count DESC', [userId])
    const byType = rowsToObjects(byTypeResult.columns, byTypeResult.rows)

    const byStatusResult = await execute('SELECT status, COUNT(*) as count FROM fabrics WHERE user_id = ? GROUP BY status', [userId])
    const byStatus = rowsToObjects(byStatusResult.columns, byStatusResult.rows)

    return NextResponse.json({
      success: true,
      data: { totalCount: count, totalSpend: total, byType, byStatus },
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: '获取统计失败' }, { status: 500 })
  }
}

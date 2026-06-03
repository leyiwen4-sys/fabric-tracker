import { cookies } from 'next/headers'
import { verifyToken, getCookieName } from '@/lib/auth'
import { getDb } from '@/lib/db'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const statusMap: Record<string, string> = { idle: '闲置', used: '已用', empty: '已用完' }

export default async function StatsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get(getCookieName())?.value
  const payload = token ? await verifyToken(token) : null
  const userId = payload?.userId || 0

  const db = getDb()
  const { count } = db.prepare('SELECT COUNT(*) as count FROM fabrics WHERE user_id = ?').get(userId) as any
  const { total } = db.prepare('SELECT COALESCE(SUM(price), 0) as total FROM fabrics WHERE user_id = ?').get(userId) as any
  const byType = db.prepare('SELECT type, COUNT(*) as count FROM fabrics WHERE user_id = ? GROUP BY type ORDER BY count DESC').all(userId) as any[]
  const byStatus = db.prepare('SELECT status, COUNT(*) as count FROM fabrics WHERE user_id = ? GROUP BY status').all(userId) as any[]

  const maxTypeCount = Math.max(1, ...byType.map((t: any) => t.count))

  return (
    <div>
      <header style={{
        padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px',
        background: 'var(--color-white)', borderBottom: '1px solid var(--color-border)',
      }}>
        <Link href="/" style={{ fontSize: '18px' }}>←</Link>
        <span style={{ fontSize: '17px', fontWeight: 600 }}>📊 统计</span>
      </header>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
          <div style={{ background: 'var(--color-white)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 700 }}>{count}</div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>📦 总布料数</div>
          </div>
          <div style={{ background: 'var(--color-white)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 700 }}>¥{total || 0}</div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>💰 总花费</div>
          </div>
        </div>

        {byType.length > 0 && (
          <>
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>📊 按类型分布</h3>
            {byType.map((t: any) => (
              <div key={t.type} style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '2px' }}>
                  <span>{t.type}</span><span>{t.count} 块</span>
                </div>
                <div style={{ background: '#eee', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                  <div style={{
                    background: 'var(--color-primary)', height: '100%',
                    width: `${(t.count / maxTypeCount) * 100}%`, borderRadius: '4px',
                  }} />
                </div>
              </div>
            ))}
          </>
        )}

        <h3 style={{ fontSize: '15px', fontWeight: 600, margin: '20px 0 12px' }}>📋 按状态分布</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          {['idle', 'used', 'empty'].map(s => {
            const found = byStatus.find((x: any) => x.status === s)
            return (
              <div key={s} style={{ background: 'var(--color-white)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '22px', fontWeight: 600 }}>{found?.count || 0}</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>{statusMap[s]}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

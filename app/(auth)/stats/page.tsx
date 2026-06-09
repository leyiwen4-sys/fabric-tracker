import { cookies } from 'next/headers'
import { verifyToken, getCookieName } from '@/lib/auth'
import { execute, ensureSchema, rowsToObjects } from '@/lib/db'
import { Title, Card, Wallet, Icon } from 'animal-island-ui'
import BackButton from '@/components/BackButton'
import StatsTabs from '@/components/StatsTabs'

export const dynamic = 'force-dynamic'

const statusLabel: Record<string, string> = { idle: '闲置中~', used: '用掉一点啦~', empty: '已经用完啦！' }

export default async function StatsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get(getCookieName())?.value
  const payload = token ? await verifyToken(token) : null
  const userId = payload?.userId || 0

  await ensureSchema()

  const countResult = await execute('SELECT COUNT(*) as count FROM fabrics WHERE user_id = ?', [userId])
  const count = (rowsToObjects<{ count: number }>(countResult.columns, countResult.rows)[0]?.count) || 0

  const totalResult = await execute('SELECT COALESCE(SUM(price), 0) as total FROM fabrics WHERE user_id = ?', [userId])
  const total = (rowsToObjects<{ total: number }>(totalResult.columns, totalResult.rows)[0]?.total) || 0

  const byTypeResult = await execute('SELECT type as name, COUNT(*) as count FROM fabrics WHERE user_id = ? GROUP BY type ORDER BY count DESC', [userId])
  const byType = rowsToObjects<{ name: string; count: number }>(byTypeResult.columns, byTypeResult.rows)

  const byStatusRawResult = await execute('SELECT status FROM fabrics WHERE user_id = ?', [userId])
  const byStatusRaw = rowsToObjects<{ status: string }>(byStatusRawResult.columns, byStatusRawResult.rows)
  const statusData = ['idle', 'used', 'empty'].map(s => ({
    name: statusLabel[s],
    count: byStatusRaw.filter((r) => r.status === s).length,
  }))

  const byStoreResult = await execute("SELECT store as name, COUNT(*) as count FROM fabrics WHERE user_id = ? AND store IS NOT NULL AND store != '' GROUP BY store ORDER BY count DESC", [userId])
  const byStore = rowsToObjects<{ name: string; count: number }>(byStoreResult.columns, byStoreResult.rows)

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--color-paper)' }}>
      {/* 页头 — 标题居中 */}
      <header style={{
        padding: '14px 16px 10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        flexShrink: 0,
      }}>
        <div style={{ position: 'absolute', left: 16 }}>
          <BackButton href="/" />
        </div>
        <Title size="small" color="app-yellow">布记岛统计处</Title>
      </header>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', minHeight: 0 }}>
        {/* 总览 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
          <div style={{ textAlign: 'center' }}>
            <Wallet value={count} icon={<Icon item={432} size={45} />}  />
            <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '6px' }}>总布料数</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Wallet value={`¥${total || 0}`} />
            <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '6px' }}>总花费</div>
          </div>
        </div>

        <Card style={{ background: 'transparent' }}>
          <StatsTabs data={{
            type: byType,
            status: statusData,
            store: byStore,
          }} total={count} />
        </Card>
      </div>
    </div>
  )
}

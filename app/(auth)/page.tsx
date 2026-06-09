import { cookies } from 'next/headers'
import { verifyToken, getCookieName } from '@/lib/auth'
import { getAllFabrics } from '@/lib/fabrics'
import LogoutButton from '@/components/LogoutButton'
import SearchBar from '@/components/SearchBar'
import { Suspense } from 'react'
import { Title } from 'animal-island-ui'
import StatsButton from '@/components/StatsButton'
import AddFabricButton from '@/components/AddFabricButton'
import FabricList from '@/components/FabricList'

export const dynamic = 'force-dynamic'

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const cookieStore = await cookies()
  const token = cookieStore.get(getCookieName())?.value
  const payload = token ? await verifyToken(token) : null
  const userId = payload?.userId || 0

  const { search } = await searchParams
  const fabrics = userId ? await getAllFabrics(userId, { search }) : []

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--color-paper)' }}>
      {/* 顶部 — 统计 · 标题 · 退出 */}
      <header
        style={{
          padding: '16px 16px 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
          background: 'var(--color-paper)',
        }}
      >
        <StatsButton />

        <Title size="small" color="app-pink">我的布记岛</Title>

        <LogoutButton />
      </header>

      <div style={{ flexShrink: 0 }}>
        <Suspense fallback={null}>
          <SearchBar />
        </Suspense>
      </div>

      <main style={{ flex: 1, overflowY: 'auto', padding: '8px 12px', minHeight: 0 }}>
        <FabricList fabrics={fabrics} />
      </main>

      <AddFabricButton />
    </div>
  )
}

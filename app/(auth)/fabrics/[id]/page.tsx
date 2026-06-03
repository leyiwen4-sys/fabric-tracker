import { cookies } from 'next/headers'
import { verifyToken, getCookieName } from '@/lib/auth'
import { getFabricById } from '@/lib/fabrics'
import { notFound } from 'next/navigation'
import FabricDetail from '@/components/FabricDetail'

export const dynamic = 'force-dynamic'

export default async function FabricDetailPage({ params }: { params: { id: string } }) {
  const id = parseInt(params.id)
  if (isNaN(id)) notFound()

  const cookieStore = await cookies()
  const token = cookieStore.get(getCookieName())?.value
  const payload = token ? await verifyToken(token) : null
  const userId = payload?.userId || 0

  const fabric = userId ? getFabricById(id, userId) : null
  if (!fabric) notFound()

  return (
    <div>
      <header style={{
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'var(--color-white)',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <a href="/" style={{ fontSize: '18px' }}>←</a>
        <span style={{ fontSize: '17px', fontWeight: 600 }}>{fabric.name}</span>
      </header>
      <FabricDetail fabric={fabric} />
    </div>
  )
}

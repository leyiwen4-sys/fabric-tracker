import { cookies } from 'next/headers'
import { verifyToken, getCookieName } from '@/lib/auth'
import { getFabricById } from '@/lib/fabrics'
import { notFound } from 'next/navigation'
import FabricDetail from '@/components/FabricDetail'
import BackHeader from '@/components/BackHeader'

export const dynamic = 'force-dynamic'

export default async function FabricDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params
  const id = parseInt(idStr)
  if (isNaN(id)) notFound()

  const cookieStore = await cookies()
  const token = cookieStore.get(getCookieName())?.value
  const payload = token ? await verifyToken(token) : null
  const userId = payload?.userId || 0

  const fabric = userId ? getFabricById(id, userId) : null
  if (!fabric) notFound()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-paper)' }}>
      <BackHeader title={fabric.name} href="/" />
      <FabricDetail fabric={fabric} />
    </div>
  )
}

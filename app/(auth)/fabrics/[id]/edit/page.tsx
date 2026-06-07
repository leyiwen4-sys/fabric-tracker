import { cookies } from 'next/headers'
import { verifyToken, getCookieName } from '@/lib/auth'
import { getFabricById } from '@/lib/fabrics'
import { notFound } from 'next/navigation'
import FabricForm from '@/components/FabricForm'
import BackHeader from '@/components/BackHeader'

export const dynamic = 'force-dynamic'

export default async function EditFabricPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params
  const id = parseInt(idStr)
  if (isNaN(id)) notFound()

  const cookieStore = await cookies()
  const token = cookieStore.get(getCookieName())?.value
  const payload = token ? await verifyToken(token) : null
  const userId = payload?.userId || 0

  const fabric = userId ? await getFabricById(id, userId) : null
  if (!fabric) notFound()

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--color-paper)' }}>
      <div style={{ flexShrink: 0 }}>
        <BackHeader title="编辑布料" href={`/fabrics/${fabric.id}`} />
      </div>
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        <FabricForm fabric={fabric} />
      </div>
    </div>
  )
}

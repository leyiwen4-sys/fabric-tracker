import { cookies } from 'next/headers'
import { verifyToken, getCookieName } from '@/lib/auth'
import { getFabricById } from '@/lib/fabrics'
import { notFound } from 'next/navigation'
import FabricForm from '@/components/FabricForm'

export const dynamic = 'force-dynamic'

export default async function EditFabricPage({ params }: { params: Promise<{ id: string }> }) {
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
    <div>
      <header style={{
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'var(--color-white)',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <a href={`/fabrics/${fabric.id}`} style={{ fontSize: '18px' }}>←</a>
        <span style={{ fontSize: '17px', fontWeight: 600 }}>编辑布料</span>
      </header>
      <FabricForm fabric={fabric} />
    </div>
  )
}

import { getFabricById } from '@/lib/fabrics'
import { notFound } from 'next/navigation'
import FabricDetail from '@/components/FabricDetail'

export const dynamic = 'force-dynamic'

export default function FabricDetailPage({ params }: { params: { id: string } }) {
  const id = parseInt(params.id)
  if (isNaN(id)) notFound()

  const fabric = getFabricById(id)
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

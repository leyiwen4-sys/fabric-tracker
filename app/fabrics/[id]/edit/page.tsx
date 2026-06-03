import { getFabricById } from '@/lib/fabrics'
import { notFound } from 'next/navigation'
import FabricForm from '@/components/FabricForm'

export const dynamic = 'force-dynamic'

export default function EditFabricPage({ params }: { params: { id: string } }) {
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
        <a href={`/fabrics/${fabric.id}`} style={{ fontSize: '18px' }}>←</a>
        <span style={{ fontSize: '17px', fontWeight: 600 }}>编辑布料</span>
      </header>
      <FabricForm fabric={fabric} />
    </div>
  )
}

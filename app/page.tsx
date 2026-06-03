import { getAllFabrics } from '@/lib/fabrics'
import FabricCard from '@/components/FabricCard'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function HomePage() {
  const fabrics = getAllFabrics()

  return (
    <div>
      <header style={{
        padding: '12px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'var(--color-white)',
        borderBottom: '1px solid var(--color-border)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <span style={{ fontSize: '18px', fontWeight: 700 }}>🧵 我的布料</span>
        <span style={{
          background: 'var(--color-primary-light)',
          padding: '4px 10px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 600,
        }}>
          {fabrics.length}
        </span>
      </header>

      <main style={{ padding: '8px 12px' }}>
        {fabrics.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '80px 20px',
            color: 'var(--color-text-secondary)',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🧶</div>
            <p style={{ fontSize: '15px' }}>还没有记录布料</p>
            <p style={{ fontSize: '13px', marginTop: '4px' }}>点击下方按钮添加第一块布料吧</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
          }}>
            {fabrics.map((fabric) => (
              <FabricCard key={fabric.id} fabric={fabric} />
            ))}
          </div>
        )}
      </main>

      <Link
        href="/fabrics/new"
        style={{
          position: 'fixed',
          right: 'max(16px, calc((100vw - 480px) / 2 + 16px))',
          bottom: '24px',
          width: '48px',
          height: '48px',
          background: 'var(--color-primary)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: '24px',
          boxShadow: 'var(--shadow-fab)',
          zIndex: 100,
        }}
        aria-label="添加布料"
      >
        +
      </Link>
    </div>
  )
}

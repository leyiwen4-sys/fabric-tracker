import FabricForm from '@/components/FabricForm'

export default function NewFabricPage() {
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
        <span style={{ fontSize: '17px', fontWeight: 600 }}>添加布料</span>
      </header>
      <FabricForm />
    </div>
  )
}

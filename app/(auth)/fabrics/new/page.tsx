import FabricForm from '@/components/FabricForm'
import BackHeader from '@/components/BackHeader'

export default function NewFabricPage() {
  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--color-paper)' }}>
      <div style={{ flexShrink: 0 }}>
        <BackHeader title="添加布料" href="/" />
      </div>
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        <FabricForm />
      </div>
    </div>
  )
}

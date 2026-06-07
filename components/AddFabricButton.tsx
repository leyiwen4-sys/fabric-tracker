'use client'

import { useRouter } from 'next/navigation'
import { Button, Icon } from 'animal-island-ui'

export default function AddFabricButton() {
  const router = useRouter()

  return (
    <div
      style={{
        position: 'fixed',
        right: 'max(16px, calc((100vw - 480px) / 2 + 16px))',
        bottom: '24px',
        zIndex: 100,
      }}
    >
      <Button
        type="dashed"
        size="large"
        onClick={() => router.push('/fabrics/new')}
        aria-label="添加布料"
        icon={<Icon item={481} size={22} />}
        style={{ borderRadius: '50%', width: 48, height: 48, padding: 0 }}
      />
    </div>
  )
}

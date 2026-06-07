'use client'

import { Typewriter } from 'animal-island-ui'

export default function EmptyState() {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-text-secondary)' }}>
      <img src="/item-432.png" alt="" style={{ width: 64, height: 64, marginBottom: '12px' }} />
      <Typewriter speed={60}>
        <p style={{ fontSize: '15px', margin: '0 0 4px' }}>还没有记录布料</p>
        <p style={{ fontSize: '13px', margin: 0 }}>
          点击下方按钮添加第一块布料吧
        </p>
      </Typewriter>
    </div>
  )
}

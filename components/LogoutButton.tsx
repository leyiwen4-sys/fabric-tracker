'use client'

import { useRouter } from 'next/navigation'

export default function LogoutButton({ email }: { email: string }) {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span
        style={{
          fontSize: '11px',
          color: 'var(--color-text-secondary)',
          maxWidth: '120px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {email}
      </span>
      <button
        type="button"
        onClick={handleLogout}
        style={{
          fontSize: '11px',
          color: 'var(--color-text-secondary)',
          background: 'none',
          border: '1px solid #ddd',
          borderRadius: '6px',
          padding: '3px 8px',
          cursor: 'pointer',
        }}
      >
        退出
      </button>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Icon, Modal } from 'animal-island-ui'

export default function LogoutButton() {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <>
      <Button
        type="primary"
        size="small"
        icon={<Icon item={474} size={16} />}
        onClick={() => setShowConfirm(true)}
      >
        退出
      </Button>

      <Modal
        open={showConfirm}
        title="确认退出"
        onClose={() => setShowConfirm(false)}
        typewriter={false}
        footer={
          <>
            <Button type="primary" onClick={() => setShowConfirm(false)}>再待一会~</Button>
            <Button type="primary" onClick={handleLogout}>嗯，退出</Button>
          </>
        }
      >
        现在就要退出布记岛了吗~
      </Modal>
    </>
  )
}

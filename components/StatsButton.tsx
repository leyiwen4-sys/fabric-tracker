'use client'

import { useRouter } from 'next/navigation'
import { Button, Icon } from 'animal-island-ui'

export default function StatsButton() {
  const router = useRouter()

  return (
    <Button
      type="primary"
      size="small"
      icon={<Icon item={461} size={16} />}
      onClick={() => router.push('/stats')}
    >
      统计
    </Button>
  )
}

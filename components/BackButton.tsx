'use client'

import { useRouter } from 'next/navigation'
import { Button, Icon } from 'animal-island-ui'

interface Props {
  href: string
}

export default function BackButton({ href }: Props) {
  const router = useRouter()

  return (
    <Button
      type="primary"
      size="small"
      icon={<Icon name="icon-helicopter" size={16} />}
      onClick={() => router.push(href)}
    >
      返回
    </Button>
  )
}

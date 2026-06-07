'use client'

import { Title } from 'animal-island-ui'
import BackButton from '@/components/BackButton'

interface Props {
  title: string
  href?: string
}

export default function BackHeader({ title, href }: Props) {
  return (
    <header
      style={{
        padding: '14px 16px 10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      <div style={{ position: 'absolute', left: 16 }}>
        <BackButton href={href || '/'} />
      </div>
      <Title size="middle" color="app-red">{title}</Title>
    </header>
  )
}

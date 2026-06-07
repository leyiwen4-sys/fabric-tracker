'use client'

import { Button } from 'animal-island-ui'

interface Props {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export default function Pagination({ page, totalPages, onPageChange }: Props) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '12px',
      padding: '16px 0',
    }}>
      <Button
        type="default"
        size="small"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        ← 上一页
      </Button>
      <span style={{ fontSize: '13px', color: 'var(--color-ink-2)' }}>
        {page} / {totalPages}
      </span>
      <Button
        type="default"
        size="small"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        下一页 →
      </Button>
    </div>
  )
}

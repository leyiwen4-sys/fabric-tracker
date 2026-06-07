'use client'

import { useState } from 'react'
import type { Fabric } from '@/lib/fabrics'
import FabricCard from '@/components/FabricCard'
import Pagination from '@/components/Pagination'
import EmptyState from '@/components/EmptyState'
import { Card } from 'animal-island-ui'

const PAGE_SIZE = 6

export default function FabricList({ fabrics }: { fabrics: Fabric[] }) {
  const [page, setPage] = useState(1)
  const totalPages = Math.ceil(fabrics.length / PAGE_SIZE)
  const start = (page - 1) * PAGE_SIZE
  const pageItems = fabrics.slice(start, start + PAGE_SIZE)

  if (fabrics.length === 0) {
    return (
      <Card style={{ background: 'transparent' }}>
        <EmptyState />
      </Card>
    )
  }

  return (
    <>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px',
      }}>
        {pageItems.map((fabric) => (
          <FabricCard key={fabric.id} fabric={fabric} />
        ))}
      </div>
      <div style={{
        position: 'sticky',
        bottom: 0,
        background: 'var(--color-paper)',
        paddingTop: 8,
      }}>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </>
  )
}


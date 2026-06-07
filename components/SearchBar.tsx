'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Input } from 'animal-island-ui'

export default function SearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(searchParams.get('search') || '')

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set('search', value)
      } else {
        params.delete('search')
      }
      router.replace(`/?${params.toString()}`)
    }, 300)

    return () => clearTimeout(timeout)
  }, [value])  // eslint-disable-line

  return (
    <div style={{ padding: '8px 12px' }}>
      <Input
        placeholder="🔍 搜索布料名称、店铺..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        allowClear
        shadow
      />
    </div>
  )
}

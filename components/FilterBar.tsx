'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { Input, Select, Button } from 'animal-island-ui'

const STATUS_OPTIONS = [
  { key: '', label: '全部状态' },
  { key: 'idle', label: '闲置中~' },
  { key: 'used', label: '用掉一点啦~' },
  { key: 'empty', label: '已经用完啦！' },
]

const SORT_OPTIONS = [
  { key: 'created_at_desc', label: '最新添加' },
  { key: 'created_at_asc', label: '最早添加' },
  { key: 'purchase_date_desc', label: '最近购买' },
  { key: 'purchase_date_asc', label: '最早购买' },
  { key: 'price_desc', label: '价格从高到低' },
  { key: 'price_asc', label: '价格从低到高' },
]

export default function FilterBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const searchParamsRef = useRef(searchParams)
  searchParamsRef.current = searchParams

  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [type, setType] = useState(searchParams.get('type') || '')
  const [status, setStatus] = useState(searchParams.get('status') || '')
  const [sort, setSort] = useState(searchParams.get('sort') || 'created_at_desc')
  const [openPanel, setOpenPanel] = useState<'filter' | 'sort' | null>(null)
  const [typeOptions, setTypeOptions] = useState<{ key: string; label: string }[]>([{ key: '', label: '全部类型' }])

  // 从 stats API 获取用户实际使用的布料类型
  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(json => {
        if (json.success && json.data?.byType) {
          const types: string[] = json.data.byType.map((t: { type: string }) => t.type)
          setTypeOptions([
            { key: '', label: '全部类型' },
            ...types.map(t => ({ key: t, label: t })),
          ])
        }
      })
      .catch(() => {})
  }, [])

  // 外部 URL 变更时同步
  useEffect(() => {
    setSearch(searchParams.get('search') || '')
    setType(searchParams.get('type') || '')
    setStatus(searchParams.get('status') || '')
    setSort(searchParams.get('sort') || 'created_at_desc')
  }, [searchParams])

  function applyParams(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParamsRef.current.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value && value !== '') {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    }
    router.replace(`/?${params.toString()}`)
  }

  // 搜索：300ms 防抖
  useEffect(() => {
    const timeout = setTimeout(() => {
      applyParams({ search: search || undefined })
    }, 300)
    return () => clearTimeout(timeout)
  }, [search])

  const handleTypeChange = (v: string) => {
    setType(v)
    applyParams({ type: v || undefined })
  }
  const handleStatusChange = (v: string) => {
    setStatus(v)
    applyParams({ status: v || undefined })
  }
  const handleSortChange = (v: string) => {
    setSort(v)
    applyParams({ sort: v === 'created_at_desc' ? undefined : v })
  }

  // 激活摘要
  const activeParts: string[] = []
  if (type) activeParts.push(typeOptions.find(o => o.key === type)?.label || type)
  if (status) activeParts.push(STATUS_OPTIONS.find(o => o.key === status)?.label || status)
  if (sort !== 'created_at_desc') activeParts.push(SORT_OPTIONS.find(o => o.key === sort)?.label || sort)
  const hasActive = type || status || sort !== 'created_at_desc'

  return (
    <div style={{ padding: '8px 12px 4px' }}>
      {/* 第一行：搜索栏 */}
      <Input
        placeholder="🔍 搜索布料名称、店铺..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        allowClear
        shadow
      />

      {/* 第二行：筛选 + 排序按钮 */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
        <Button
          size="small"
          type={openPanel === 'filter' ? 'primary' : 'default'}
          onClick={() => setOpenPanel(openPanel === 'filter' ? null : 'filter')}
        >
          📋 筛选{(type || status) ? ' ·' : ''}
        </Button>
        <Button
          size="small"
          type={openPanel === 'sort' ? 'primary' : 'default'}
          onClick={() => setOpenPanel(openPanel === 'sort' ? null : 'sort')}
        >
          📊 排序{sort !== 'created_at_desc' ? ' ·' : ''}
        </Button>
      </div>

      {/* 展开面板 */}
      {openPanel === 'filter' && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <div style={{ flex: 1 }}>
            <Select value={type} onChange={handleTypeChange} options={typeOptions} />
          </div>
          <div style={{ flex: 1 }}>
            <Select value={status} onChange={handleStatusChange} options={STATUS_OPTIONS} />
          </div>
        </div>
      )}
      {openPanel === 'sort' && (
        <div style={{ marginTop: '8px' }}>
          <Select value={sort} onChange={handleSortChange} options={SORT_OPTIONS} />
        </div>
      )}

      {/* 激活摘要 */}
      {hasActive && (
        <div
          style={{
            padding: '4px 0 0',
            fontSize: '12px',
            color: 'var(--animal-text-color-secondary)',
            textAlign: 'center',
          }}
        >
          {activeParts.join(' · ')}
        </div>
      )}
    </div>
  )
}

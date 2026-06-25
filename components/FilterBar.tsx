'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { Input, Select, Tabs } from 'animal-island-ui'
import type { TabItem } from 'animal-island-ui'

const TYPE_OPTIONS = [
  { key: '', label: '全部类型' },
  { key: '棉', label: '棉' },
  { key: '麻', label: '麻' },
  { key: '丝', label: '丝' },
  { key: '毛', label: '毛' },
  { key: '化纤', label: '化纤' },
  { key: '混纺', label: '混纺' },
  { key: '其他', label: '其他' },
]

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

  // 外部 URL 变更时同步状态（浏览器前进/后退）
  useEffect(() => {
    setSearch(searchParams.get('search') || '')
    setType(searchParams.get('type') || '')
    setStatus(searchParams.get('status') || '')
    setSort(searchParams.get('sort') || 'created_at_desc')
  }, [searchParams])

  // 将更新写入 URL（用 ref 读取最新 searchParams，避免闭包过期）
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

  // 筛选/排序：立即更新
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

  // 当前筛选摘要
  const activeFilters: string[] = []
  if (type) activeFilters.push(TYPE_OPTIONS.find(o => o.key === type)?.label || type)
  if (status) activeFilters.push(STATUS_OPTIONS.find(o => o.key === status)?.label || status)
  if (sort !== 'created_at_desc') activeFilters.push(SORT_OPTIONS.find(o => o.key === sort)?.label || sort)

  const tabItems: TabItem[] = [
    {
      key: 'search',
      label: '🔍 搜索',
      children: (
        <div style={{ padding: '8px 0' }}>
          <Input
            placeholder="🔍 搜索布料名称、店铺..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            shadow
          />
        </div>
      ),
    },
    {
      key: 'filter',
      label: '📋 筛选',
      children: (
        <div style={{ padding: '8px 0', display: 'flex', gap: '8px' }}>
          <div style={{ flex: 1 }}>
            <Select value={type} onChange={handleTypeChange} options={TYPE_OPTIONS} />
          </div>
          <div style={{ flex: 1 }}>
            <Select value={status} onChange={handleStatusChange} options={STATUS_OPTIONS} />
          </div>
        </div>
      ),
    },
    {
      key: 'sort',
      label: '📊 排序',
      children: (
        <div style={{ padding: '8px 0' }}>
          <Select value={sort} onChange={handleSortChange} options={SORT_OPTIONS} />
        </div>
      ),
    },
  ]

  return (
    <div style={{ padding: '0 12px 4px' }}>
      <Tabs items={tabItems} defaultActiveKey="search" shadow />
      {activeFilters.length > 0 && (
        <div
          style={{
            padding: '0 0 4px',
            fontSize: '12px',
            color: 'var(--animal-text-color-secondary)',
            textAlign: 'center',
          }}
        >
          {activeFilters.join(' · ')}
        </div>
      )}
    </div>
  )
}

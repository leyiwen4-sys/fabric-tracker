'use client'

import { Tabs, Table } from 'animal-island-ui'
import type { TabItem } from 'animal-island-ui'

interface StatsData {
  type: { name: string; count: number }[]
  status: { name: string; count: number }[]
  store: { name: string; count: number }[]
}

export default function StatsTabs({ data, total }: { data: StatsData; total: number }) {
  const columns = [
    { title: '名称', dataIndex: 'name' as const, width: '55%' },
    { title: '数量', dataIndex: 'count' as const, align: 'center' as const },
    {
      title: '占比',
      dataIndex: 'count' as const,
      align: 'center' as const,
      render: (v: unknown) => `${total > 0 ? Math.round((Number(v) / total) * 100) : 0}%`,
    },
  ]

  const items: TabItem[] = [
    {
      key: 'type',
      label: '类型',
      children: (
        <Table
          columns={columns}
          dataSource={data.type.map(t => ({ name: t.name, count: t.count }))}
          rowKey="name"
        />
      ),
    },
    {
      key: 'status',
      label: '状态',
      children: (
        <Table
          columns={columns}
          dataSource={data.status.map(s => ({ name: s.name, count: s.count }))}
          rowKey="name"
        />
      ),
    },
    {
      key: 'store',
      label: '店铺',
      children: (
        <Table
          columns={columns}
          dataSource={data.store.map(s => ({ name: s.name, count: s.count }))}
          rowKey="name"
        />
      ),
    },
  ]

  return (
    <>
      <style>{`
        .animal-tabLabel-bCauA { color: #6b3a1f !important; }
        .animal-tabItem-Ehph4.animal-active-AoX4Y .animal-tabLabel-bCauA { color: #6b3a1f !important; }
        .animal-tabItem-Ehph4:hover .animal-tabLabel-bCauA { color: #6b3a1f !important; }
        .animal-tabItem-Ehph4.animal-active-AoX4Y { background: #f7cd67 !important; }
        .animal-tabItem-Ehph4:hover { background: rgba(247,205,103,0.15) !important; }
        .animal-active-shadow-vEKIu { box-shadow: none !important; }
        .animal-row-iDOMw:hover { background: transparent !important; }
        .animal-striped-8Ih-N:hover { background-image: none !important; background: rgba(247,205,103,0.08) !important; }
      `}</style>
      <Tabs items={items} defaultActiveKey="type" />
    </>
  )
}

# 布料首页筛选与排序 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 在布料首页搜索栏位置增加三标签切换式 UI（搜索/筛选/排序），修复 sort 参数被忽略的 bug。

**架构：** FilterBar 客户端组件用 Tabs 承载搜索/筛选/排序内容，通过 URL 查询参数（search/type/status/sort）驱动数据获取。page.tsx 读取全部参数传给 API → getAllFabrics 执行筛选+排序 → 返回结果。

**技术栈：** Next.js 16 App Router、React 19、animal-island-ui (Tabs/Input/Select)、Turso SQLite

---

### 任务 1：修复 getAllFabrics — sort 参数 + status 筛选

**文件：**
- 修改：`lib/fabrics.ts:23-45`

- [ ] **步骤 1：修改 getAllFabrics 签名，增加 status 参数，实现排序逻辑**

```typescript
export async function getAllFabrics(
  userId: number,
  options?: { type?: string; search?: string; sort?: string; status?: string }
): Promise<Fabric[]> {
  await ensureSchema()
  let sql = 'SELECT * FROM fabrics WHERE user_id = ?'
  const params: unknown[] = [userId]

  if (options?.type) {
    sql += ' AND type = ?'
    params.push(options.type)
  }
  if (options?.status) {
    sql += ' AND status = ?'
    params.push(options.status)
  }
  if (options?.search) {
    const q = `%${options.search}%`
    sql += ' AND (name LIKE ? OR store LIKE ? OR notes LIKE ?)'
    params.push(q, q, q)
  }

  // 根据 sort 参数拼接 ORDER BY
  switch (options?.sort) {
    case 'created_at_asc':
      sql += ' ORDER BY created_at ASC, id ASC'
      break
    case 'purchase_date_desc':
      sql += ' ORDER BY purchase_date DESC, id DESC'
      break
    case 'purchase_date_asc':
      sql += ' ORDER BY purchase_date ASC, id ASC'
      break
    case 'price_desc':
      sql += ' ORDER BY price DESC, id DESC'
      break
    case 'price_asc':
      sql += ' ORDER BY price ASC, id ASC'
      break
    default: // created_at_desc
      sql += ' ORDER BY created_at DESC, id DESC'
  }

  const result = await execute(sql, params)
  return rowsToObjects<Fabric>(result.columns, result.rows)
}
```

- [ ] **步骤 2：TypeScript 编译检查**

```bash
npx tsc --noEmit --pretty 2>&1 | grep -E "fabrics\.ts.*error" | head -5
```

预期：无输出（无错误）

- [ ] **步骤 3：Commit**

```bash
git add lib/fabrics.ts
git commit -m "fix: implement sort parameter and add status filter in getAllFabrics"
```

---

### 任务 2：更新 API 路由 — 读取 status 参数

**文件：**
- 修改：`app/api/fabrics/route.ts:12-16`

- [ ] **步骤 1：在 GET 中读取 status 参数**

当前代码（第 13-17 行）：
```typescript
const type = searchParams.get('type') || undefined
const search = searchParams.get('search') || undefined
const sort = searchParams.get('sort') || 'created_at_desc'
const fabrics = await getAllFabrics(userId, { type, search, sort })
```

替换为：
```typescript
const type = searchParams.get('type') || undefined
const status = searchParams.get('status') || undefined
const search = searchParams.get('search') || undefined
const sort = searchParams.get('sort') || 'created_at_desc'
const fabrics = await getAllFabrics(userId, { type, status, search, sort })
```

- [ ] **步骤 2：Commit**

```bash
git add app/api/fabrics/route.ts
git commit -m "feat: pass status param from API route to getAllFabrics"
```

---

### 任务 3：更新首页 — 读取全部筛选参数

**文件：**
- 修改：`app/(auth)/page.tsx:14-28`

- [ ] **步骤 1：读取 type/status/sort 参数并传给 getAllFabrics**

当前代码（第 24-25 行）：
```typescript
const { search } = await searchParams
const fabrics = userId ? await getAllFabrics(userId, { search }) : []
```

替换为：
```typescript
const { search, type, status, sort } = await searchParams
const fabrics = userId
  ? await getAllFabrics(userId, { search, type, status, sort } as any)
  : []
```

说明：`searchParams` 的所有值都是 `string | undefined`，而 `getAllFabrics` 的 options 期望 `string | undefined`，类型天然匹配。`as any` 是由于 Next.js 的 searchParams 类型定义较宽泛。

- [ ] **步骤 2：确认 searchParams 类型正确**

`searchParams` 是 `Promise<{ [key: string]: string | string[] | undefined }>`，解构出的 `search`/`type`/`status`/`sort` 都是 `string | string[] | undefined`。作为查询参数传入 `getAllFabrics` 需要 `as any` 绕过类型差异（运行时实际值都是 string）。

- [ ] **步骤 3：Commit**

```bash
git add app/\(auth\)/page.tsx
git commit -m "feat: pass type/status/sort params from homepage to API"
```

---

### 任务 4：创建 FilterBar 组件（取代 SearchBar）

**文件：**
- 创建：`components/FilterBar.tsx`
- 删除：`components/SearchBar.tsx`
- 修改：`app/(auth)/page.tsx`（import 改为 FilterBar）

- [ ] **步骤 1：创建 FilterBar.tsx**

```tsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
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

  // 从 URL 参数初始化状态
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [type, setType] = useState(searchParams.get('type') || '')
  const [status, setStatus] = useState(searchParams.get('status') || '')
  const [sort, setSort] = useState(searchParams.get('sort') || 'created_at_desc')

  // 防抖更新 URL
  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value && value !== '') {
          params.set(key, value)
        } else {
          params.delete(key)
        }
      }
      router.replace(`/?${params.toString()}`)
    },
    [searchParams, router]
  )

  // 搜索：300ms 防抖
  useEffect(() => {
    const timeout = setTimeout(() => {
      updateParams({ search: search || undefined })
    }, 300)
    return () => clearTimeout(timeout)
  }, [search])

  // 筛选/排序：立即更新
  const handleTypeChange = (v: string) => {
    setType(v)
    updateParams({ type: v || undefined })
  }
  const handleStatusChange = (v: string) => {
    setStatus(v)
    updateParams({ status: v || undefined })
  }
  const handleSortChange = (v: string) => {
    setSort(v)
    updateParams({ sort: v === 'created_at_desc' ? undefined : v })
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
```

- [ ] **步骤 2：更新 page.tsx 的 import**

```typescript
// 替换
import SearchBar from '@/components/SearchBar'
// 为
import FilterBar from '@/components/FilterBar'
```

以及 JSX 中 `<SearchBar />` 改为 `<FilterBar />`

- [ ] **步骤 3：删除旧 SearchBar.tsx**

```bash
rm components/SearchBar.tsx
```

- [ ] **步骤 4：TypeScript 编译检查**

```bash
npx tsc --noEmit --pretty 2>&1 | grep -E "FilterBar|page\.tsx" | head -10
```

预期：无输出（无错误）

- [ ] **步骤 5：Commit**

```bash
git add components/FilterBar.tsx app/\(auth\)/page.tsx
git rm components/SearchBar.tsx
git commit -m "feat: replace SearchBar with FilterBar (search/filter/sort tabs)"
```

---

### 任务 5：功能验证

- [ ] **步骤 1：启动 dev server 并测试搜索**

```bash
# 启动服务器
npx next dev --port 3456

# 测试：搜索功能仍然正常
curl -s "http://localhost:3456/api/fabrics?search=测试" -b /tmp/cookies.txt
```

预期：返回匹配的布料列表

- [ ] **步骤 2：测试类型筛选**

```bash
curl -s "http://localhost:3456/api/fabrics?type=棉" -b /tmp/cookies.txt
```

预期：只返回 type="棉" 的布料

- [ ] **步骤 3：测试状态筛选**

```bash
curl -s "http://localhost:3456/api/fabrics?status=idle" -b /tmp/cookies.txt
```

预期：只返回 status="idle" 的布料

- [ ] **步骤 4：测试排序**

```bash
# 价格从低到高
curl -s "http://localhost:3456/api/fabrics?sort=price_asc" -b /tmp/cookies.txt

# 价格从高到低
curl -s "http://localhost:3456/api/fabrics?sort=price_desc" -b /tmp/cookies.txt
```

预期：按指定排序返回结果

- [ ] **步骤 5：测试组合筛选+排序**

```bash
curl -s "http://localhost:3456/api/fabrics?type=丝&status=idle&sort=price_asc" -b /tmp/cookies.txt
```

预期：同时满足类型、状态筛选，按价格从低到高排列

- [ ] **步骤 6：打开首页验证 UI**

```bash
# 浏览器打开 http://localhost:3456
# 验证：
# - 搜索栏变成三标签切换（搜索/筛选/排序）
# - 搜索标签下输入框正常工作
# - 筛选标签下类型+状态下拉正常工作
# - 排序标签下排序下拉正常工作
# - 标签切换不丢失其他参数
# - 筛选激活时显示摘要小灰字
# - 浏览器后退恢复上次筛选状态
```

---

### 任务 6：最终 Commit

- [ ] **步骤 1：确认所有变更**

```bash
git status
git diff --stat
```

- [ ] **步骤 2：Commit**

```bash
git add -A
git commit -m "feat: add filter and sort to fabric homepage with tabbed UI"
```

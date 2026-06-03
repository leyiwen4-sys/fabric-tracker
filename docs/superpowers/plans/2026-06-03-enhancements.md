# 四个增强功能 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 为布料记录工具添加搜索、统计面板、用途状态标记、多图支持四个增强功能。

**架构：** fabrics 表新增 status 和 photos 列；搜索使用 SQL LIKE 实时过滤；统计通过聚合查询；状态可点击切换；多图用 JSON 数组存储，最多 3 张。

**技术栈：** Next.js 16, SQLite (better-sqlite3), TypeScript

---

## 文件结构

```
新建：
app/(auth)/stats/page.tsx                  # 统计页
app/api/stats/route.ts                      # 统计 API
components/SearchBar.tsx                    # 搜索栏组件
components/StatusBadge.tsx                  # 状态角标组件

修改：
lib/db.ts                                   # 加 status 和 photos 列
lib/fabrics.ts                              # 更新接口和查询
app/api/fabrics/route.ts                    # 搜索参数 + 多图上传
app/api/fabrics/[id]/route.ts               # 多图更新
app/(auth)/page.tsx                         # 加搜索栏
app/(auth)/layout.tsx                       # header 加统计入口
components/FabricCard.tsx                   # 加状态角标
components/FabricCard.module.css            # 状态角标样式
components/FabricDetail.tsx                 # 多图切换 + 状态点击
components/FabricDetail.module.css          # 缩略图样式
components/FabricForm.tsx                   # 多图上传 + 状态选择
components/FabricForm.module.css            # 多图预览样式
tests/lib/fabrics.test.ts                   # 适配新字段
tests/api/fabrics.test.ts                   # 搜索/多图测试
tests/api/stats.test.ts                     # 统计 API 测试
```

---

### 任务 1：Schema 迁移

**文件：** 修改 `lib/db.ts`

- [ ] **步骤 1：新增 status 和 photos 列**

在 `lib/db.ts` 的 `initSchema` 中添加 migration 逻辑。在 fabrics 表的 `CREATE TABLE IF NOT EXISTS` 之前检查旧列：

```typescript
function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )

    CREATE TABLE IF NOT EXISTS fabrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      width REAL,
      unit TEXT NOT NULL,
      price REAL,
      store TEXT,
      purchase_date TEXT,
      photo_path TEXT,
      photos TEXT DEFAULT '[]',
      status TEXT DEFAULT 'idle',
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  // Migration: add missing columns for older DBs
  const cols = db.prepare("PRAGMA table_info('fabrics')").all() as any[]
  const colNames = cols.map((c: any) => c.name)
  if (!colNames.includes('status')) {
    db.exec("ALTER TABLE fabrics ADD COLUMN status TEXT DEFAULT 'idle'")
  }
  if (!colNames.includes('photos')) {
    db.exec("ALTER TABLE fabrics ADD COLUMN photos TEXT DEFAULT '[]'")
  }
}
```

- [ ] **步骤 2：运行测试确认 schema 兼容**

```bash
npx vitest run tests/lib/
```

预期：fabrics 测试通过（新列有默认值，不影响现有测试）

- [ ] **步骤 3：Commit**

```bash
git add lib/db.ts
git commit -m "feat: add status and photos columns to fabrics schema"
```

---

### 任务 2：更新 fabrics CRUD 和类型

**文件：**
- 修改：`lib/fabrics.ts` — Fabric 接口加 `status` 和 `photos` 字段
- 修改：`tests/lib/fabrics.test.ts` — 适配新字段

- [ ] **步骤 1：更新 Fabric 接口和 CRUD**

`Fabric` 接口新增：

```typescript
export interface Fabric {
  id: number
  user_id: number
  name: string
  type: string
  width: number | null
  unit: string
  price: number | null
  store: string | null
  purchase_date: string | null
  photo_path: string | null
  photos: string  // JSON array, e.g. '["/uploads/a.jpg"]'
  status: string  // 'idle' | 'used' | 'empty'
  notes: string | null
  created_at: string
  updated_at: string
}
```

`createFabric` 的 INSERT 语句加 `photos` 和 `status` 列：

```typescript
export function createFabric(data: FabricInput): Fabric {
  const db = getDb()
  const stmt = db.prepare(`
    INSERT INTO fabrics (user_id, name, type, width, unit, price, store, purchase_date, photo_path, photos, status, notes)
    VALUES (@user_id, @name, @type, @width, @unit, @price, @store, @purchase_date, @photo_path, @photos, @status, @notes)
  `)
  const result = stmt.run(data)
  return getFabricById(result.lastInsertRowid as number, data.user_id)!
}
```

`updateFabric` 的 UPDATE 语句也加 `photos` 和 `status` 列。

`getAllFabrics` 新增 `search` 参数：

```typescript
export function getAllFabrics(
  userId: number,
  options?: {
    type?: string
    search?: string
    sort?: string
  }
): Fabric[] {
  const db = getDb()
  let sql = 'SELECT * FROM fabrics WHERE user_id = ?'
  const params: any[] = [userId]

  if (options?.type) {
    sql += ' AND type = ?'
    params.push(options.type)
  }

  if (options?.search) {
    const q = `%${options.search}%`
    sql += ' AND (name LIKE ? OR store LIKE ? OR notes LIKE ?)'
    params.push(q, q, q)
  }

  sql += ' ORDER BY created_at DESC, id DESC'
  return db.prepare(sql).all(...params) as Fabric[]
}
```

- [ ] **步骤 2：更新测试**

在 `tests/lib/fabrics.test.ts` 的 `sampleFabric` 中加 `photos: '[]'` 和 `status: 'idle'`。

更新 `getAllFabrics` 调用为 `getAllFabrics(userId)` 或 `getAllFabrics(userId, { search: '碎花' })` 等新签名。

- [ ] **步骤 3：运行测试**

```bash
npx vitest run tests/lib/
```

预期：全部通过

- [ ] **步骤 4：Commit**

```bash
git add lib/fabrics.ts tests/lib/fabrics.test.ts
git commit -m "feat: add status, photos, and search fields to fabrics CRUD"
```

---

### 任务 3：搜索功能

**文件：**
- 修改：`app/api/fabrics/route.ts` — GET 加 `search` 参数
- 创建：`components/SearchBar.tsx` — 搜索栏客户端组件
- 修改：`app/(auth)/page.tsx` — header 下方加搜索栏

- [ ] **步骤 1：更新 GET /api/fabrics 支持 search 参数**

修改 `app/api/fabrics/route.ts` 的 GET handler：

```typescript
const { searchParams } = new URL(request.url)
const type = searchParams.get('type') || undefined
const search = searchParams.get('search') || undefined
const sort = searchParams.get('sort') || 'created_at_desc'
const fabrics = getAllFabrics(userId, { type, search, sort })
```

- [ ] **步骤 2：创建 SearchBar 客户端组件**

创建 `components/SearchBar.tsx`：

```typescript
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'  // or simple setTimeout

export default function SearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (term) {
      params.set('search', term)
    } else {
      params.delete('search')
    }
    router.replace(`/?${params.toString()}`)
  }

  return (
    <div style={{ padding: '8px 12px', background: 'var(--color-bg)' }}>
      <input
        type="text"
        placeholder="🔍 搜索布料名称、店铺..."
        defaultValue={searchParams.get('search') || ''}
        onChange={(e) => handleSearch(e.target.value)}
        style={{
          width: '100%',
          padding: '8px 12px',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          fontSize: '14px',
          background: 'var(--color-white)',
        }}
      />
    </div>
  )
}
```

注意：如果没有 `use-debounce`，改用 setTimeout + useEffect 实现防抖（300ms）。

- [ ] **步骤 3：首页集成搜索栏**

修改 `app/(auth)/page.tsx`。由于 page 是 async server component，需要将搜索栏作为客户端组件包裹。

在 header 下方添加：

```typescript
import SearchBar from '@/components/SearchBar'
import { Suspense } from 'react'

// 在 header 和 main 之间：
<Suspense fallback={null}>
  <SearchBar />
</Suspense>
```

同时让 page 读取 searchParams：

```typescript
export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const { search } = await searchParams
  // ... 
  const fabrics = userId ? getAllFabrics(userId, { search }) : []
  // ...
}
```

- [ ] **步骤 4：验证**

`npm run dev`，在搜索栏输入文字，确认列表实时过滤。

- [ ] **步骤 5：Commit**

```bash
git add components/SearchBar.tsx app/(auth)/page.tsx app/api/fabrics/route.ts
git commit -m "feat: add search bar with keyword filtering"
```

---

### 任务 4：统计面板

**文件：**
- 创建：`app/api/stats/route.ts`
- 创建：`app/(auth)/stats/page.tsx`
- 修改：`app/(auth)/layout.tsx`（或 header）— 加 📊 统计入口
- 创建：`tests/api/stats.test.ts`

- [ ] **步骤 1：实现统计 API**

创建 `app/api/stats/route.ts`：

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getCookieName } from '@/lib/auth'
import { getDb } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(getCookieName())?.value
    if (!token) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 })
    }
    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ success: false, error: '登录已过期' }, { status: 401 })
    }

    const db = getDb()
    const userId = payload.userId

    // Total count
    const { count } = db.prepare('SELECT COUNT(*) as count FROM fabrics WHERE user_id = ?').get(userId) as any
    // Total spend
    const { total } = db.prepare('SELECT COALESCE(SUM(price), 0) as total FROM fabrics WHERE user_id = ?').get(userId) as any
    // By type
    const byType = db.prepare(
      'SELECT type, COUNT(*) as count FROM fabrics WHERE user_id = ? GROUP BY type ORDER BY count DESC'
    ).all(userId)
    // By status
    const byStatus = db.prepare(
      'SELECT status, COUNT(*) as count FROM fabrics WHERE user_id = ? GROUP BY status'
    ).all(userId)

    return NextResponse.json({
      success: true,
      data: {
        totalCount: count,
        totalSpend: total,
        byType,
        byStatus,
      },
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: '获取统计失败' }, { status: 500 })
  }
}
```

- [ ] **步骤 2：创建统计页**

创建 `app/(auth)/stats/page.tsx`：

```typescript
import { cookies } from 'next/headers'
import { verifyToken, getCookieName } from '@/lib/auth'
import { getDb } from '@/lib/db'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function StatsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get(getCookieName())?.value
  const payload = token ? await verifyToken(token) : null
  const userId = payload?.userId || 0

  const db = getDb()
  const { count } = db.prepare('SELECT COUNT(*) as count FROM fabrics WHERE user_id = ?').get(userId) as any
  const { total } = db.prepare('SELECT COALESCE(SUM(price), 0) as total FROM fabrics WHERE user_id = ?').get(userId) as any
  const byType = db.prepare('SELECT type, COUNT(*) as count FROM fabrics WHERE user_id = ? GROUP BY type ORDER BY count DESC').all(userId) as any[]
  const byStatus = db.prepare('SELECT status, COUNT(*) as count FROM fabrics WHERE user_id = ? GROUP BY status').all(userId) as any[]

  const maxTypeCount = Math.max(1, ...byType.map((t: any) => t.count))
  const statusMap: Record<string, string> = { idle: '闲置', used: '已用', empty: '已用完' }

  return (
    <div>
      <header style={{
        padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px',
        background: 'var(--color-white)', borderBottom: '1px solid var(--color-border)',
      }}>
        <Link href="/" style={{ fontSize: '18px' }}>←</Link>
        <span style={{ fontSize: '17px', fontWeight: 600 }}>📊 统计</span>
      </header>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
          <div style={{ background: 'var(--color-white)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 700 }}>{count}</div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>📦 总布料数</div>
          </div>
          <div style={{ background: 'var(--color-white)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 700 }}>¥{total || 0}</div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>💰 总花费</div>
          </div>
        </div>

        <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>📊 按类型分布</h3>
        {byType.map((t: any) => (
          <div key={t.type} style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '2px' }}>
              <span>{t.type}</span><span>{t.count} 块</span>
            </div>
            <div style={{ background: '#eee', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
              <div style={{
                background: 'var(--color-primary)',
                height: '100%',
                width: `${(t.count / maxTypeCount) * 100}%`,
                borderRadius: '4px',
              }} />
            </div>
          </div>
        ))}

        <h3 style={{ fontSize: '15px', fontWeight: 600, margin: '20px 0 12px' }}>📋 按状态分布</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          {byStatus.map((s: any) => (
            <div key={s.status} style={{
              background: 'var(--color-white)', borderRadius: '10px', padding: '12px', textAlign: 'center',
            }}>
              <div style={{ fontSize: '22px', fontWeight: 600 }}>{s.count}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{statusMap[s.status] || s.status}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **步骤 3：首页 header 加统计入口**

修改 `app/(auth)/page.tsx` 的 header，在计数 badge 旁边加一个统计链接：

```typescript
<Link href="/stats" style={{
  background: 'var(--color-primary-light)',
  padding: '4px 8px',
  borderRadius: '12px',
  fontSize: '12px',
  fontWeight: 600,
  marginLeft: '4px',
}}>
  📊
</Link>
```

- [ ] **步骤 4：创建统计测试**

创建 `tests/api/stats.test.ts`：

```typescript
// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { GET } from '@/app/api/stats/route'
import { getDb } from '@/lib/db'
import { signToken } from '@/lib/auth'
import { NextRequest } from 'next/server'

let token: string

beforeAll(async () => {
  const db = getDb()
  db.prepare('INSERT OR IGNORE INTO users (id, email, password_hash) VALUES (99, ?, ?)').run('stats@test.com', 'hash')
  token = await signToken({ userId: 99, email: 'stats@test.com' })
})

afterAll(() => {
  const db = getDb()
  db.exec('DELETE FROM fabrics WHERE user_id = 99')
  db.exec('DELETE FROM users WHERE id = 99')
})

describe('GET /api/stats', () => {
  it('should return stats for current user', async () => {
    const req = new NextRequest('http://localhost/api/stats')
    req.cookies.set('token', token)
    const res = await GET(req)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data).toHaveProperty('totalCount')
    expect(json.data).toHaveProperty('totalSpend')
    expect(json.data).toHaveProperty('byType')
    expect(json.data).toHaveProperty('byStatus')
  })

  it('should return 401 without auth', async () => {
    const req = new NextRequest('http://localhost/api/stats')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })
})
```

- [ ] **步骤 5：运行测试**

```bash
npx vitest run tests/api/stats.test.ts
```

- [ ] **步骤 6：Commit**

```bash
git add app/api/stats/route.ts app/\(auth\)/stats/page.tsx app/\(auth\)/page.tsx tests/api/stats.test.ts
git commit -m "feat: add stats panel with API and page"
```

---

### 任务 5：用途状态标记

**文件：**
- 修改：`components/FabricDetail.tsx` — 状态标签可点击切换
- 修改：`components/FabricCard.tsx` — 右上角状态角标
- 修改：`components/FabricCard.module.css` — 角标样式
- 修改：`components/FabricForm.tsx` — 状态选择

- [ ] **步骤 1：状态标签切换（FabricDetail）**

在 `FabricDetail.tsx` 中添加状态切换功能。在 tags 区域加状态标签，点击调用 API 切换。

```typescript
async function toggleStatus() {
  const statuses = ['idle', 'used', 'empty']
  const currentIndex = statuses.indexOf(fabric.status || 'idle')
  const nextStatus = statuses[(currentIndex + 1) % 3]

  try {
    const res = await fetch(`/api/fabrics/${fabric.id}`, {
      method: 'PUT',
      body: (() => {
        const fd = new FormData()
        fd.append('status', nextStatus)
        return fd
      })(),
    })
    const json = await res.json()
    if (json.success) {
      window.location.reload()
    }
  } catch {
    showToast('状态更新失败', 'error')
  }
}
```

在 tags 区域的状态标签使用 `onClick={toggleStatus}`，样式加 `cursor: pointer`。

```typescript
const statusLabels: Record<string, string> = { idle: '🟢 闲置', used: '🟡 已用', empty: '⚪ 已用完' }
// ...
<span className={styles.tag} onClick={toggleStatus} style={{ cursor: 'pointer' }}>
  {statusLabels[fabric.status || 'idle']}
</span>
```

- [ ] **步骤 2：状态角标（FabricCard）**

在 `FabricCard.tsx` 卡片右上角加状态小圆点：

```typescript
const statusColors: Record<string, string> = {
  idle: '#27ae60',
  used: '#f39c12',
  empty: '#999999',
}
```

在 `.card` 内添加角标 div：

```typescript
<div style={{
  position: 'absolute',
  top: '6px',
  right: '6px',
  width: '10px',
  height: '10px',
  borderRadius: '50%',
  background: statusColors[fabric.status || 'idle'],
}} />
```

注意：`.card` 需要加 `position: relative`。

- [ ] **步骤 3：表单状态选择（FabricForm）**

在 `FabricForm.tsx` 的表单 fieldGroup 末尾加状态选择：

```typescript
<div className={styles.field}>
  <label className={styles.label}>使用状态</label>
  <select className={styles.input} name="status" defaultValue={fabric?.status || 'idle'}>
    <option value="idle">🟢 闲置</option>
    <option value="used">🟡 已用</option>
    <option value="empty">⚪ 已用完</option>
  </select>
</div>
```

- [ ] **步骤 4：验证**

`npm run dev` 确认：
- 详情页状态标签点击可循环切换
- 首页卡片有状态圆点
- 表单可设置状态

- [ ] **步骤 5：Commit**

```bash
git add components/FabricDetail.tsx components/FabricCard.tsx components/FabricCard.module.css components/FabricForm.tsx
git commit -m "feat: add fabric status tags (idle/used/empty) with toggle"
```

---

### 任务 6：多图支持

**文件：**
- 修改：`app/api/fabrics/route.ts`（POST）— 接受多图
- 修改：`app/api/fabrics/[id]/route.ts`（PUT）— 接受多图
- 修改：`components/FabricForm.tsx` — 多选上传 + 预览
- 修改：`components/FabricForm.module.css` — 缩略图预览
- 修改：`components/FabricDetail.tsx` — 主图切换 + 缩略图
- 修改：`components/FabricDetail.module.css` — 缩略图条

- [ ] **步骤 1：更新 POST API 处理多图**

修改 `app/api/fabrics/route.ts` 的 POST handler 中的照片处理逻辑：

```typescript
// Handle multiple photo uploads (max 3)
const photoPaths: string[] = []
for (let i = 0; i < 3; i++) {
  const photo = formData.get(`photo_${i}`) as File | null
  if (!photo || photo.size === 0) continue

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(photo.type)) {
    return NextResponse.json({ success: false, error: '仅支持 jpg/png/webp 格式' }, { status: 400 })
  }
  if (photo.size > 10 * 1024 * 1024) {
    return NextResponse.json({ success: false, error: '照片大小不能超过 10MB' }, { status: 400 })
  }

  const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
  await mkdir(uploadsDir, { recursive: true })
  const ext = photo.type.split('/')[1] || 'jpg'
  const filename = `${Date.now()}-${i}-${Math.random().toString(36).slice(2)}.${ext}`
  const buffer = Buffer.from(await photo.arrayBuffer())
  await writeFile(path.join(uploadsDir, filename), buffer)
  photoPaths.push(`/uploads/${filename}`)
}

const photos = photoPaths.length > 0 ? JSON.stringify(photoPaths) : '[]'
const firstPhoto = photoPaths.length > 0 ? photoPaths[0] : null
```

`fabricData` 加：
```typescript
photo_path: firstPhoto,
photos,
status: (formData.get('status') as string) || 'idle',
```

- [ ] **步骤 2：更新 PUT API 处理多图**

修改 `app/api/fabrics/[id]/route.ts` 的 PUT handler，类似逻辑处理 `photo_0`、`photo_1`、`photo_2`。保留旧图逻辑：如果传了新图则更新 photos JSON，否则保持原值。

```typescript
// Merge with existing photos
const existingPhotos: string[] = JSON.parse(fabric?.photos || '[]')
const newPhotoPaths: string[] = [...existingPhotos]

for (let i = 0; i < 3; i++) {
  const photo = formData.get(`photo_${i}`) as File | null
  if (photo && photo.size > 0) {
    // Save photo and add path
    // ...
    newPhotoPaths[i] = photoPath  // replace at index
  }
}

updateData.photos = JSON.stringify(newPhotoPaths.slice(0, 3))
updateData.photo_path = newPhotoPaths[0] || null
```

同时处理 `formData.get('status')`。

- [ ] **步骤 3：更新 FabricForm 多图上传**

修改 `FabricForm.tsx`。将单图 `<input type="file" name="photo">` 改为：

```typescript
const MAX_PHOTOS = 3
const [photos, setPhotos] = useState<string[]>(
  fabric?.photos ? JSON.parse(fabric.photos) : []
)

function handlePhotoAdd(e: React.ChangeEvent<HTMLInputElement>) {
  const files = e.target.files
  if (!files) return
  const newPhotos = [...photos]
  for (let i = 0; i < files.length && newPhotos.length < MAX_PHOTOS; i++) {
    newPhotos.push(URL.createObjectURL(files[i]))
  }
  setPhotos(newPhotos)
  // Reset the input so the same file can be reselected
  e.target.value = ''
}

function handlePhotoRemove(index: number) {
  setPhotos(photos.filter((_, i) => i !== index))
}
```

上传区域改为显示多张缩略图网格（每张 80x80 的小方块），超过 3 张不可再选。

实际提交时，每个文件用 `photo_0`、`photo_1`、`photo_2` 的 key 追加到 FormData。

- [ ] **步骤 4：更新 FabricDetail 多图查看**

修改 `FabricDetail.tsx`。解析 `photos` JSON，显示主图 + 缩略图条：

```typescript
const photos: string[] = (() => {
  try { return JSON.parse(fabric.photos || '[]') }
  catch { return fabric.photo_path ? [fabric.photo_path] : [] }
})()

const [activePhoto, setActivePhoto] = useState(photos[0] || null)

// 主图区显示 activePhoto
// 多于一张时下方显示缩略图横排
{photos.length > 1 && (
  <div style={{ display: 'flex', gap: '6px', padding: '8px 16px', overflowX: 'auto' }}>
    {photos.map((p, i) => (
      <img key={i} src={p} onClick={() => setActivePhoto(p)}
        style={{
          width: '56px', height: '56px', objectFit: 'cover', borderRadius: '6px',
          border: activePhoto === p ? '2px solid var(--color-primary)' : '2px solid transparent',
          cursor: 'pointer', flexShrink: 0,
        }} />
    ))}
  </div>
)}
```

- [ ] **步骤 5：验证**

`npm run dev`：添加布料时选 3 张图 → 详情页切换查看 → 编辑页修改图片。

- [ ] **步骤 6：Commit**

```bash
git add app/api/fabrics/route.ts app/api/fabrics/\[id\]/route.ts components/FabricForm.tsx components/FabricForm.module.css components/FabricDetail.tsx components/FabricDetail.module.css
git commit -m "feat: add multi-photo support (max 3 photos per fabric)"
```

---

### 任务 7：回归测试

**文件：** 运行全部测试，修复回归问题

- [ ] **步骤 1：运行全部测试**

```bash
npx vitest run
```

修复失败测试。

- [ ] **步骤 2：验证构建**

```bash
npx next build
```

- [ ] **步骤 3：Commit**

```bash
git add -A
git commit -m "chore: regression testing - all tests pass"
```

---

## 依赖顺序

```
任务 1 (schema) → 任务 2 (CRUD) → 任务 3 (搜索)   任务 5 (状态)
                 →              → 任务 4 (统计)   任务 6 (多图)
                                                     ↓
                                               任务 7 (回归)
```

# 布料记录工具 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 构建一个移动端优先的网页应用，用于记录和浏览个人购买的布料。

**架构：** Next.js App Router 全栈应用，SQLite 数据库（better-sqlite3），React 前端。所有页面均为服务端组件 + 客户端交互组件。照片存本地文件系统。

**技术栈：** Next.js (App Router), TypeScript, better-sqlite3, vitest, React Testing Library, CSS Modules

---

## 文件结构

```
project/
├── lib/
│   ├── db.ts              # 数据库连接 + 表初始化
│   └── fabrics.ts         # 布料 CRUD 操作
├── app/
│   ├── layout.tsx          # 根布局（移动端 viewport）
│   ├── page.tsx            # 相册首页（服务端组件）
│   ├── globals.css         # 全局样式（移动端优先）
│   ├── fabrics/
│   │   ├── [id]/
│   │   │   ├── page.tsx    # 布料详情页
│   │   │   └── edit/
│   │   │       └── page.tsx # 编辑布料页
│   │   └── new/
│   │       └── page.tsx    # 添加布料页
│   └── api/
│       └── fabrics/
│           ├── route.ts    # GET 列表 / POST 新增
│           └── [id]/
│               └── route.ts # GET 详情 / PUT 更新 / DELETE 删除
├── components/
│   ├── FabricCard.tsx      # 相册卡片组件
│   ├── FabricCard.module.css
│   ├── FabricForm.tsx      # 添加/编辑表单组件（客户端）
│   ├── FabricForm.module.css
│   ├── FabricDetail.tsx    # 详情展示组件（客户端）
│   ├── FabricDetail.module.css
│   ├── Toast.tsx           # Toast 通知组件
│   └── Toast.module.css
├── tests/
│   ├── lib/
│   │   └── fabrics.test.ts  # DB CRUD 单元测试
│   ├── api/
│   │   └── fabrics.test.ts  # API 集成测试
│   └── components/
│       └── FabricCard.test.tsx # 组件测试
├── public/
│   └── uploads/            # 照片存储目录（.gitkeep）
├── vitest.config.ts
├── next.config.js
├── tsconfig.json
└── package.json
```

---

### 任务 1：项目脚手架

**文件：**
- 创建：`package.json`、`tsconfig.json`、`next.config.js`、`vitest.config.ts`
- 创建：`public/uploads/.gitkeep`
- 创建：`.gitignore`

- [ ] **步骤 1：初始化 Next.js 项目**

```bash
npx create-next-app@latest . --typescript --eslint --tailwind --src-dir=false --app --import-alias="@/*" --no-turbopack
```

初始化完成后，安装额外依赖：

```bash
npm install better-sqlite3
npm install -D vitest @vitejs/plugin-react react-testing-library @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **步骤 2：配置 vitest**

创建 `vitest.config.ts`：

```typescript
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
```

创建 `tests/setup.ts`：

```typescript
import '@testing-library/jest-dom'
```

- [ ] **步骤 3：创建目录结构**

```bash
mkdir -p lib app/fabrics/\[id\]/edit app/fabrics/new app/api/fabrics/\[id\] components tests/lib tests/api tests/components public/uploads
```

- [ ] **步骤 4：创建 .gitignore 条目**

确保 `.gitignore` 包含：

```
*.db
*.db-journal
public/uploads/*
!public/uploads/.gitkeep
```

- [ ] **步骤 5：验证项目可运行**

```bash
npm run dev
```

预期：Next.js 开发服务器在 http://localhost:3000 启动成功。

- [ ] **步骤 6：Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js project with SQLite and vitest"
```

---

### 任务 2：数据库初始化 + Schema

**文件：**
- 创建：`lib/db.ts`
- 创建：`tests/lib/fabrics.test.ts`

- [ ] **步骤 1：编写数据库初始化代码**

创建 `lib/db.ts`：

```typescript
import Database from 'better-sqlite3'
import path from 'path'

let db: Database.Database

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(path.join(process.cwd(), 'fabrics.db'))
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    initSchema(db)
  }
  return db
}

function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS fabrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      width REAL,
      unit TEXT NOT NULL,
      price REAL,
      store TEXT,
      purchase_date TEXT,
      photo_path TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)
}
```

- [ ] **步骤 2：编写数据库连接测试**

创建 `tests/lib/fabrics.test.ts`：

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { getDb } from '@/lib/db'

describe('Database initialization', () => {
  afterAll(() => {
    const db = getDb()
    db.exec('DROP TABLE IF EXISTS fabrics')
  })

  it('should create fabrics table with correct schema', () => {
    const db = getDb()
    const columns = db.prepare("PRAGMA table_info('fabrics')").all() as any[]
    const columnNames = columns.map((c: any) => c.name)

    expect(columnNames).toContain('id')
    expect(columnNames).toContain('name')
    expect(columnNames).toContain('type')
    expect(columnNames).toContain('width')
    expect(columnNames).toContain('unit')
    expect(columnNames).toContain('price')
    expect(columnNames).toContain('store')
    expect(columnNames).toContain('purchase_date')
    expect(columnNames).toContain('photo_path')
    expect(columnNames).toContain('notes')
    expect(columnNames).toContain('created_at')
    expect(columnNames).toContain('updated_at')
  })

  it('should not error on repeated getDb() calls', () => {
    const db1 = getDb()
    const db2 = getDb()
    expect(db1).toBe(db2) // singleton
  })
})
```

- [ ] **步骤 3：运行测试验证通过**

```bash
npx vitest run tests/lib/fabrics.test.ts
```

预期：2 tests PASS

- [ ] **步骤 4：Commit**

```bash
git add lib/db.ts tests/lib/fabrics.test.ts
git commit -m "feat: add SQLite database initialization with fabrics schema"
```

---

### 任务 3：布料 CRUD 操作

**文件：**
- 创建：`lib/fabrics.ts`
- 修改：`tests/lib/fabrics.test.ts`（追加测试）

- [ ] **步骤 1：编写 CRUD 测试（TDD - 先写失败的测试）**

在 `tests/lib/fabrics.test.ts` 末尾追加：

```typescript
import { createFabric, getFabricById, getAllFabrics, updateFabric, deleteFabric } from '@/lib/fabrics'

describe('Fabrics CRUD', () => {
  afterAll(() => {
    const db = getDb()
    db.exec('DELETE FROM fabrics')
  })

  const sampleFabric = {
    name: '碎花亚麻',
    type: '棉麻混纺',
    width: 145,
    unit: '米',
    price: 28,
    store: '晓港布料市场 2F-38',
    purchase_date: '2026-05-15',
    notes: '适合做春夏连衣裙',
  }

  it('createFabric should insert and return a fabric with id and timestamps', () => {
    const result = createFabric(sampleFabric)
    expect(result.id).toBeGreaterThan(0)
    expect(result.name).toBe('碎花亚麻')
    expect(result.width).toBe(145)
    expect(result.created_at).toBeTruthy()
    expect(result.updated_at).toBeTruthy()
  })

  it('getAllFabrics should return all fabrics', () => {
    createFabric({ ...sampleFabric, name: '水洗牛仔蓝' })
    const list = getAllFabrics()
    expect(list.length).toBeGreaterThanOrEqual(2)
    expect(list[0].name).toBe('水洗牛仔蓝') // latest first
  })

  it('getFabricById should return the correct fabric', () => {
    const created = createFabric({ ...sampleFabric, name: '真丝素绉缎' })
    const found = getFabricById(created.id)
    expect(found).not.toBeNull()
    expect(found!.name).toBe('真丝素绉缎')
  })

  it('getFabricById should return null for nonexistent id', () => {
    const found = getFabricById(99999)
    expect(found).toBeNull()
  })

  it('updateFabric should modify and return updated fabric', () => {
    const created = createFabric({ ...sampleFabric, name: '羊毛格纹' })
    const updated = updateFabric(created.id, { name: '羊毛格纹（加厚）', price: 130 })
    expect(updated).not.toBeNull()
    expect(updated!.name).toBe('羊毛格纹（加厚）')
    expect(updated!.price).toBe(130)
    expect(updated!.type).toBe(created.type) // unchanged field
  })

  it('deleteFabric should remove the fabric', () => {
    const created = createFabric({ ...sampleFabric, name: '待删除布料' })
    const result = deleteFabric(created.id)
    expect(result).toBe(true)
    expect(getFabricById(created.id)).toBeNull()
  })
})
```

- [ ] **步骤 2：运行测试确认失败**

```bash
npx vitest run tests/lib/fabrics.test.ts
```

预期：新测试全部 FAIL（函数尚未定义）

- [ ] **步骤 3：实现 CRUD 函数**

创建 `lib/fabrics.ts`：

```typescript
import { getDb } from './db'

export interface Fabric {
  id: number
  name: string
  type: string
  width: number | null
  unit: string
  price: number | null
  store: string | null
  purchase_date: string | null
  photo_path: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type FabricInput = Omit<Fabric, 'id' | 'created_at' | 'updated_at'>

export function getAllFabrics(type?: string, sort: string = 'created_at_desc'): Fabric[] {
  const db = getDb()
  let sql = 'SELECT * FROM fabrics'
  const params: any[] = []

  if (type) {
    sql += ' WHERE type = ?'
    params.push(type)
  }

  sql += ' ORDER BY created_at DESC'
  return db.prepare(sql).all(...params) as Fabric[]
}

export function getFabricById(id: number): Fabric | null {
  const db = getDb()
  const result = db.prepare('SELECT * FROM fabrics WHERE id = ?').get(id)
  return (result as Fabric) || null
}

export function createFabric(data: FabricInput): Fabric {
  const db = getDb()
  const stmt = db.prepare(`
    INSERT INTO fabrics (name, type, width, unit, price, store, purchase_date, photo_path, notes)
    VALUES (@name, @type, @width, @unit, @price, @store, @purchase_date, @photo_path, @notes)
  `)
  const result = stmt.run(data)
  return getFabricById(result.lastInsertRowid as number)!
}

export function updateFabric(id: number, data: Partial<FabricInput>): Fabric | null {
  const existing = getFabricById(id)
  if (!existing) return null

  const db = getDb()
  const merged = { ...existing, ...data, updated_at: new Date().toISOString() }

  db.prepare(`
    UPDATE fabrics SET
      name = @name, type = @type, width = @width, unit = @unit,
      price = @price, store = @store, purchase_date = @purchase_date,
      photo_path = @photo_path, notes = @notes, updated_at = @updated_at
    WHERE id = @id
  `).run(merged)

  return getFabricById(id)
}

export function deleteFabric(id: number): boolean {
  const db = getDb()
  const result = db.prepare('DELETE FROM fabrics WHERE id = ?').run(id)
  return result.changes > 0
}
```

- [ ] **步骤 4：运行测试确认通过**

```bash
npx vitest run tests/lib/fabrics.test.ts
```

预期：全部 8 个测试 PASS

- [ ] **步骤 5：Commit**

```bash
git add lib/fabrics.ts tests/lib/fabrics.test.ts
git commit -m "feat: implement fabric CRUD operations"
```

---

### 任务 4：API - GET 列表 + POST 新增

**文件：**
- 创建：`app/api/fabrics/route.ts`
- 创建：`tests/api/fabrics.test.ts`

- [ ] **步骤 1：编写 API 集成测试（TDD）**

创建 `tests/api/fabrics.test.ts`：

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { getDb } from '@/lib/db'

// Helper: simulate Next.js API route handler
async function testApiRoute(
  handler: (req: Request) => Promise<Response>,
  method: string,
  body?: any,
  searchParams?: Record<string, string>
): Promise<Response> {
  const url = new URL('http://localhost/api/fabrics')
  if (searchParams) {
    Object.entries(searchParams).forEach(([k, v]) => url.searchParams.set(k, v))
  }
  const init: RequestInit = { method }
  if (body) {
    init.body = JSON.stringify(body)
    ;(init as any).headers = { 'content-type': 'application/json' }
  }
  return handler(new Request(url.toString(), init))
}

// Tests will be written after handler is importable
// For now, this file defines the test structure
```

由于 Next.js API Route 的测试需要特殊处理，在任务内联测试之前先编写路由处理函数。我们将测试写在实际 handler 定义之后，步骤 3 中。

- [ ] **步骤 2：实现 API 路由**

创建 `app/api/fabrics/route.ts`：

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getAllFabrics, createFabric, FabricInput } from '@/lib/fabrics'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || undefined
    const sort = searchParams.get('sort') || 'created_at_desc'
    const fabrics = getAllFabrics(type, sort)
    return NextResponse.json({ success: true, data: fabrics })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '获取列表失败' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const name = formData.get('name') as string
    const type = formData.get('type') as string
    const unit = formData.get('unit') as string

    // Validate required fields
    if (!name || !type || !unit) {
      return NextResponse.json(
        { success: false, error: '名称、类型、单位为必填项' },
        { status: 400 }
      )
    }

    // Handle photo upload
    let photoPath: string | null = null
    const photo = formData.get('photo') as File | null
    if (photo && photo.size > 0) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(photo.type)) {
        return NextResponse.json(
          { success: false, error: '仅支持 jpg/png/webp 格式' },
          { status: 400 }
        )
      }
      // Validate file size (10MB max)
      if (photo.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, error: '照片大小不能超过 10MB' },
          { status: 400 }
        )
      }

      const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
      await mkdir(uploadsDir, { recursive: true })

      const ext = photo.type.split('/')[1] || 'jpg'
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const buffer = Buffer.from(await photo.arrayBuffer())
      await writeFile(path.join(uploadsDir, filename), buffer)
      photoPath = `/uploads/${filename}`
    }

    const fabricData: FabricInput = {
      name,
      type,
      width: formData.get('width') ? parseFloat(formData.get('width') as string) : null,
      unit,
      price: formData.get('price') ? parseFloat(formData.get('price') as string) : null,
      store: (formData.get('store') as string) || null,
      purchase_date: (formData.get('purchase_date') as string) || null,
      photo_path: photoPath,
      notes: (formData.get('notes') as string) || null,
    }

    const fabric = createFabric(fabricData)
    return NextResponse.json({ success: true, data: fabric }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '添加布料失败' },
      { status: 500 }
    )
  }
}
```

- [ ] **步骤 3：编写并运行 API 测试**

在 `tests/api/fabrics.test.ts` 中追加实际测试：

```typescript
import { GET, POST } from '@/app/api/fabrics/route'

describe('GET /api/fabrics', () => {
  it('should return success with fabric list', async () => {
    const res = await testApiRoute(GET, 'GET')
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(Array.isArray(json.data)).toBe(true)
  })
})

describe('POST /api/fabrics', () => {
  it('should return 400 when name is missing', async () => {
    const formData = new FormData()
    formData.append('type', '棉')
    formData.append('unit', '米')
    const res = await POST(new Request('http://localhost/api/fabrics', {
      method: 'POST',
      body: formData,
    }))
    const json = await res.json()
    expect(res.status).toBe(400)
    expect(json.success).toBe(false)
  })

  it('should create a fabric with valid data', async () => {
    const formData = new FormData()
    formData.append('name', '测试布料')
    formData.append('type', '棉')
    formData.append('unit', '米')
    formData.append('width', '150')
    formData.append('price', '35')
    formData.append('store', '测试店铺')
    formData.append('purchase_date', '2026-06-01')
    formData.append('notes', '测试备注')
    const res = await POST(new Request('http://localhost/api/fabrics', {
      method: 'POST',
      body: formData,
    }))
    const json = await res.json()
    expect(res.status).toBe(201)
    expect(json.success).toBe(true)
    expect(json.data.name).toBe('测试布料')
    expect(json.data.id).toBeGreaterThan(0)
  })
})
```

- [ ] **步骤 4：运行 API 测试**

```bash
npx vitest run tests/api/fabrics.test.ts
```

预期：全部测试 PASS

- [ ] **步骤 5：Commit**

```bash
git add app/api/fabrics/route.ts tests/api/fabrics.test.ts
git commit -m "feat: add GET list and POST create API endpoints"
```

---

### 任务 5：API - GET/PUT/DELETE 单条布料

**文件：**
- 创建：`app/api/fabrics/[id]/route.ts`
- 修改：`tests/api/fabrics.test.ts`（追加测试）

- [ ] **步骤 1：实现单条布料 API 路由**

创建 `app/api/fabrics/[id]/route.ts`：

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getFabricById, updateFabric, deleteFabric } from '@/lib/fabrics'
import { unlink, writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: '无效的 ID' },
        { status: 400 }
      )
    }
    const fabric = getFabricById(id)
    if (!fabric) {
      return NextResponse.json(
        { success: false, error: '布料不存在' },
        { status: 404 }
      )
    }
    return NextResponse.json({ success: true, data: fabric })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '获取详情失败' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: '无效的 ID' },
        { status: 400 }
      )
    }

    const formData = await request.formData()
    const updateData: Record<string, any> = {}

    const fields = ['name', 'type', 'unit', 'store', 'purchase_date', 'notes']
    for (const field of fields) {
      const val = formData.get(field)
      if (val !== null) updateData[field] = val
    }

    if (formData.get('width') !== null) {
      updateData.width = parseFloat(formData.get('width') as string)
    }
    if (formData.get('price') !== null) {
      updateData.price = parseFloat(formData.get('price') as string)
    }

    // Handle photo update
    const photo = formData.get('photo') as File | null
    if (photo && photo.size > 0) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(photo.type)) {
        return NextResponse.json(
          { success: false, error: '仅支持 jpg/png/webp 格式' },
          { status: 400 }
        )
      }
      if (photo.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, error: '照片大小不能超过 10MB' },
          { status: 400 }
        )
      }

      const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
      const ext = photo.type.split('/')[1] || 'jpg'
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const buffer = Buffer.from(await photo.arrayBuffer())
      await writeFile(path.join(uploadsDir, filename), buffer)
      updateData.photo_path = `/uploads/${filename}`
    }

    const updated = updateFabric(id, updateData)
    if (!updated) {
      return NextResponse.json(
        { success: false, error: '布料不存在' },
        { status: 404 }
      )
    }
    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '更新失败' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: '无效的 ID' },
        { status: 400 }
      )
    }

    // Delete associated photo file
    const fabric = getFabricById(id)
    if (fabric?.photo_path) {
      const filePath = path.join(process.cwd(), 'public', fabric.photo_path)
      try {
        await unlink(filePath)
      } catch {
        // File may not exist, ignore
      }
    }

    const deleted = deleteFabric(id)
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: '布料不存在' },
        { status: 404 }
      )
    }
    return NextResponse.json({ success: true, data: { id } })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '删除失败' },
      { status: 500 }
    )
  }
}
```

- [ ] **步骤 2：追加 API 测试**

在 `tests/api/fabrics.test.ts` 末尾追加：

```typescript
import { GET as GET_ONE, PUT, DELETE } from '@/app/api/fabrics/[id]/route'

describe('GET /api/fabrics/[id]', () => {
  it('should return fabric by id', async () => {
    const res = await GET_ONE(
      new Request('http://localhost/api/fabrics/1'),
      { params: { id: '1' } }
    )
    const json = await res.json()
    expect(json.success).toBe(true)
  })

  it('should return 400 for invalid id', async () => {
    const res = await GET_ONE(
      new Request('http://localhost/api/fabrics/abc'),
      { params: { id: 'abc' } }
    )
    expect(res.status).toBe(400)
  })

  it('should return 404 for nonexistent id', async () => {
    const res = await GET_ONE(
      new Request('http://localhost/api/fabrics/99999'),
      { params: { id: '99999' } }
    )
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/fabrics/[id]', () => {
  it('should return 400 for invalid id', async () => {
    const res = await DELETE(
      new Request('http://localhost/api/fabrics/abc', { method: 'DELETE' }),
      { params: { id: 'abc' } }
    )
    expect(res.status).toBe(400)
  })
})
```

- [ ] **步骤 3：运行测试**

```bash
npx vitest run tests/api/fabrics.test.ts
```

预期：全部测试 PASS

- [ ] **步骤 4：Commit**

```bash
git add app/api/fabrics/[id]/route.ts tests/api/fabrics.test.ts
git commit -m "feat: add GET/PUT/DELETE single fabric API endpoints"
```

---

### 任务 6：全局布局 + 移动端样式

**文件：**
- 创建/修改：`app/layout.tsx`
- 创建/修改：`app/globals.css`

- [ ] **步骤 1：编写全局样式**

修改 `app/globals.css`：

```css
/* 移动端优先全局样式 */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  --color-primary: #d4a574;
  --color-primary-light: #f0e6d3;
  --color-danger: #e74c3c;
  --color-bg: #fafaf8;
  --color-white: #ffffff;
  --color-text: #333333;
  --color-text-secondary: #888888;
  --color-border: #eeeeee;
  --radius-card: 12px;
  --radius-button: 10px;
  --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.1);
  --shadow-fab: 0 2px 8px rgba(0, 0, 0, 0.2);
}

html {
  font-size: 16px;
  -webkit-text-size-adjust: 100%;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
    'Helvetica Neue', Arial, 'Noto Sans SC', sans-serif;
  background: var(--color-bg);
  color: var(--color-text);
  max-width: 480px;
  margin: 0 auto;
  min-height: 100vh;
}

a {
  color: inherit;
  text-decoration: none;
}

input, textarea, select, button {
  font-family: inherit;
  font-size: 16px; /* 防止 iOS 缩放 */
}
```

- [ ] **步骤 2：编写根布局**

修改 `app/layout.tsx`：

```typescript
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '我的布料收藏',
  description: '记录和管理购买的布料',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  themeColor: '#fafaf8',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **步骤 3：验证**

```bash
npm run dev
```

在浏览器中打开 http://localhost:3000，确认页面在 480px 宽度下正常居中，meta 标签正确。

- [ ] **步骤 4：Commit**

```bash
git add app/layout.tsx app/globals.css
git commit -m "feat: add mobile-first global layout and styles"
```

---

### 任务 7：FabricCard 组件 + 相册首页

**文件：**
- 创建：`components/FabricCard.tsx`
- 创建：`components/FabricCard.module.css`
- 修改：`app/page.tsx`
- 创建：`tests/components/FabricCard.test.tsx`

- [ ] **步骤 1：编写 FabricCard 组件测试**

创建 `tests/components/FabricCard.test.tsx`：

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import FabricCard from '@/components/FabricCard'

const mockFabric = {
  id: 1,
  name: '碎花亚麻',
  type: '棉麻混纺',
  width: 145,
  unit: '米',
  price: 28,
  store: '晓港布料市场',
  purchase_date: '2026-05-15',
  photo_path: null,
  notes: null,
  created_at: '2026-06-01T00:00:00.000Z',
  updated_at: '2026-06-01T00:00:00.000Z',
}

describe('FabricCard', () => {
  it('should render fabric name', () => {
    render(<FabricCard fabric={mockFabric} />)
    expect(screen.getByText('碎花亚麻')).toBeInTheDocument()
  })

  it('should render type, width and price info', () => {
    render(<FabricCard fabric={mockFabric} />)
    expect(screen.getByText(/棉麻混纺/)).toBeInTheDocument()
    expect(screen.getByText(/145cm/)).toBeInTheDocument()
    expect(screen.getByText(/¥28/)).toBeInTheDocument()
  })

  it('should render placeholder when no photo', () => {
    render(<FabricCard fabric={mockFabric} />)
    expect(screen.getByText('🧵')).toBeInTheDocument()
  })

  it('should link to detail page', () => {
    render(<FabricCard fabric={mockFabric} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/fabrics/1')
  })
})
```

- [ ] **步骤 2：运行测试确认失败**

```bash
npx vitest run tests/components/FabricCard.test.tsx
```

预期：FAIL（组件尚未创建）

- [ ] **步骤 3：实现 FabricCard 组件**

创建 `components/FabricCard.module.css`：

```css
.card {
  display: block;
  background: var(--color-white);
  border-radius: var(--radius-card);
  overflow: hidden;
  box-shadow: var(--shadow-card);
  transition: transform 0.15s;
}

.card:active {
  transform: scale(0.97);
}

.photo {
  width: 100%;
  aspect-ratio: 3 / 4;
  object-fit: cover;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  font-size: 40px;
}

.photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.info {
  padding: 8px 10px;
}

.name {
  font-size: 13px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meta {
  font-size: 11px;
  color: var(--color-text-secondary);
  margin-top: 2px;
}
```

创建 `components/FabricCard.tsx`：

```typescript
import Link from 'next/link'
import type { Fabric } from '@/lib/fabrics'
import styles from './FabricCard.module.css'

export default function FabricCard({ fabric }: { fabric: Fabric }) {
  const meta = [
    fabric.type,
    fabric.width ? `${fabric.width}cm` : null,
    fabric.price ? `¥${fabric.price}` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <Link href={`/fabrics/${fabric.id}`} className={styles.card}>
      <div className={styles.photo}>
        {fabric.photo_path ? (
          <img src={fabric.photo_path} alt={fabric.name} />
        ) : (
          '🧵'
        )}
      </div>
      <div className={styles.info}>
        <div className={styles.name}>{fabric.name}</div>
        <div className={styles.meta}>{meta}</div>
      </div>
    </Link>
  )
}
```

- [ ] **步骤 4：运行测试确认通过**

```bash
npx vitest run tests/components/FabricCard.test.tsx
```

预期：全部 4 个测试 PASS

- [ ] **步骤 5：实现相册首页**

修改 `app/page.tsx`：

```typescript
import { getAllFabrics } from '@/lib/fabrics'
import FabricCard from '@/components/FabricCard'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function HomePage() {
  const fabrics = getAllFabrics()

  return (
    <div>
      <header style={{
        padding: '12px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'var(--color-white)',
        borderBottom: '1px solid var(--color-border)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <span style={{ fontSize: '18px', fontWeight: 700 }}>🧵 我的布料</span>
        <span style={{
          background: 'var(--color-primary-light)',
          padding: '4px 10px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 600,
        }}>
          {fabrics.length}
        </span>
      </header>

      <main style={{ padding: '8px 12px' }}>
        {fabrics.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '80px 20px',
            color: 'var(--color-text-secondary)',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🧶</div>
            <p style={{ fontSize: '15px' }}>还没有记录布料</p>
            <p style={{ fontSize: '13px', marginTop: '4px' }}>点击下方按钮添加第一块布料吧</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
          }}>
            {fabrics.map((fabric) => (
              <FabricCard key={fabric.id} fabric={fabric} />
            ))}
          </div>
        )}
      </main>

      <Link
        href="/fabrics/new"
        style={{
          position: 'fixed',
          right: 'max(16px, calc((100vw - 480px) / 2 + 16px))',
          bottom: '24px',
          width: '48px',
          height: '48px',
          background: 'var(--color-primary)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: '24px',
          boxShadow: 'var(--shadow-fab)',
          zIndex: 100,
        }}
        aria-label="添加布料"
      >
        +
      </Link>
    </div>
  )
}
```

- [ ] **步骤 6：验证页面**

```bash
npm run dev
```

打开 http://localhost:3000，确认相册首页展示（空状态或已有数据）。

- [ ] **步骤 7：Commit**

```bash
git add components/FabricCard.tsx components/FabricCard.module.css app/page.tsx tests/components/FabricCard.test.tsx
git commit -m "feat: add FabricCard component and album homepage"
```

---

### 任务 8：FabricForm 组件 + 添加页面

**文件：**
- 创建：`components/FabricForm.tsx`
- 创建：`components/FabricForm.module.css`
- 创建：`app/fabrics/new/page.tsx`

- [ ] **步骤 1：编写 FabricForm 组件测试**

在 `tests/components/` 下创建 `FabricForm.test.tsx`：

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import FabricForm from '@/components/FabricForm'

describe('FabricForm', () => {
  it('should render all form fields', () => {
    render(<FabricForm />)
    expect(screen.getByPlaceholderText(/布料名称/)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/棉.*麻.*丝/)).toBeInTheDocument()
    expect(screen.getByPlaceholderText('145')).toBeInTheDocument() // 幅宽
    expect(screen.getByPlaceholderText(/米.*码/)).toBeInTheDocument()
  })

  it('should show save button', () => {
    render(<FabricForm />)
    expect(screen.getByRole('button', { name: /保存/ })).toBeInTheDocument()
  })
})
```

- [ ] **步骤 2：实现 FabricForm 客户端组件**

创建 `components/FabricForm.module.css`：

```css
.form {
  padding: 16px;
}

.photoUpload {
  width: 100%;
  height: 160px;
  background: #f5f5f5;
  border: 2px dashed #ddd;
  border-radius: var(--radius-card);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  cursor: pointer;
  overflow: hidden;
  position: relative;
}

.photoUpload:hover {
  border-color: var(--color-primary);
}

.photoUploadIcon {
  font-size: 32px;
}

.photoUploadText {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-top: 4px;
}

.photoUpload input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.photoPreview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.fieldGroup {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.row {
  display: flex;
  gap: 10px;
}

.row > * {
  flex: 1;
}

.field {
  display: flex;
  flex-direction: column;
}

.label {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-bottom: 4px;
}

.input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 15px;
  background: var(--color-white);
}

.input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.textarea {
  composes: input;
  height: 70px;
  resize: vertical;
}

.submit {
  width: 100%;
  padding: 14px;
  margin-top: 20px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-button);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}

.submit:active {
  opacity: 0.9;
}

.error {
  color: var(--color-danger);
  font-size: 12px;
  margin-top: 4px;
}
```

创建 `components/FabricForm.tsx`：

```typescript
'use client'

import { useState, useRef, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import type { Fabric } from '@/lib/fabrics'
import styles from './FabricForm.module.css'

interface Props {
  fabric?: Fabric  // 编辑模式时传入已有数据
}

export default function FabricForm({ fabric }: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    fabric?.photo_path || null
  )
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const isEdit = !!fabric

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const form = e.currentTarget
    const formData = new FormData(form)

    // Frontend validation
    const name = formData.get('name') as string
    const type = formData.get('type') as string
    const unit = formData.get('unit') as string

    if (!name?.trim()) {
      setError('请输入布料名称')
      return
    }
    if (!type?.trim()) {
      setError('请输入布料类型')
      return
    }
    if (!unit?.trim()) {
      setError('请输入单位')
      return
    }

    setSubmitting(true)

    try {
      const url = isEdit ? `/api/fabrics/${fabric.id}` : '/api/fabrics'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, { method, body: formData })
      const json = await res.json()

      if (!json.success) {
        setError(json.error || '保存失败')
        setSubmitting(false)
        return
      }

      router.push(`/fabrics/${json.data.id}`)
      router.refresh()
    } catch {
      setError('网络错误，请重试')
      setSubmitting(false)
    }
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setPhotoPreview(URL.createObjectURL(file))
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {/* Photo upload */}
      <div className={styles.photoUpload} onClick={() => fileInputRef.current?.click()}>
        {photoPreview ? (
          <img src={photoPreview} alt="预览" className={styles.photoPreview} />
        ) : (
          <>
            <div className={styles.photoUploadIcon}>📷</div>
            <div className={styles.photoUploadText}>点击拍照或选择照片</div>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          name="photo"
          accept="image/jpeg,image/png,image/webp"
          onChange={handlePhotoChange}
        />
      </div>

      {/* Form fields */}
      <div className={styles.fieldGroup}>
        <div className={styles.field}>
          <label className={styles.label}>布料名称 *</label>
          <input
            className={styles.input}
            name="name"
            placeholder="例如：碎花亚麻"
            defaultValue={fabric?.name || ''}
            required
          />
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>类型 *</label>
            <input
              className={styles.input}
              name="type"
              placeholder="棉 / 麻 / 丝 / 毛 / 化纤 / 混纺 / 其他"
              defaultValue={fabric?.type || ''}
              required
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>幅宽 (cm)</label>
            <input
              className={styles.input}
              name="width"
              type="number"
              step="0.5"
              placeholder="145"
              defaultValue={fabric?.width || ''}
            />
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>单位 *</label>
            <input
              className={styles.input}
              name="unit"
              placeholder="米 / 码"
              defaultValue={fabric?.unit || ''}
              required
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>单价 (元)</label>
            <input
              className={styles.input}
              name="price"
              type="number"
              step="0.01"
              placeholder="28"
              defaultValue={fabric?.price || ''}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>购买店铺</label>
          <input
            className={styles.input}
            name="store"
            placeholder="例如：晓港布料市场 2F-38"
            defaultValue={fabric?.store || ''}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>购买日期</label>
          <input
            className={styles.input}
            name="purchase_date"
            type="date"
            defaultValue={fabric?.purchase_date || ''}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>备注</label>
          <textarea
            className={styles.textarea}
            name="notes"
            placeholder="手感、适合做什么等..."
            defaultValue={fabric?.notes || ''}
          />
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <button className={styles.submit} type="submit" disabled={submitting}>
        {submitting ? '保存中...' : '保存'}
      </button>
    </form>
  )
}
```

- [ ] **步骤 3：创建添加页面**

创建 `app/fabrics/new/page.tsx`：

```typescript
import FabricForm from '@/components/FabricForm'

export default function NewFabricPage() {
  return (
    <div>
      <header style={{
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'var(--color-white)',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <a href="/" style={{ fontSize: '18px' }}>←</a>
        <span style={{ fontSize: '17px', fontWeight: 600 }}>添加布料</span>
      </header>
      <FabricForm />
    </div>
  )
}
```

- [ ] **步骤 4：运行组件测试**

```bash
npx vitest run tests/components/FabricForm.test.tsx
```

预期：PASS

- [ ] **步骤 5：Commit**

```bash
git add components/FabricForm.tsx components/FabricForm.module.css app/fabrics/new/page.tsx tests/components/FabricForm.test.tsx
git commit -m "feat: add FabricForm component and new fabric page"
```

---

### 任务 9：布料详情页 + 编辑页

**文件：**
- 创建：`components/FabricDetail.tsx`
- 创建：`components/FabricDetail.module.css`
- 创建：`app/fabrics/[id]/page.tsx`
- 创建：`app/fabrics/[id]/edit/page.tsx`

- [ ] **步骤 1：实现 FabricDetail 客户端组件**

创建 `components/FabricDetail.module.css`：

```css
.photo {
  width: 100%;
  height: 240px;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 64px;
}

.photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.body {
  padding: 16px;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.tag {
  background: var(--color-primary-light);
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.infoList {
  font-size: 14px;
  line-height: 2;
}

.infoRow {
  display: flex;
}

.infoLabel {
  color: var(--color-text-secondary);
  width: 56px;
  flex-shrink: 0;
}

.actions {
  display: flex;
  gap: 10px;
  padding: 0 16px 20px;
}

.editBtn {
  flex: 1;
  padding: 12px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-button);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  text-align: center;
  display: block;
}

.deleteBtn {
  padding: 12px 16px;
  background: var(--color-white);
  color: var(--color-danger);
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-button);
  font-size: 15px;
  cursor: pointer;
}
```

创建 `components/FabricDetail.tsx`：

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Fabric } from '@/lib/fabrics'
import styles from './FabricDetail.module.css'

export default function FabricDetail({ fabric }: { fabric: Fabric }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    const confirmed = window.confirm('确定要删除这块布料吗？此操作不可撤销。')
    if (!confirmed) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/fabrics/${fabric.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        router.push('/')
        router.refresh()
      } else {
        alert(json.error || '删除失败')
      }
    } catch {
      alert('网络错误，请重试')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div className={styles.photo}>
        {fabric.photo_path ? (
          <img src={fabric.photo_path} alt={fabric.name} />
        ) : (
          '🧶'
        )}
      </div>

      <div className={styles.body}>
        <div className={styles.tags}>
          <span className={styles.tag}>{fabric.type}</span>
          {fabric.width && <span className={styles.tag}>{fabric.width}cm</span>}
          {fabric.price && (
            <span className={styles.tag}>¥{fabric.price}/{fabric.unit}</span>
          )}
        </div>

        <div className={styles.infoList}>
          {fabric.store && (
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>店铺</span>
              <span>{fabric.store}</span>
            </div>
          )}
          {fabric.purchase_date && (
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>日期</span>
              <span>{fabric.purchase_date}</span>
            </div>
          )}
          {fabric.notes && (
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>备注</span>
              <span>{fabric.notes}</span>
            </div>
          )}
        </div>
      </div>

      <div className={styles.actions}>
        <Link href={`/fabrics/${fabric.id}/edit`} className={styles.editBtn}>
          ✏️ 编辑
        </Link>
        <button
          className={styles.deleteBtn}
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? '删除中...' : '🗑'}
        </button>
      </div>
    </>
  )
}
```

- [ ] **步骤 2：创建详情页**

创建 `app/fabrics/[id]/page.tsx`：

```typescript
import { getFabricById } from '@/lib/fabrics'
import { notFound } from 'next/navigation'
import FabricDetail from '@/components/FabricDetail'

export const dynamic = 'force-dynamic'

export default function FabricDetailPage({ params }: { params: { id: string } }) {
  const id = parseInt(params.id)
  if (isNaN(id)) notFound()

  const fabric = getFabricById(id)
  if (!fabric) notFound()

  return (
    <div>
      <header style={{
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'var(--color-white)',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <a href="/" style={{ fontSize: '18px' }}>←</a>
        <span style={{ fontSize: '17px', fontWeight: 600 }}>{fabric.name}</span>
      </header>
      <FabricDetail fabric={fabric} />
    </div>
  )
}
```

- [ ] **步骤 3：创建编辑页**

创建 `app/fabrics/[id]/edit/page.tsx`：

```typescript
import { getFabricById } from '@/lib/fabrics'
import { notFound } from 'next/navigation'
import FabricForm from '@/components/FabricForm'

export const dynamic = 'force-dynamic'

export default function EditFabricPage({ params }: { params: { id: string } }) {
  const id = parseInt(params.id)
  if (isNaN(id)) notFound()

  const fabric = getFabricById(id)
  if (!fabric) notFound()

  return (
    <div>
      <header style={{
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'var(--color-white)',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <a href={`/fabrics/${fabric.id}`} style={{ fontSize: '18px' }}>←</a>
        <span style={{ fontSize: '17px', fontWeight: 600 }}>编辑布料</span>
      </header>
      <FabricForm fabric={fabric} />
    </div>
  )
}
```

- [ ] **步骤 4：验证完整流程**

```bash
npm run dev
```

手动测试：首页 → 添加布料 → 保存 → 查看详情 → 编辑 → 保存 → 删除。

- [ ] **步骤 5：Commit**

```bash
git add components/FabricDetail.tsx components/FabricDetail.module.css app/fabrics/[id]/page.tsx app/fabrics/[id]/edit/page.tsx
git commit -m "feat: add fabric detail and edit pages"
```

---

### 任务 10：Toast 通知 + 收尾

**文件：**
- 创建：`components/Toast.tsx`
- 创建：`components/Toast.module.css`

- [ ] **步骤 1：实现 Toast 组件**

创建 `components/Toast.module.css`：

```css
.overlay {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  animation: slideDown 0.3s ease;
}

.toast {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  color: #fff;
  white-space: nowrap;
}

.success {
  background: #27ae60;
}

.error {
  background: var(--color-danger);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

创建 `components/Toast.tsx`：

```typescript
'use client'

import { useEffect, useState, createContext, useContext, useCallback } from 'react'
import styles from './Toast.module.css'

interface ToastMessage {
  id: number
  text: string
  type: 'success' | 'error'
}

let toastId = 0
let globalAddToast: ((text: string, type: 'success' | 'error') => void) | null = null

export function showToast(text: string, type: 'success' | 'error' = 'success') {
  globalAddToast?.(text, type)
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = useCallback((text: string, type: 'success' | 'error') => {
    const id = ++toastId
    setToasts((prev) => [...prev, { id, text, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  useEffect(() => {
    globalAddToast = addToast
    return () => {
      globalAddToast = null
    }
  }, [addToast])

  if (toasts.length === 0) return null

  return (
    <div className={styles.overlay}>
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`${styles.toast} ${t.type === 'error' ? styles.error : styles.success}`}
        >
          {t.text}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **步骤 2：将 Toast 接入布局**

修改 `app/layout.tsx`，在 body 中添加 `ToastContainer`：

```typescript
import type { Metadata } from 'next'
import './globals.css'
import ToastContainer from '@/components/Toast'

export const metadata: Metadata = {
  title: '我的布料收藏',
  description: '记录和管理购买的布料',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  themeColor: '#fafaf8',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>
        {children}
        <ToastContainer />
      </body>
    </html>
  )
}
```

- [ ] **步骤 3：在关键错误处理点引入 Toast**

在 `FabricForm.tsx` 的 catch 块中，将 `setError(...)` 替换或补充为：

```typescript
import { showToast } from '@/components/Toast'

// 在 fetch 失败时：
showToast('网络错误，请重试', 'error')
```

在 `FabricDetail.tsx` 的 delete catch 块中，将 `alert(...)` 替换为：

```typescript
import { showToast } from '@/components/Toast'

// 在删除失败时：
showToast('删除失败，请重试', 'error')
```

- [ ] **步骤 4：最终验证**

```bash
npm run dev
```

测试 Toast 在各种错误场景下的显示效果。

- [ ] **步骤 5：运行全部测试**

```bash
npx vitest run
```

预期：所有测试 PASS

- [ ] **步骤 6：Commit**

```bash
git add components/Toast.tsx components/Toast.module.css app/layout.tsx components/FabricForm.tsx components/FabricDetail.tsx
git commit -m "feat: add Toast notifications and error handling polish"
```

---

## 依赖顺序

```
任务 1 (脚手架) → 任务 2 (数据库) → 任务 3 (CRUD)
                                        ↓
                              任务 4 (API: 列表+新增)
                                        ↓
                              任务 5 (API: 单条操作)
                                        ↓
                              任务 6 (全局布局样式)
                                        ↓
                              任务 7 (卡片 + 首页)
                                        ↓
                              任务 8 (表单 + 添加页)
                                        ↓
                              任务 9 (详情页 + 编辑页)
                                        ↓
                              任务 10 (Toast + 收尾)
```

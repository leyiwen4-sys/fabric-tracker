import { createClient } from '@libsql/client'
import bcrypt from 'bcryptjs'

// Load .env file manually (no dotenv dependency needed for scripts)
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '..', '.env')
const envContent = readFileSync(envPath, 'utf-8')
const env = {}
for (const line of envContent.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eqIdx = trimmed.indexOf('=')
  if (eqIdx === -1) continue
  env[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1)
}

const url = env.TURSO_DATABASE_URL
const authToken = env.TURSO_AUTH_TOKEN

if (!url || !authToken) {
  console.error('Error: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set in .env')
  process.exit(1)
}

const db = createClient({ url, authToken })

function rowsToObjects(columns, rows) {
  return rows.map(row => {
    const obj = {}
    columns.forEach((col, i) => { obj[col] = row[i] })
    return obj
  })
}

// Create tables
await db.execute(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`)
await db.execute(`
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

// Create test user
const testEmail = 'test@fabric.app'
const testPassword = 'test123456'

let userId
const existingResult = await db.execute({ sql: 'SELECT id FROM users WHERE email = ?', args: [testEmail] })
const existing = rowsToObjects(existingResult.columns, existingResult.rows)

if (existing.length > 0) {
  userId = existing[0].id
  console.log(`Test user already exists: id=${userId}`)
  await db.execute({ sql: 'DELETE FROM fabrics WHERE user_id = ?', args: [userId] })
  console.log('Cleared existing fabrics')
} else {
  const hash = await bcrypt.hash(testPassword, 10)
  const result = await db.execute({
    sql: 'INSERT INTO users (email, password_hash) VALUES (?, ?)',
    args: [testEmail, hash],
  })
  userId = Number(result.lastInsertRowid)
  console.log(`Created test user: id=${userId}`)
}

// 9 fabrics
const fabrics = [
  { name: '玫瑰绒', type: '绒布', width: 150, unit: '米', price: 28, store: '布仓仓库', purchase_date: '2025-03-15', status: 'idle', notes: '手感柔软，适合做衬衫和连衣裙。颜色偏暖粉，垂感好。' },
  { name: '素色棉麻', type: '棉麻', width: 140, unit: '米', price: 22, store: '云纺布料行', purchase_date: '2025-02-20', status: 'used', notes: '透气性好，做了两条阔腿裤还剩大半。' },
  { name: '水墨印花真丝', type: '真丝', width: 114, unit: '米', price: 68, store: '苏罗绸缎庄', purchase_date: '2025-04-01', status: 'idle', notes: '苏州来的，水墨山水印花非常雅致，打算做一条旗袍。' },
  { name: '牛仔蓝厚棉', type: '棉布', width: 160, unit: '米', price: 35, store: '布仓仓库', purchase_date: '2025-01-10', status: 'empty', notes: '重磅牛仔，做了一件夹克和一条裙子，全部用完了。' },
  { name: '蕾丝花边', type: '蕾丝', width: 130, unit: '码', price: 15, store: '云纺布料行', purchase_date: '2025-05-08', status: 'idle', notes: '白色蕾丝，精致小花图案，做衣服内衬或装饰边用。' },
  { name: '羊毛双面呢', type: '毛呢', width: 150, unit: '米', price: 120, store: '恒源布业', purchase_date: '2024-11-20', status: 'idle', notes: '驼色双面呢，手感厚实。准备做一件冬天大衣。价格有点贵但值得。' },
  { name: '日系碎花棉布', type: '棉布', width: 110, unit: '米', price: 18, store: '洋风布屋', purchase_date: '2025-06-01', status: 'used', notes: '蓝底小白花，很清新的日系风格。给宝宝做了两件小裙子。' },
  { name: '弹力针织', type: '针织', width: 180, unit: '公斤', price: 45, store: '恒源布业', purchase_date: '2025-03-28', status: 'idle', notes: '莫兰迪绿，四面弹，做 T 恤和家居服的好料子。' },
  { name: '复古格子毛料', type: '毛料', width: 145, unit: '米', price: 88, store: '洋风布屋', purchase_date: '2025-04-15', status: 'used', notes: '苏格兰风格红绿格纹，含毛量高。做了一条半身裙。' },
]

for (const f of fabrics) {
  await db.execute({
    sql: `INSERT INTO fabrics (user_id, name, type, width, unit, price, store, purchase_date, status, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [userId, f.name, f.type, f.width, f.unit, f.price, f.store, f.purchase_date, f.status, f.notes],
  })
}

console.log(`Inserted ${fabrics.length} fabrics for user ${testEmail}`)
console.log('\n=== Seed Complete ===')
console.log(`  Email:    ${testEmail}`)
console.log(`  Password: ${testPassword}`)
console.log(`  Fabrics:  ${fabrics.length}`)

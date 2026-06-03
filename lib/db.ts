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
  // Migration: check if fabrics table needs updating
  const tableInfo = db.prepare("PRAGMA table_info('fabrics')").all() as { name: string }[]
  const hasUserId = tableInfo.some((col) => col.name === 'user_id')

  if (!hasUserId) {
    // Drop and recreate with user_id (dev-only approach)
    db.exec('DROP TABLE IF EXISTS fabrics')
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

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
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)
}

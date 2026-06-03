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

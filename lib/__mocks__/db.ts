// Vitest 手动 mock for @/lib/db — 内存数据库模拟
import { vi } from 'vitest'
import { createMockExecute } from '../../tests/db-mock'

export const execute = createMockExecute()

export const ensureSchema = vi.fn(async () => {})

export function rowsToObjects<T>(columns: string[], rows: unknown[][]): T[] {
  return rows.map(row => {
    const obj: Record<string, unknown> = {}
    columns.forEach((col, i) => { obj[col] = row[i] })
    return obj as T
  })
}

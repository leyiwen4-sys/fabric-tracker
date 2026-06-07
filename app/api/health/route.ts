import { NextResponse } from 'next/server'
import { execute, ensureSchema } from '@/lib/db'

export async function GET() {
  try {
    await ensureSchema()
    await execute('SELECT 1')
    return NextResponse.json({ ok: true, db: 'connected' })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 })
  }
}

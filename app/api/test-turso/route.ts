import { NextResponse } from 'next/server'

export async function GET() {
  const url = (process.env.TURSO_DATABASE_URL || '').replace('libsql://', 'https://') + '/v2/pipeline'
  const token = process.env.TURSO_AUTH_TOKEN || ''

  const results: any[] = []

  // Format 1: plain values
  try {
    const body = JSON.stringify({
      requests: [{ type: 'execute', stmt: { sql: 'SELECT ? as val', args: ['hello'] } }],
    })
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body })
    results.push({ format: 'plain strings', status: r.status, body: await r.text() })
  } catch (e: any) { results.push({ format: 'plain strings', error: e.message }) }

  // Format 2: typed objects
  try {
    const body = JSON.stringify({
      requests: [{ type: 'execute', stmt: { sql: 'SELECT ? as val', args: [{ type: 'text', value: 'hello' }] } }],
    })
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body })
    results.push({ format: 'typed {type,value}', status: r.status, body: await r.text() })
  } catch (e: any) { results.push({ format: 'typed {type,value}', error: e.message }) }

  return NextResponse.json(results)
}

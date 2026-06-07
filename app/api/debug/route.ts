import { NextResponse } from 'next/server'

const results: Record<string, string> = {}

try {
  const mod = await import('@/lib/db')
  results.lib_db = 'ok (functions: ' + Object.keys(mod).join(', ') + ')'
} catch (e: any) {
  results.lib_db = 'FAIL: ' + e.message
}

export async function GET() {
  return NextResponse.json(results)
}

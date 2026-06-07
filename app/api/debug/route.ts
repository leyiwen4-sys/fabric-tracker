import { NextResponse } from 'next/server'

const results: Record<string, string> = {}

// Test 1: bcryptjs
try {
  const bcrypt = await import('bcryptjs')
  const h = await bcrypt.default.hash('test', 1)
  results.bcryptjs = 'ok'
} catch (e: any) {
  results.bcryptjs = 'FAIL: ' + e.message
}

// Test 2: jose
try {
  const jose = await import('jose')
  results.jose = 'ok'
} catch (e: any) {
  results.jose = 'FAIL: ' + e.message
}

// Test 3: lib/auth
try {
  const auth = await import('@/lib/auth')
  results.lib_auth = 'ok'
} catch (e: any) {
  results.lib_auth = 'FAIL: ' + e.message
}

// Test 4: lib/db
try {
  const db = await import('@/lib/db')
  results.lib_db = 'ok'
} catch (e: any) {
  results.lib_db = 'FAIL: ' + e.message
}

export async function GET() {
  return NextResponse.json(results)
}

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await auth()
  const cookies = req.cookies.getAll().map(c => ({ name: c.name, value: c.value?.slice(0, 10) + '...' }))
  const url = req.url
  const headers = {
    host: req.headers.get('host') || '',
    origin: req.headers.get('origin') || '',
    referer: req.headers.get('referer') || ''
  }
  const env = {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || '',
    NODE_ENV: process.env.NODE_ENV || '',
  }
  return NextResponse.json({ ok: true, url, headers, cookies, env, session })
}

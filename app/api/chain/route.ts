import { NextRequest, NextResponse } from 'next/server'

const BASE = 'https://liteforge.explorer.caldera.xyz/api/v2'

export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get('path')
  if (!path) return NextResponse.json({ error: 'path required' }, { status: 400 })

  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 30 },
    })
    const data = await res.json()
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 's-maxage=30, stale-while-revalidate=60' },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch chain data' }, { status: 500 })
  }
}
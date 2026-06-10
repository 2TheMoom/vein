import { NextRequest, NextResponse } from 'next/server'
import { countTxsInPeriod, fetchStats } from '@/lib/blockscout'
import { isQueryAllowed, incrementQueryCount } from '@/lib/supabase'
import { FREE_QUERY_LIMIT } from '@/lib/blockscout'

const PERIODS: Record<string, number> = {
  '24h': 24,
  '7d': 168,
  '30d': 720,
}

// Cache results in memory per period (resets on cold start)
const cache: Record<string, { value: number; ts: number }> = {}
const CACHE_TTL = 30 * 60 * 1000 // 30 minutes

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get('wallet')?.toLowerCase()
  const period = req.nextUrl.searchParams.get('period') || '24h'

  if (!wallet) {
    return NextResponse.json({ error: 'wallet param required' }, { status: 400 })
  }

  const allowed = await isQueryAllowed(wallet)
  if (!allowed) {
    return NextResponse.json({
      error: 'Free query limit reached',
      message: `Send 0.005 zkLTC to 0x1a870eA7c2AEC156ff84c83fa4fD30bf9D6be5fb on LiteForge`,
      limit: FREE_QUERY_LIMIT,
    }, { status: 402 })
  }

  try {
    let count: number

    // 24h — use transactions_today from stats (fast, accurate)
    if (period === '24h') {
      const stats = await fetchStats()
      count = parseInt(stats.transactions_today)
    }
    // ALL — use total_transactions from stats (fast, accurate)
    else if (period === 'all') {
      const stats = await fetchStats()
      count = parseInt(stats.total_transactions)
    }
    // 7d / 30d — scan pages server-side with caching
    else {
      const hours = PERIODS[period]
      if (!hours) {
        return NextResponse.json({ error: 'Invalid period. Use 24h, 7d, 30d, or all' }, { status: 400 })
      }

      const cached = cache[period]
      if (cached && Date.now() - cached.ts < CACHE_TTL) {
        count = cached.value
      } else {
        count = await countTxsInPeriod(hours)
        cache[period] = { value: count, ts: Date.now() }
      }
    }

    await incrementQueryCount(wallet)

    return NextResponse.json(
      {
        period,
        transactionCount: count,
        cached: period !== '24h' && period !== 'all' && !!cache[period],
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 's-maxage=1800, stale-while-revalidate=3600',
        },
      }
    )
  } catch {
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 })
  }
}
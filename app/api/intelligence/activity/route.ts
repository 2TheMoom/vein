import { NextRequest, NextResponse } from 'next/server'
import { fetchStats, FREE_QUERY_LIMIT } from '@/lib/blockscout'
import { isQueryAllowed, incrementQueryCount, getQueryCount } from '@/lib/supabase'
import { consumeQueryOnChain } from '@/lib/viem'

// Internal system wallet — bypasses query limit for dashboard use
const SYSTEM_WALLET = '0x0000000000000000000000000000000000000001'

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get('wallet')?.toLowerCase()
  const period = req.nextUrl.searchParams.get('period') || '24h'

  if (!wallet) {
    return NextResponse.json({ error: 'wallet param required' }, { status: 400 })
  }

  const isSystem = wallet === SYSTEM_WALLET

  // Only check query limit for real user wallets
  if (!isSystem) {
    const allowed = await isQueryAllowed(wallet)
    if (!allowed) {
      return NextResponse.json({
        error: 'Free query limit reached',
        message: `Call purchaseCredits() on VeinRegistry sending 0.005 zkLTC per credit, then POST /api/intelligence/confirm with your wallet`,
        contract: process.env.NEXT_PUBLIC_VEIN_REGISTRY_ADDRESS,
        limit: FREE_QUERY_LIMIT,
      }, { status: 402 })
    }
  }

  try {
    const stats = await fetchStats()
    const txsToday = parseInt(stats.transactions_today)
    const totalTxs = parseInt(stats.total_transactions)

    let transactionCount: number
    let estimated = false

    switch (period) {
      case '24h':
        transactionCount = txsToday
        estimated = false
        break
      case '7d':
        transactionCount = Math.round(txsToday * 7)
        estimated = true
        break
      case '30d':
        transactionCount = Math.round(txsToday * 30)
        estimated = true
        break
      case 'all':
        transactionCount = totalTxs
        estimated = false
        break
      default:
        transactionCount = txsToday
        estimated = false
    }

    // Only increment for real user wallets
    let queryInfo = null
    if (!isSystem) {
      await incrementQueryCount(wallet)
      await consumeQueryOnChain(wallet)
      const usedCount = await getQueryCount(wallet)
      const remaining = Math.max(0, FREE_QUERY_LIMIT - usedCount)
      queryInfo = {
        freeQueriesUsed: usedCount,
        freeQueriesRemaining: remaining,
        freeQueryLimit: FREE_QUERY_LIMIT,
      }
    }

    return NextResponse.json({
      period,
      transactionCount,
      estimated,
      note: estimated ? 'Estimated from daily average' : 'Exact value from chain',
      timestamp: new Date().toISOString(),
      ...(queryInfo ? { queryInfo } : {}),
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 })
  }
}
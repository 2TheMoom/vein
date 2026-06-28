import { NextRequest, NextResponse } from 'next/server'
import { fetchStats, FREE_QUERY_LIMIT } from '@/lib/blockscout'
import { isQueryAllowed, incrementQueryCount, getQueryCount } from '@/lib/supabase'
import { consumeQueryOnChain } from '@/lib/viem'

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get('wallet')?.toLowerCase()

  if (!wallet) {
    return NextResponse.json({ error: 'wallet param required' }, { status: 400 })
  }

  const allowed = await isQueryAllowed(wallet)
  if (!allowed) {
    return NextResponse.json({
      error: 'Free query limit reached',
      message: `Call purchaseCredits() on VeinRegistry sending 0.005 zkLTC per credit, then POST /api/intelligence/confirm with your wallet`,
      contract: process.env.NEXT_PUBLIC_VEIN_REGISTRY_ADDRESS,
      limit: FREE_QUERY_LIMIT,
    }, { status: 402 })
  }

  try {
    const stats = await fetchStats()
    await incrementQueryCount(wallet)
    await consumeQueryOnChain(wallet)

    // Get updated count after increment to compute remaining
    const usedCount = await getQueryCount(wallet)
    const remaining = Math.max(0, FREE_QUERY_LIMIT - usedCount)

    return NextResponse.json({
      totalTransactions: stats.total_transactions,
      totalAddresses: stats.total_addresses,
      totalBlocks: stats.total_blocks,
      transactionsToday: stats.transactions_today,
      avgBlockTimeMs: stats.average_block_time,
      gasUsedToday: stats.gas_used_today,
      totalGasUsed: stats.total_gas_used,
      networkUtilization: stats.network_utilization_percentage,
      gasPrices: stats.gas_prices,
      timestamp: new Date().toISOString(),
      chain: 'LiteForge',
      chainId: 4441,
      queryInfo: {
        freeQueriesUsed: usedCount,
        freeQueriesRemaining: remaining,
        freeQueryLimit: FREE_QUERY_LIMIT,
      },
    })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { fetchStats } from '@/lib/blockscout'
import { isQueryAllowed, incrementQueryCount } from '@/lib/supabase'
import { FREE_QUERY_LIMIT } from '@/lib/blockscout'

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get('wallet')?.toLowerCase()

  if (!wallet) {
    return NextResponse.json({ error: 'wallet param required' }, { status: 400 })
  }

  const allowed = await isQueryAllowed(wallet)
  if (!allowed) {
    return NextResponse.json({
      error: 'Free query limit reached',
      message: `Send 0.005 zkLTC to 0x1a870eA7c2AEC156ff84c83fa4fD30bf9D6be5fb on LiteForge to continue`,
      limit: FREE_QUERY_LIMIT,
    }, { status: 402 })
  }

  try {
    const stats = await fetchStats()
    await incrementQueryCount(wallet)

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
    })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
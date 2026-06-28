import { NextRequest, NextResponse } from 'next/server'
import { fetchStats, fetchTokenTransfers, WZKLTC_ADDRESS, countTxsInPeriod } from '@/lib/blockscout'
import { isQueryAllowed, incrementQueryCount } from '@/lib/supabase'
import { FREE_QUERY_LIMIT } from '@/lib/blockscout'
import { consumeQueryOnChain } from '@/lib/viem'

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get('wallet')?.toLowerCase()
  if (!wallet) return NextResponse.json({ error: 'wallet param required' }, { status: 400 })

  const allowed = await isQueryAllowed(wallet)
  if (!allowed) {
    return NextResponse.json({
      error: 'Free query limit reached',
      message: `Send 0.005 zkLTC to 0x1a870eA7c2AEC156ff84c83fa4fD30bf9D6be5fb on LiteForge`,
      limit: FREE_QUERY_LIMIT,
    }, { status: 402 })
  }

  try {
    const [stats, transfers7d, txCount7d] = await Promise.all([
      fetchStats(),
      fetchTokenTransfers(WZKLTC_ADDRESS),
      countTxsInPeriod(168),
    ])

    const wzkltcItems = transfers7d.items || []
    let rawVolume = BigInt(0)
    for (const t of wzkltcItems) {
      if (t.total?.value) rawVolume += BigInt(t.total.value)
    }
    const volume = Number(rawVolume) / 1e18
    const bridgeCount = wzkltcItems.filter((t: any) => t.type === 'token_minting').length

    const now = new Date()
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    await incrementQueryCount(wallet)
    await consumeQueryOnChain(wallet)

    return NextResponse.json({
      week: `Week ending ${now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`,
      period: `${weekStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`,
      stats: {
        totalTransactions: stats.total_transactions,
        transactionsThisWeek: txCount7d,
        totalAddresses: stats.total_addresses,
        avgBlockTimeMs: stats.average_block_time,
        avgGasPrice: stats.gas_prices?.average,
        networkUtilization: stats.network_utilization_percentage,
      },
      zkltc: {
        weeklyVolume: volume.toFixed(4),
        bridgeInteractions: bridgeCount,
        transfers: wzkltcItems.length,
      },
      timestamp: now.toISOString(),
    })
  } catch {
    return NextResponse.json({ error: 'Failed to generate weekly report' }, { status: 500 })
  }
}
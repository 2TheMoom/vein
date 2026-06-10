import { NextRequest, NextResponse } from 'next/server'
import { fetchSmartContracts, fetchTransactions, classifyMethod } from '@/lib/blockscout'
import { isQueryAllowed, incrementQueryCount } from '@/lib/supabase'
import { FREE_QUERY_LIMIT } from '@/lib/blockscout'

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
    const [contracts, txData] = await Promise.all([
      fetchSmartContracts(),
      fetchTransactions(),
    ])

    // Count method categories from recent txs
    const methodCounts: Record<string, number> = {}
    for (const tx of txData.items || []) {
      const cat = classifyMethod(tx.method)
      methodCounts[cat] = (methodCounts[cat] || 0) + 1
    }
    const total = Object.values(methodCounts).reduce((a, b) => a + b, 0)

    // Top contracts by tx count
    const topContracts = (contracts.items || [])
      .filter((c: any) => c.transaction_count > 0)
      .sort((a: any, b: any) => (b.transaction_count || 0) - (a.transaction_count || 0))
      .slice(0, 10)
      .map((c: any) => ({
        address: c.address.hash,
        name: c.address.name,
        txCount: c.transaction_count,
        verifiedAt: c.verified_at,
      }))

    await incrementQueryCount(wallet)

    return NextResponse.json({
      topContracts,
      methodBreakdown: Object.entries(methodCounts).map(([method, count]) => ({
        method,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      })).sort((a, b) => b.count - a.count),
      timestamp: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch dApp data' }, { status: 500 })
  }
}
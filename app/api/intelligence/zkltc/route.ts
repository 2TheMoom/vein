import { NextRequest, NextResponse } from 'next/server'
import { fetchTokenTransfers, WZKLTC_ADDRESS, FREE_QUERY_LIMIT } from '@/lib/blockscout'
import { isQueryAllowed, incrementQueryCount, getQueryCount } from '@/lib/supabase'
import { consumeQueryOnChain } from '@/lib/viem'

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get('wallet')?.toLowerCase()
  if (!wallet) return NextResponse.json({ error: 'wallet param required' }, { status: 400 })

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
    // Fetch token info + recent transfers for wzkLTC
    const [transfers, allTransfers] = await Promise.all([
      fetchTokenTransfers(WZKLTC_ADDRESS),
      fetchTokenTransfers(),
    ])

    const wzkltcItems = transfers.items || []

    // Pull token metadata from first transfer item
    const tokenMeta = wzkltcItems[0]?.token || null

    // Sum raw volume from recent page
    let rawVolume = BigInt(0)
    for (const t of wzkltcItems) {
      if (t.total?.value) rawVolume += BigInt(t.total.value)
    }
    const decimals = tokenMeta?.decimals ? parseInt(tokenMeta.decimals) : 18
    const volume = Number(rawVolume) / Math.pow(10, decimals)

    // Bridge interactions: token_minting events = bridging in
    const bridgeCount = wzkltcItems.filter((t: any) => t.type === 'token_minting').length

    await incrementQueryCount(wallet)
    await consumeQueryOnChain(wallet)

    const usedCount = await getQueryCount(wallet)
    const remaining = Math.max(0, FREE_QUERY_LIMIT - usedCount)

    return NextResponse.json({
      contract: WZKLTC_ADDRESS,
      symbol: tokenMeta?.symbol || 'wzkLTC',
      name: tokenMeta?.name || 'Wrapped zkLTC',
      totalSupply: tokenMeta?.total_supply || null,
      holders: tokenMeta?.holders || null,
      recentTransfers: wzkltcItems.length,
      recentVolume: volume.toFixed(6),
      bridgeInteractions: bridgeCount,
      timestamp: new Date().toISOString(),
      queryInfo: {
        freeQueriesUsed: usedCount,
        freeQueriesRemaining: remaining,
        freeQueryLimit: FREE_QUERY_LIMIT,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch zkLTC data' }, { status: 500 })
  }
}
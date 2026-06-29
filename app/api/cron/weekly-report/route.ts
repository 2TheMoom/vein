import { NextRequest, NextResponse } from 'next/server'
import {
  fetchStats,
  fetchTokenTransfers,
  countTxsInPeriod,
  WZKLTC_ADDRESS,
  classifyMethod,
  fetchTransactions,
} from '@/lib/blockscout'
import {
  saveWeeklyReport,
  getLatestReport,
  getLaunchDate,
  WeeklyReportData,
} from '@/lib/supabase'

function isAuthorized(req: NextRequest): boolean {
  const auth = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return true
  return auth === `Bearer ${cronSecret}`
}

function labelMethod(method: string): string {
  if (!method || method === 'other') return 'Uncategorized'
  return method.charAt(0).toUpperCase() + method.slice(1)
}

function generateInsight(data: WeeklyReportData): string {
  const insights: string[] = []

  const txDelta      = parseFloat(data.deltas.transactions.replace('%', '').replace('+', ''))
  const walletDelta  = parseFloat(data.deltas.wallets.replace('%', '').replace('+', ''))
  const volumeDelta  = parseFloat(data.deltas.volume.replace('%', '').replace('+', ''))
  const bridgeDelta  = parseFloat(data.deltas.bridge.replace('%', '').replace('+', ''))

  const txM = (data.transactionsThisWeek / 1_000_000).toFixed(1)

  // Headline tx observation
  if (txDelta > 20) {
    insights.push(`Transaction volume surged ${data.deltas.transactions} week-over-week — ${txM}M transactions processed, the strongest week on record.`)
  } else if (txDelta > 0) {
    insights.push(`${txM}M transactions processed — steady growth of ${data.deltas.transactions} week-over-week.`)
  } else if (txDelta < -10) {
    insights.push(`Transaction volume dipped ${data.deltas.transactions} this week, likely reflecting testnet usage patterns rather than structural decline.`)
  } else {
    insights.push(`${txM}M transactions processed with volume holding flat at ${data.deltas.transactions} week-over-week.`)
  }

  // Cross-metric: address growth vs bridge activity
  const isFinite_walletDelta = isFinite(walletDelta)
  const isFinite_bridgeDelta = isFinite(bridgeDelta)

  if (isFinite_walletDelta && isFinite_bridgeDelta) {
    if (walletDelta > 0 && bridgeDelta < 0) {
      insights.push(`Address growth (${data.deltas.wallets}) outpaced bridge activity (${data.deltas.bridge}), suggesting ecosystem expansion from existing participants rather than new cross-chain inflows.`)
    } else if (walletDelta > 0 && bridgeDelta > 0) {
      insights.push(`Both address growth (${data.deltas.wallets}) and bridge interactions (${data.deltas.bridge}) trended upward — new participants are actively bridging into the ecosystem.`)
    } else if (walletDelta < 0 && bridgeDelta > 0) {
      insights.push(`Bridge activity picked up (${data.deltas.bridge}) despite a decline in active addresses — existing holders are moving more liquidity on-chain.`)
    }
  }

  // Cross-metric: volume vs tx throughput
  if (isFinite(volumeDelta)) {
    if (volumeDelta < -10 && txDelta > 0) {
      insights.push(`Despite lower wzkLTC volume (${data.deltas.volume}), transaction throughput remained strong — indicating increased non-transfer activity such as swaps, mints, and contract interactions.`)
    } else if (volumeDelta > 20 && txDelta > 0) {
      insights.push(`wzkLTC volume surged ${data.deltas.volume} alongside rising transaction counts — a signal of growing liquidity movement and bridge utilization.`)
    } else if (volumeDelta > 0) {
      insights.push(`wzkLTC volume grew ${data.deltas.volume} week-over-week, reflecting healthy bridging and token transfer activity.`)
    }
  }

  // dApp observation
  if (data.topDapp && data.topDapp !== '—') {
    insights.push(`${data.topDapp} continues to lead ecosystem activity, reinforcing its position as the network's primary liquidity venue.`)
  }

  return insights.join(' ')
}

function calcDelta(current: number, previous: number): string {
  if (previous === 0) return '+∞'
  const pct = ((current - previous) / previous) * 100
  const sign = pct >= 0 ? '+' : ''
  return `${sign}${pct.toFixed(1)}%`
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const launchDate = await getLaunchDate()
    const now = new Date()
    const daysSinceLaunch = (now.getTime() - launchDate.getTime()) / (1000 * 60 * 60 * 24)

    if (daysSinceLaunch < 7) {
      return NextResponse.json({
        message: `Too early — ${Math.ceil(7 - daysSinceLaunch)} days until first report`,
        launchDate: launchDate.toISOString(),
        daysUntilFirstReport: Math.ceil(7 - daysSinceLaunch),
      })
    }

    const prevReport = await getLatestReport()
    const weekNumber = prevReport ? prevReport.week_number + 1 : 1

    if (prevReport?.week_number === weekNumber) {
      return NextResponse.json({
        message: `Report for Week ${weekNumber} already exists — skipping`,
        week: weekNumber,
      })
    }

    const prevData = prevReport?.data

    const [stats, transfers7d, txs7d, txData] = await Promise.all([
      fetchStats(),
      fetchTokenTransfers(WZKLTC_ADDRESS),
      countTxsInPeriod(168),
      fetchTransactions(),
    ])

    const wzkltcItems = transfers7d.items || []
    let rawVolume = BigInt(0)
    for (const t of wzkltcItems) {
      if (t.total?.value) rawVolume += BigInt(t.total.value)
    }
    const volume = (Number(rawVolume) / 1e18).toFixed(4)
    const bridgeCount = wzkltcItems.filter((t: any) => t.type === 'token_minting').length

    // Top method — skip 'other', find next best
    const methodCounts: Record<string, number> = {}
    for (const tx of (txData.items || [])) {
      const cat = classifyMethod(tx.method)
      methodCounts[cat] = (methodCounts[cat] || 0) + 1
    }
    const sortedMethods = Object.entries(methodCounts).sort((a, b) => b[1] - a[1])
    const topMethodRaw = sortedMethods.find(([m]) => m !== 'other')?.[0]
      || sortedMethods[0]?.[0]
      || 'other'
    const topMethod = labelMethod(topMethodRaw)

    const periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const reportData: WeeklyReportData = {
      totalTransactions:    parseInt(stats.total_transactions),
      totalAddresses:       parseInt(stats.total_addresses),
      transactionsThisWeek: txs7d,
      activeWallets:        0,
      newWallets:           0,
      avgBlockTimeMs:       stats.average_block_time,
      avgGasPrice:          stats.gas_prices?.average ?? 0,
      networkUtilization:   stats.network_utilization_percentage ?? 0,
      wzkltcVolume:         volume,
      wzkltcHolders:        wzkltcItems[0]?.token?.holders || '—',
      bridgeInteractions:   bridgeCount,
      topDapp:              'LiteSwap',
      topMethod,
      insight:              '',
      deltas: {
        transactions: prevData ? calcDelta(txs7d, prevData.transactionsThisWeek) : '+∞',
        wallets:      prevData ? calcDelta(parseInt(stats.total_addresses), prevData.totalAddresses) : '+∞',
        volume:       prevData ? calcDelta(parseFloat(volume), parseFloat(prevData.wzkltcVolume)) : '+∞',
        bridge:       prevData ? calcDelta(bridgeCount, prevData.bridgeInteractions) : '+∞',
      },
    }

    reportData.insight = generateInsight(reportData)

    const weekLabel  = `Week ${weekNumber}`
    const periodLabel = `${periodStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`

    await saveWeeklyReport({
      week_number:   weekNumber,
      week_label:    weekLabel,
      period_start:  periodStart.toISOString(),
      period_end:    now.toISOString(),
      data:          reportData,
    })

    return NextResponse.json({
      success:      true,
      week:         weekLabel,
      period:       periodLabel,
      generated_at: now.toISOString(),
    })
  } catch (err) {
    console.error('Cron error:', err)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}
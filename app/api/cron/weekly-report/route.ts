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
  getWeekNumber,
  WeeklyReportData,
} from '@/lib/supabase'

// Protect cron from unauthorized calls
function isAuthorized(req: NextRequest): boolean {
  const auth = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return true // dev mode
  return auth === `Bearer ${cronSecret}`
}

function generateInsight(data: WeeklyReportData): string {
  const insights: string[] = []

  if (data.transactionsThisWeek > 1_000_000) {
    insights.push(`Strong week — ${(data.transactionsThisWeek / 1_000_000).toFixed(1)}M transactions processed.`)
  }

  const deltaNum = parseFloat(data.deltas.transactions.replace('%', '').replace('+', ''))
  if (deltaNum > 20) {
    insights.push(`Transaction volume surged ${data.deltas.transactions} week-over-week.`)
  } else if (deltaNum < -10) {
    insights.push(`Transaction volume dipped ${data.deltas.transactions} — likely seasonal testnet pattern.`)
  } else {
    insights.push(`Transaction volume held steady at ${data.deltas.transactions} week-over-week.`)
  }

  insights.push(`${data.topDapp} led dApp activity. ${data.topMethod} dominated at the method level.`)

  if (data.bridgeInteractions > 100) {
    insights.push(`Bridge activity healthy with ${data.bridgeInteractions} interactions.`)
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
    const prevReport = await getLatestReport()
    const weekNumber = prevReport ? prevReport.week_number + 1 : 1
    const daysSinceLaunch = (now.getTime() - launchDate.getTime()) / (1000 * 60 * 60 * 24)

    // Skip if report already exists for this week
  const prevReport = await getLatestReport()
  if (prevReport?.week_number === weekNumber) {
    return NextResponse.json({
    message: `Report for Week ${weekNumber} already exists — skipping`,
    week: weekNumber,
  })
}

    // Don't generate until at least 7 days after launch
    if (daysSinceLaunch < 7) {
      return NextResponse.json({
        message: `Too early — ${Math.ceil(7 - daysSinceLaunch)} days until first report`,
        launchDate: launchDate.toISOString(),
        daysUntilFirstReport: Math.ceil(7 - daysSinceLaunch),
      })
    }

    // Get previous report for deltas
    const prevReport = await getLatestReport()
    const prevData = prevReport?.data

    // Fetch current week data in parallel
    const [stats, transfers7d, txs7d, txData] = await Promise.all([
      fetchStats(),
      fetchTokenTransfers(WZKLTC_ADDRESS),
      countTxsInPeriod(168),
      fetchTransactions(),
    ])

    // zkLTC volume
    const wzkltcItems = transfers7d.items || []
    let rawVolume = BigInt(0)
    for (const t of wzkltcItems) {
      if (t.total?.value) rawVolume += BigInt(t.total.value)
    }
    const volume = (Number(rawVolume) / 1e18).toFixed(4)
    const bridgeCount = wzkltcItems.filter((t: any) => t.type === 'token_minting').length

    // Top method from recent txs
    const methodCounts: Record<string, number> = {}
    for (const tx of (txData.items || [])) {
      const cat = classifyMethod(tx.method)
      methodCounts[cat] = (methodCounts[cat] || 0) + 1
    }
    const topMethod = Object.entries(methodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'swap'

    const periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const reportData: WeeklyReportData = {
      totalTransactions: parseInt(stats.total_transactions),
      totalAddresses: parseInt(stats.total_addresses),
      transactionsThisWeek: txs7d,
      activeWallets: 0, // requires indexer — set to 0 until available
      newWallets: 0,
      avgBlockTimeMs: stats.average_block_time,
      avgGasPrice: stats.gas_prices?.average ?? 0,
      networkUtilization: stats.network_utilization_percentage ?? 0,
      wzkltcVolume: volume,
      wzkltcHolders: wzkltcItems[0]?.token?.holders || '—',
      bridgeInteractions: bridgeCount,
      topDapp: 'LiteSwap',
      topMethod,
      insight: '',
      deltas: {
        transactions: prevData
          ? calcDelta(txs7d, prevData.transactionsThisWeek)
          : '+∞',
        wallets: prevData
          ? calcDelta(parseInt(stats.total_addresses), prevData.totalAddresses)
          : '+∞',
        volume: prevData
          ? calcDelta(parseFloat(volume), parseFloat(prevData.wzkltcVolume))
          : '+∞',
        bridge: prevData
          ? calcDelta(bridgeCount, prevData.bridgeInteractions)
          : '+∞',
      },
    }

    // Generate insight after deltas are computed
    reportData.insight = generateInsight(reportData)

    const weekLabel = `Week ${weekNumber}`
    const periodLabel = `${periodStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`

    await saveWeeklyReport({
      week_number: weekNumber,
      week_label: weekLabel,
      period_start: periodStart.toISOString(),
      period_end: now.toISOString(),
      data: reportData,
    })

    return NextResponse.json({
      success: true,
      week: weekLabel,
      period: periodLabel,
      generated_at: now.toISOString(),
    })
  } catch (err) {
    console.error('Cron error:', err)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}
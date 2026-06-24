import { NextResponse } from 'next/server'

const BASE = 'https://liteforge.explorer.caldera.xyz/api/v2'

/**
 * GET /api/growth
 * Fetches daily transaction chart data from Blockscout
 * Returns last 30 days of daily tx counts
 */
export async function GET() {
  try {
    const res = await fetch(`${BASE}/stats/charts/transactions`, {
      next: { revalidate: 3600 }, // cache 1 hour
      headers: { 'Accept': 'application/json' },
    })

    if (!res.ok) {
      // Fallback — return empty if endpoint not available
      return NextResponse.json({ chart_data: [], available: false })
    }

    const data = await res.json()

    // Blockscout returns { chart_data: [{ date, tx_count, pending_tx_count }] }
    const chart = (data.chart_data || []).map((d: any) => ({
      date:    d.date,
      txCount: parseInt(d.tx_count || '0'),
    }))

    return NextResponse.json({ chart_data: chart, available: true })
  } catch (e) {
    console.error('Growth chart error:', e)
    return NextResponse.json({ chart_data: [], available: false })
  }
}
import { createClient, SupabaseClient } from '@supabase/supabase-js'

function getAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
  return createClient(url, key)
}

// ── Query tracking ───────────────────────────────────────────────

export async function getQueryCount(wallet: string): Promise<number> {
  const db = getAdmin()
  const { data } = await db
    .from('vein_queries')
    .select('count')
    .eq('wallet', wallet.toLowerCase())
    .single()
  return data?.count ?? 0
}

export async function incrementQueryCount(wallet: string): Promise<number> {
  const db = getAdmin()
  const current = await getQueryCount(wallet)
  const newCount = current + 1
  await db.from('vein_queries').upsert(
    { wallet: wallet.toLowerCase(), count: newCount, last_query: new Date().toISOString() },
    { onConflict: 'wallet' }
  )
  return newCount
}

export async function isQueryAllowed(wallet: string): Promise<boolean> {
  const count = await getQueryCount(wallet)
  return count < 5
}

export async function confirmPayment(wallet: string, txId: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://liteforge.explorer.caldera.xyz/api/v2/transactions/${txId}`
    )
    if (!res.ok) return false
    const tx = await res.json()
    const DEST = '0x1a870eA7c2AEC156ff84c83fa4fD30bf9D6be5fb'
    if (tx.to?.hash?.toLowerCase() !== DEST.toLowerCase()) return false
    if (tx.status !== 'ok') return false
    const db = getAdmin()
    const current = await getQueryCount(wallet)
    await db.from('vein_queries').upsert(
      {
        wallet: wallet.toLowerCase(),
        count: Math.max(0, current - 1),
        last_query: new Date().toISOString(),
        last_payment_tx: txId,
      },
      { onConflict: 'wallet' }
    )
    return true
  } catch {
    return false
  }
}

// ── Weekly reports ───────────────────────────────────────────────

export interface WeeklyReportRow {
  id: number
  week_number: number
  week_label: string
  period_start: string
  period_end: string
  data: WeeklyReportData
  generated_at: string
}

export interface WeeklyReportData {
  totalTransactions: number
  totalAddresses: number
  transactionsThisWeek: number
  activeWallets: number
  newWallets: number
  avgBlockTimeMs: number
  avgGasPrice: number
  networkUtilization: number
  wzkltcVolume: string
  wzkltcHolders: string
  bridgeInteractions: number
  topDapp: string
  topMethod: string
  insight: string
  // deltas vs previous week
  deltas: {
    transactions: string
    wallets: string
    volume: string
    bridge: string
  }
}

export async function saveWeeklyReport(report: Omit<WeeklyReportRow, 'id' | 'generated_at'>): Promise<void> {
  const db = getAdmin()
  await db.from('vein_reports').insert(report)
}

export async function getLatestReport(): Promise<WeeklyReportRow | null> {
  const db = getAdmin()
  const { data } = await db
    .from('vein_reports')
    .select('*')
    .order('week_number', { ascending: false })
    .limit(1)
    .single()
  return data || null
}

export async function getAllReports(): Promise<WeeklyReportRow[]> {
  const db = getAdmin()
  const { data } = await db
    .from('vein_reports')
    .select('*')
    .order('week_number', { ascending: false })
  return data || []
}

export async function getReportByWeek(weekNumber: number): Promise<WeeklyReportRow | null> {
  const db = getAdmin()
  const { data } = await db
    .from('vein_reports')
    .select('*')
    .eq('week_number', weekNumber)
    .single()
  return data || null
}

export async function getLaunchDate(): Promise<Date> {
  const db = getAdmin()
  const { data } = await db
    .from('vein_config')
    .select('value')
    .eq('key', 'launch_date')
    .single()
  return data?.value ? new Date(data.value) : new Date()
}

export async function getWeekNumber(): Promise<number> {
  const launchDate = await getLaunchDate()
  const now = new Date()
  const diffMs = now.getTime() - launchDate.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  return Math.floor(diffDays / 7)
}
const BASE    = 'https://liteforge.explorer.caldera.xyz/api/v2'
export const RPC = 'https://liteforge.rpc.caldera.xyz/http'

export const WZKLTC_ADDRESS      = '0x315374AA9b5536037Cc1Efeea2439CCC0913A77e'
export const CHAIN_ID            = 4441
export const PAYMENT_DESTINATION = '0x1a870eA7c2AEC156ff84c83fa4fD30bf9D6be5fb'
export const QUERY_PRICE_ZKLTC   = 0.005
export const FREE_QUERY_LIMIT    = 5

// Detect if we're running server-side or client-side
const isServer = typeof window === 'undefined'

async function get<T>(path: string): Promise<T> {
  if (isServer) {
    // Server-side: call Blockscout directly (no CORS)
    const res = await fetch(`${BASE}${path}`, {
      next: { revalidate: 30 },
      headers: { 'Accept': 'application/json' },
    })
    if (!res.ok) throw new Error(`Blockscout error: ${res.status} ${path}`)
    return res.json()
  } else {
    // Client-side: route through our own proxy to avoid CORS
    const encoded = encodeURIComponent(path)
    const res = await fetch(`/api/chain?path=${encoded}`)
    if (!res.ok) throw new Error(`Proxy error: ${res.status} ${path}`)
    return res.json()
  }
}

export async function fetchStats() {
  return get<any>('/stats')
}

export async function fetchTransactions(params?: string) {
  return get<{ items: any[]; next_page_params: any }>(
    `/transactions?filter=validated${params ? '&' + params : ''}`
  )
}

export async function fetchTokenTransfers(tokenAddress?: string) {
  const q = tokenAddress ? `?token[]=${tokenAddress}` : ''
  return get<{ items: any[]; next_page_params: any }>(`/token-transfers${q}`)
}

export async function fetchSmartContracts() {
  return get<{ items: any[]; next_page_params: any }>('/smart-contracts')
}

export async function fetchBlock(blockNumber: number) {
  return get<any>(`/blocks/${blockNumber}`)
}

export async function countTxsInPeriod(hoursAgo: number): Promise<number> {
  try {
    const stats = await fetchStats()
    if (hoursAgo <= 24)   return parseInt(stats.transactions_today)
    if (hoursAgo >= 8760) return parseInt(stats.total_transactions)
    const txsToday = parseInt(stats.transactions_today)
    return Math.round((txsToday / 24) * hoursAgo)
  } catch {
    return 0
  }
}

export function classifyMethod(method: string | null): string {
  if (!method) return 'transfer'
  const m = method.toLowerCase()
  if (m.includes('swap') || m.includes('exchange')) return 'swap'
  if (m.includes('mint') || m.includes('lazymint')) return 'mint'
  if (m.includes('deposit') || m.includes('addliquidity') || m.includes('stake')) return 'deposit'
  if (m.includes('bridge') || m.includes('relay') || m.includes('cross')) return 'bridge'
  if (m.includes('transfer') || m.includes('approve') || m.includes('send')) return 'transfer'
  if (m.includes('withdraw') || m.includes('remove')) return 'withdraw'
  return 'other'
}

export function formatNumber(n: string | number): string {
  const num = typeof n === 'string' ? parseFloat(n) : n
  if (isNaN(num)) return '—'
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M'
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K'
  return num.toLocaleString()
}
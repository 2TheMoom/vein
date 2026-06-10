const BASE = 'https://liteforge.explorer.caldera.xyz/api/v2'

export const WZKLTC_ADDRESS = '0x315374AA9b5536037Cc1Efeea2439CCC0913A77e'
export const CHAIN_ID = 4441
export const PAYMENT_DESTINATION = '0x1a870eA7c2AEC156ff84c83fa4fD30bf9D6be5fb'
export const QUERY_PRICE_ZKLTC = 0.005
export const FREE_QUERY_LIMIT = 5

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    next: { revalidate: 30 },
    headers: { 'Accept': 'application/json' },
  })
  if (!res.ok) throw new Error(`Blockscout error: ${res.status} ${path}`)
  return res.json()
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

/**
 * Estimate tx count for a period using block-based approach.
 * Much faster than scanning pages — uses block timestamps to find
 * the starting block, then calculates tx count from total.
 */
export async function countTxsInPeriod(hoursAgo: number): Promise<number> {
  try {
    const stats = await fetchStats()
    const totalTxs = parseInt(stats.total_transactions)
    const totalBlocks = parseInt(stats.total_blocks)

    // ALL time
    if (hoursAgo >= 8760) return totalTxs

    // For 24h use transactions_today (most accurate)
    if (hoursAgo <= 24) return parseInt(stats.transactions_today)

    // Find approximate block at start of period
    // Average block time in ms
    const avgBlockMs = stats.average_block_time || 150
    const blocksInPeriod = Math.floor((hoursAgo * 3600 * 1000) / avgBlockMs)
    const startBlock = Math.max(1, totalBlocks - blocksInPeriod)

    // Fetch the start block to verify timestamp
    const blockData = await fetchBlock(startBlock)
    const blockTimestamp = new Date(blockData.timestamp).getTime()
    const now = Date.now()
    const cutoff = now - hoursAgo * 3600 * 1000

    // If block timestamp is close to our cutoff, count txs from there
    // We use the block's transaction count accumulated
    // Fetch a recent page and the start block page to estimate
    const recentData = await get<{ items: any[]; next_page_params: any }>(
      `/transactions?filter=validated`
    )

    if (!recentData.items?.length) return 0

    // Get the latest block number with txs
    const latestBlock = recentData.items[0]?.block_number || totalBlocks

    // Fetch transactions around the start block to count
    // Use block number filter for accuracy
    let count = 0
    let pageParams = ''
    let pages = 0
    const maxPages = 40 // scan more pages for accuracy

    while (pages < maxPages) {
      const data = await get<{ items: any[]; next_page_params: any }>(
        `/transactions?filter=validated${pageParams}`
      )
      if (!data.items?.length) break

      for (const tx of data.items) {
        const txTime = new Date(tx.timestamp).getTime()
        if (txTime >= cutoff) {
          count++
        } else {
          // Hit the cutoff boundary — return count
          return count
        }
      }

      if (!data.next_page_params) break
      const p = data.next_page_params
      pageParams = `&block_number=${p.block_number}&index=${p.index}&items_count=${p.items_count}`
      pages++
    }

    // If we scanned all pages without hitting cutoff, use block-based estimate
    // This handles high-volume periods where page scanning isn't enough
    const avgTxPerBlock = totalTxs / totalBlocks
    const estimatedCount = Math.round(avgTxPerBlock * blocksInPeriod)
    return estimatedCount

  } catch (e) {
    console.error('countTxsInPeriod error:', e)
    // Fallback: estimate from average
    const stats = await fetchStats()
    const totalTxs = parseInt(stats.total_transactions)
    const totalBlocks = parseInt(stats.total_blocks)
    const avgBlockMs = stats.average_block_time || 150
    const blocksInPeriod = Math.floor((hoursAgo * 3600 * 1000) / avgBlockMs)
    const avgTxPerBlock = totalTxs / totalBlocks
    return Math.round(avgTxPerBlock * blocksInPeriod)
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
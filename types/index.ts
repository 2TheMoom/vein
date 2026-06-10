export interface ChainStats {
  average_block_time: number
  gas_prices: { slow: number; average: number; fast: number }
  gas_used_today: string
  network_utilization_percentage: number
  total_addresses: string
  total_blocks: string
  total_gas_used: string
  total_transactions: string
  transactions_today: string
}

export interface Transaction {
  hash: string
  method: string | null
  from: { hash: string; is_contract: boolean }
  to: { hash: string; name: string | null; is_contract: boolean } | null
  value: string
  timestamp: string
  block_number: number
  status: string
  transaction_types: string[]
}

export interface TokenTransfer {
  token: {
    address: string
    name: string
    symbol: string
    decimals: string
    holders: string
    total_supply: string
  }
  total: { value: string; decimals: string }
  type: string
  timestamp: string
  transaction_hash: string
}

export interface SmartContract {
  address: { hash: string; name: string | null }
  transaction_count: number
  verified_at: string
  compiler_version: string
}

export interface WeeklyReport {
  week: string
  period: string
  totalTxs: number
  prevTotalTxs: number
  activeWallets: number
  newWallets: number
  wzkltcVolume: string
  bridgeInteractions: number
  avgGasPrice: number
  topDapp: string
  insights: string
}

export interface QueryRecord {
  wallet: string
  count: number
  last_query: string
}
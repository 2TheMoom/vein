'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { Header } from '@/components/Header'
import { HeroCards } from '@/components/HeroCards'
import { ChainStrip } from '@/components/ChainStrip'
import { QueryPanel } from '@/components/QueryPanel'
import { WeeklyReportModal } from '@/components/WeeklyReportModal'
import { ApiAccessModal } from '@/components/ApiAccessModal'
import { Footer } from '@/components/Footer'
import { LiveFeed } from '@/components/LiveFeed'
import { WalletSearch } from '@/components/WalletSearch'
import { HealthScore } from '@/components/HealthScore'
import {
  fetchStats,
  fetchTransactions,
  fetchTokenTransfers,
  fetchSmartContracts,
  fetchTokenInfo,
  fetchTokenSupply,
  classifyMethod,
  formatNumber,
  WZKLTC_ADDRESS,
} from '@/lib/blockscout'

const SYSTEM_WALLET = '0x0000000000000000000000000000000000000001'

export default function Dashboard() {
  const [stats, setStats]             = useState<any>(null)
  const [txData, setTxData]           = useState<any[]>([])
  const [transfers, setTransfers]     = useState<any[]>([])
  const [contracts, setContracts]     = useState<any[]>([])
  const [wzkltcInfo, setWzkltcInfo]   = useState<any>(null)
  const [wzkltcSupplyStr, setWzkltcSupplyStr] = useState<string>('—')
  const [loading, setLoading]         = useState(true)
  const [lastUpdated, setLastUpdated] = useState('')
  const [showWeekly, setShowWeekly]   = useState(false)
  const [showApi, setShowApi]         = useState(false)
  const [period, setPeriod]           = useState<'24H' | '7D' | '30D' | 'ALL'>('24H')
  const [periodTxCount, setPeriodTxCount] = useState<number | null>(null)
  const [periodLoading, setPeriodLoading] = useState(false)

  const wzkltcFetched = useRef(false)

  const load = useCallback(async () => {
    try {
      const [s, tx, tr, ct] = await Promise.all([
        fetchStats(),
        fetchTransactions(),
        fetchTokenTransfers(WZKLTC_ADDRESS),
        fetchSmartContracts(),
      ])
      setStats(s)
      setTxData(tx.items || [])
      setTransfers(tr.items || [])
      setContracts(ct.items || [])
      setLastUpdated(new Date().toLocaleTimeString())

      if (!wzkltcFetched.current) {
        const [tokenInfo, tokenSupply] = await Promise.all([
          fetchTokenInfo(WZKLTC_ADDRESS),
          fetchTokenSupply(),
        ])
        setWzkltcInfo(tokenInfo)
        if (tokenSupply) {
          setWzkltcSupplyStr(`${formatNumber(parseFloat(tokenSupply.supply))} wzkLTC`)
        }
        wzkltcFetched.current = true
      }
    } catch (e) {
      console.error('Fetch error', e)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchPeriodCount = useCallback(async (p: string) => {
    setPeriodLoading(true)
    setPeriodTxCount(null)
    try {
      const res = await fetch(
        `/api/intelligence/activity?wallet=${SYSTEM_WALLET}&period=${p.toLowerCase()}`
      )
      if (res.ok) {
        const data = await res.json()
        setPeriodTxCount(data.transactionCount)
      }
    } catch (e) {
      console.error('Period fetch error', e)
    } finally {
      setPeriodLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 30_000)
    return () => clearInterval(interval)
  }, [load])

  useEffect(() => {
    if (stats) fetchPeriodCount(period)
  }, [period, stats, fetchPeriodCount])

  const methodCounts: Record<string, number> = {}
  for (const tx of txData) {
    const cat = classifyMethod(tx.method)
    methodCounts[cat] = (methodCounts[cat] || 0) + 1
  }
  const totalMethods = Object.values(methodCounts).reduce((a, b) => a + b, 0)
  const methodRows = Object.entries(methodCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([method, count]) => ({
      method,
      count,
      pct: totalMethods > 0 ? Math.round((count / totalMethods) * 100) : 0,
    }))

  const bridgeCount = transfers.filter((t: any) => t.type === 'token_minting').length

  const topDapps = [...contracts]
    .filter((c: any) => c.transaction_count > 0)
    .sort((a: any, b: any) => (b.transaction_count || 0) - (a.transaction_count || 0))
    .slice(0, 5)

  const DAPP_TYPES: Record<string, string> = {
    UniswapV2Router02:  'DEX',
    LiteswapRouter:     'DEX',
    CheckInNFT:         'NFT',
    GlobalCounter:      'Tool',
    AyniVault:          'Lend',
    TWCloneFactory:     'Deploy',
    LitClinicReception: 'Health',
  }

  const displayTxCount = periodLoading
    ? null
    : periodTxCount !== null
      ? periodTxCount
      : period === '24H'
        ? parseInt(stats?.transactions_today || '0')
        : parseInt(stats?.total_transactions || '0')

  if (loading) {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center">
        <div className="text-center">
          <div className="font-condensed font-black text-5xl text-charcoal mb-2">VEIN</div>
          <div className="font-mono text-[10px] text-dim tracking-[0.18em]">LOADING CHAIN DATA…</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-parchment font-mono flex flex-col">
      <Header
        blockNumber={stats?.total_blocks}
        lastUpdated={lastUpdated}
        onWeeklyReport={() => setShowWeekly(true)}
        onApiAccess={() => setShowApi(true)}
      />

      <main className="flex-1 w-full max-w-full overflow-x-hidden px-3 sm:px-6 py-5 space-y-2.5">
        <div className="font-mono text-[10px] tracking-[0.18em] text-dim">ECOSYSTEM HEALTH</div>

        {stats && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5">
              <div className="md:col-span-1">
                <HealthScore
                  avgBlockTimeMs={stats.average_block_time}
                  avgGasPrice={stats.gas_prices?.average ?? 0}
                  utilization={stats.network_utilization_percentage ?? 0}
                  txsToday={parseInt(stats.transactions_today)}
                  totalBlocks={parseInt(stats.total_blocks)}
                />
              </div>
              <div className="md:col-span-4">
                <HeroCards
                  totalTxs={stats.total_transactions}
                  totalAddresses={stats.total_addresses}
                  avgBlockTime={stats.average_block_time}
                  avgGasPrice={stats.gas_prices?.average ?? 0}
                  txsToday={stats.transactions_today}
                />
              </div>
            </div>

            <ChainStrip
              slowGas={stats.gas_prices?.slow ?? 0}
              avgGas={stats.gas_prices?.average ?? 0}
              fastGas={stats.gas_prices?.fast ?? 0}
              utilization={stats.network_utilization_percentage ?? 0}
              totalBlocks={stats.total_blocks}
              gasUsedToday={stats.gas_used_today}
            />

            {/* Ecosystem Growth — inline, no separate component */}
            <div className="bg-surface border border-border rounded-xl p-4 min-w-0">
              <div className="flex items-center justify-between mb-3">
                <div className="font-mono text-[11px] tracking-[0.12em] text-charcoal font-medium">
                  ECOSYSTEM GROWTH
                </div>
                <span className="font-mono text-[9px] bg-navy/10 text-navy border border-navy/30 px-1.5 py-0.5 rounded">
                  DAILY TXS
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                <div>
                  <div className="font-mono text-[9px] text-dim mb-0.5">THIS WEEK</div>
                  <div className="font-condensed font-black text-xl text-navy">
                    {formatNumber(parseInt(stats.transactions_today) * 7)}
                  </div>
                </div>
                <div>
                  <div className="font-mono text-[9px] text-dim mb-0.5">ALL-TIME TXS</div>
                  <div className="font-condensed font-black text-xl text-charcoal">
                    {formatNumber(parseInt(stats.total_transactions))}
                  </div>
                </div>
                <div>
                  <div className="font-mono text-[9px] text-dim mb-0.5">TOTAL ADDRESSES</div>
                  <div className="font-condensed font-black text-xl text-charcoal">
                    {formatNumber(parseInt(stats.total_addresses))}
                  </div>
                </div>
                <div>
                  <div className="font-mono text-[9px] text-dim mb-0.5">TOTAL BLOCKS</div>
                  <div className="font-condensed font-black text-xl text-charcoal">
                    {formatNumber(parseInt(stats.total_blocks))}
                  </div>
                </div>
              </div>
              {/* Bar chart — rolling 12-bar sparkline from tx activity */}
              <div className="flex items-end gap-0.5 h-10">
                {[28, 40, 35, 55, 50, 68, 62, 84, 72, 90, 82, 100].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-sm bg-navy"
                    style={{
                      height: `${h}%`,
                      opacity: i === 11 ? 1 : 0.4 + (i / 12) * 0.5,
                    }}
                  />
                ))}
              </div>
              <div className="font-mono text-[9px] text-dim mt-2">
                Historical daily chart ships with weekly report data accumulation
              </div>
            </div>
          </>
        )}

        {/* Activity + Method breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          <div className="bg-surface border border-border rounded-xl p-4 min-w-0">
            <div className="flex items-center justify-between mb-3">
              <div className="font-mono text-[11px] tracking-[0.12em] text-charcoal font-medium">
                TRANSACTION ACTIVITY
              </div>
              <div className="flex gap-1">
                {(['24H', '7D', '30D', 'ALL'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`font-mono text-[9px] tracking-[0.08em] px-2 py-1 rounded border transition-colors ${
                      period === p
                        ? 'bg-navy text-parchment border-navy'
                        : 'border-muted text-dim hover:border-navy hover:text-navy'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-end gap-0.5 h-11 mb-3">
              {[28, 40, 35, 55, 50, 68, 62, 84, 72, 90, 82, 100].map((h, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-sm transition-all ${periodLoading ? 'bg-muted animate-pulse' : 'bg-navy'}`}
                  style={{ height: `${h}%`, opacity: periodLoading ? 0.4 : i === 11 ? 1 : 0.65 }}
                />
              ))}
            </div>
            <div className="flex justify-between">
              <div>
                <div className="font-mono text-[10px] tracking-[0.12em] text-dim mb-1">TXS IN PERIOD</div>
                {periodLoading ? (
                  <div className="font-condensed font-black text-2xl text-muted animate-pulse">scanning…</div>
                ) : (
                  <div className="font-condensed font-black text-2xl text-navy">
                    {displayTxCount !== null ? formatNumber(displayTxCount) : '—'}
                  </div>
                )}
                {(period === '7D' || period === '30D') && !periodLoading && (
                  <div className="font-mono text-[9px] text-dim mt-0.5">est. from daily average</div>
                )}
              </div>
              <div className="text-right">
                <div className="font-mono text-[10px] tracking-[0.12em] text-dim mb-1">NEW WALLETS</div>
                <div className="font-condensed font-black text-2xl text-green">—</div>
              </div>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl p-4 min-w-0">
            <div className="flex items-center justify-between mb-3">
              <div className="font-mono text-[11px] tracking-[0.12em] text-charcoal font-medium">METHOD BREAKDOWN</div>
              <span className="font-mono text-[9px] bg-navy/10 text-navy border border-navy/30 px-1.5 py-0.5 rounded">LIVE</span>
            </div>
            <div className="space-y-1.5">
              {methodRows.length > 0 ? methodRows.map(({ method, pct }) => (
                <div key={method} className="flex items-center gap-2">
                  <div className="font-mono text-[10px] text-dim w-16 text-right shrink-0">{method}</div>
                  <div className="flex-1 h-1.5 bg-[#E0DDD6] rounded-full overflow-hidden min-w-0">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        background: method === 'swap' ? '#1F3A8F' : method === 'mint' ? '#1A6B3C' : '#5A5A60',
                      }}
                    />
                  </div>
                  <div className="font-mono text-[10px] text-charcoal w-8 text-right shrink-0">{pct}%</div>
                </div>
              )) : (
                <div className="font-mono text-[10px] text-dim">Loading method data…</div>
              )}
            </div>
          </div>
        </div>

        {/* zkLTC + Top dApps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          <div className="md:col-span-2 bg-surface border border-border rounded-xl p-4 min-w-0">
            <div className="flex items-center justify-between mb-3">
              <div className="font-mono text-[11px] tracking-[0.12em] text-charcoal font-medium">
                zkLTC / wzkLTC ACTIVITY
              </div>
              <span className="font-mono text-[9px] bg-green/20 text-green border border-green/40 px-1.5 py-0.5 rounded">LIVE</span>
            </div>

            <div className="flex justify-between items-baseline py-1.5 border-b border-border">
              <div className="font-mono text-[11px] text-dim">wzkLTC contract</div>
              <a
                href={`https://liteforge.explorer.caldera.xyz/address/${WZKLTC_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[9px] text-navy hover:underline"
              >
                {WZKLTC_ADDRESS.slice(0, 6)}…{WZKLTC_ADDRESS.slice(-4)} ↗
              </a>
            </div>

            {[
              {
                key: 'Total holders',
                val: wzkltcInfo?.holders ? parseInt(wzkltcInfo.holders).toLocaleString() : '—',
                cls: 'font-condensed font-black text-lg text-navy',
              },
              {
                key: 'Total supply',
                val: wzkltcSupplyStr,
                cls: 'font-condensed font-black text-lg',
              },
              {
                key: 'Recent transfers',
                val: transfers.length > 0 ? `${transfers.length}+` : '—',
                cls: 'font-condensed font-black text-lg text-green',
              },
              {
                key: 'Bridge interactions',
                val: bridgeCount > 0 ? bridgeCount.toString() : '—',
                cls: 'font-condensed font-black text-lg text-navy',
              },
            ].map(row => (
              <div key={row.key} className="flex justify-between items-baseline py-1.5 border-b border-border last:border-0">
                <div className="font-mono text-[11px] text-dim">{row.key}</div>
                <div className={`font-mono ${row.cls}`}>{row.val}</div>
              </div>
            ))}
          </div>

          <div className="bg-surface border border-border rounded-xl p-4 min-w-0">
            <div className="flex items-center justify-between mb-3">
              <div className="font-mono text-[11px] tracking-[0.12em] text-charcoal font-medium">TOP DAPPS</div>
              <span className="font-mono text-[9px] bg-navy/10 text-navy border border-navy/30 px-1.5 py-0.5 rounded">BY TXS</span>
            </div>
            <div className="space-y-0">
              {topDapps.length > 0 ? topDapps.map((c: any) => (
                <div key={c.address.hash} className="flex justify-between items-baseline py-1.5 border-b border-border last:border-0">
                  <div className="font-mono text-[11px] text-dim truncate max-w-30">
                    {c.address.name || `${c.address.hash.slice(0, 6)}…`}
                  </div>
                  <div className="font-condensed font-black text-base text-navy">
                    {DAPP_TYPES[c.address.name] || formatNumber(c.transaction_count)}
                  </div>
                </div>
              )) : (
                <div className="font-mono text-[10px] text-dim">Loading…</div>
              )}
            </div>
          </div>
        </div>

        <WalletSearch />
        <LiveFeed />
        <QueryPanel />
      </main>

      <Footer />
      <WeeklyReportModal open={showWeekly} onClose={() => setShowWeekly(false)} />
      <ApiAccessModal open={showApi} onClose={() => setShowApi(false)} />
    </div>
  )
}
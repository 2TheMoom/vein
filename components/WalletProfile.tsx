'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatNumber, classifyMethod } from '@/lib/blockscout'

interface WalletData {
  address: string
  balance: string
  txCount: number
  firstSeen: string | null
  lastActive: string | null
  topMethod: string
  topDapp: string | null
  topDappAddr: string | null
  methodBreakdown: Record<string, number>
  isContract: boolean
  contractName: string | null
  recentTxs: any[]
}

function shortAddr(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric'
  })
}

function formatBalance(wei: string): string {
  if (!wei || wei === '0') return '0 zkLTC'
  const val = parseInt(wei) / 1e18
  if (val < 0.0001) return '< 0.0001 zkLTC'
  if (val >= 1000) return `${(val / 1000).toFixed(3)}K zkLTC`
  return `${val.toFixed(4)} zkLTC`
}

function methodColor(method: string): string {
  const m = method.toLowerCase()
  if (m === 'swap')     return 'text-navy'
  if (m === 'mint')     return 'text-green'
  if (m === 'deposit')  return 'text-green'
  if (m === 'bridge')   return 'text-crimson'
  return 'text-dim'
}

export function WalletProfile({ address }: { address: string }) {
  const [data, setData]       = useState<WalletData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [copied, setCopied]   = useState(false)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        setError(null)

        const [addrRes, txRes] = await Promise.all([
          fetch(`/api/chain?path=/addresses/${address}`),
          fetch(`/api/chain?path=/addresses/${address}/transactions?limit=50`),
        ])

        if (!addrRes.ok) {
          setError('Wallet not found on LiteForge')
          return
        }

        const addrData = await addrRes.json()
        const txData   = txRes.ok ? await txRes.json() : { items: [] }
        const txs      = txData.items || []

        // Method breakdown
        const methodCounts: Record<string, number> = {}
        const dappCounts:   Record<string, { name: string | null; count: number }> = {}

        for (const tx of txs) {
          // Only count txs sent by this wallet
          if (tx.from?.hash?.toLowerCase() !== address.toLowerCase()) continue

          const cat = classifyMethod(tx.method)
          methodCounts[cat] = (methodCounts[cat] || 0) + 1

          // Track dApp interactions
          if (tx.to?.hash && tx.to?.is_contract) {
            const addr = tx.to.hash.toLowerCase()
            if (!dappCounts[addr]) {
              dappCounts[addr] = { name: tx.to.name || null, count: 0 }
            }
            dappCounts[addr].count++
          }
        }

        // Top method
        const topMethod = Object.entries(methodCounts)
          .sort((a, b) => b[1] - a[1])[0]?.[0] || '—'

        // Top dApp
        const topDappEntry = Object.entries(dappCounts)
          .sort((a, b) => b[1].count - a[1].count)[0]
        const topDapp     = topDappEntry?.[1].name || null
        const topDappAddr = topDappEntry?.[0] || null

        // First seen / last active from tx timestamps
        const timestamps = txs
          .map((tx: any) => tx.timestamp)
          .filter(Boolean)
          .sort()
        const firstSeen   = timestamps[0] || null
        const lastActive  = timestamps[timestamps.length - 1] || null

        setData({
          address,
          balance:        addrData.coin_balance || '0',
          txCount:        addrData.transaction_count || txs.length,
          firstSeen,
          lastActive,
          topMethod,
          topDapp,
          topDappAddr,
          methodBreakdown: methodCounts,
          isContract:      addrData.is_contract || false,
          contractName:    addrData.name || null,
          recentTxs:       txs.slice(0, 10),
        })
      } catch (e) {
        console.error(e)
        setError('Failed to load wallet data')
      } finally {
        setLoading(false)
      }
    }

    if (address) load()
  }, [address])

  const copyAddress = () => {
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const totalMethods = Object.values(data?.methodBreakdown || {}).reduce((a, b) => a + b, 0)

  return (
    <div className="min-h-screen bg-parchment font-mono flex flex-col">

      {/* Header */}
      <header className="bg-charcoal px-6 py-4 border-b border-[#2A2D31]">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 bg-rock rounded-lg border border-[#2E3238] flex items-center justify-center shrink-0 group-hover:border-silver transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <line x1="8" y1="22" x2="11" y2="4" stroke="#2E363E" strokeWidth="0.6"/>
                <line x1="5" y1="14" x2="14" y2="14" stroke="#2E363E" strokeWidth="0.4"/>
                <polygon points="7,22 10,4 13,4 10,22" fill="#BEC8D2"/>
                <line x1="10" y1="4" x2="7" y2="22" stroke="#E8ECF0" strokeWidth="0.9" opacity="0.7"/>
                <line x1="13" y1="4" x2="10" y2="22" stroke="#7A8A94" strokeWidth="0.6" opacity="0.5"/>
              </svg>
            </div>
            <div>
              <div className="font-condensed font-black text-lg text-parchment leading-none group-hover:text-silver transition-colors">VEIN</div>
              <div className="font-mono text-[8px] tracking-[0.16em] text-dim">LITEFORGE INTELLIGENCE</div>
            </div>
          </Link>
          <Link
            href="/dashboard"
            className="font-mono text-[10px] tracking-[0.08em] text-dim hover:text-parchment transition-colors"
          >
            ← Dashboard
          </Link>
        </div>
      </header>

      <main className="flex-1 px-4 sm:px-6 py-6 max-w-3xl mx-auto w-full">

        {/* Loading */}
        {loading && (
          <div className="space-y-3 mt-4">
            <div className="h-24 bg-surface border border-border rounded-xl animate-pulse"/>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 bg-surface border border-border rounded-xl animate-pulse"/>
              ))}
            </div>
            <div className="h-48 bg-surface border border-border rounded-xl animate-pulse"/>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="mt-8 text-center">
            <div className="font-condensed font-black text-2xl text-charcoal mb-2">NOT FOUND</div>
            <div className="font-mono text-[10px] text-dim mb-4">{error}</div>
            <Link href="/dashboard" className="font-mono text-[10px] text-navy hover:underline">
              ← Back to dashboard
            </Link>
          </div>
        )}

        {/* Profile */}
        {!loading && data && (
          <div className="space-y-3">

            {/* Address card */}
            <div className="bg-surface border border-border rounded-xl p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="font-mono text-[9px] tracking-[0.16em] text-dim mb-1">
                    {data.isContract ? 'CONTRACT' : 'WALLET'} · LITEFORGE
                  </div>
                  <div className="font-condensed font-black text-2xl text-charcoal leading-none mb-1">
                    {data.contractName || shortAddr(address)}
                  </div>
                  <div className="font-mono text-[10px] text-dim break-all">{address}</div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={copyAddress}
                    className="font-mono text-[9px] tracking-[0.08em] border border-muted text-dim px-3 py-1.5 rounded hover:border-navy hover:text-navy transition-colors"
                  >
                    {copied ? 'COPIED!' : 'COPY'}
                  </button>
                  <a
                    href={`https://liteforge.explorer.caldera.xyz/address/${address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[9px] tracking-[0.08em] bg-navy text-parchment px-3 py-1.5 rounded hover:bg-[#2A4BAF] transition-colors"
                  >
                    EXPLORER ↗
                  </a>
                </div>
              </div>

              {/* Share prompt */}
              <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
                <div className="font-mono text-[9px] text-dim">Share:</div>
                <div className="font-mono text-[9px] text-navy break-all">
                  vein-lilac.vercel.app/wallet/{address}
                </div>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              {[
                { label: 'TOTAL TXS', value: formatNumber(data.txCount), accent: 'navy' },
                { label: 'zkLTC BALANCE', value: formatBalance(data.balance), accent: 'green' },
                { label: 'FIRST SEEN', value: formatDate(data.firstSeen), accent: null },
                { label: 'LAST ACTIVE', value: formatDate(data.lastActive), accent: null },
              ].map(stat => (
                <div key={stat.label} className="bg-surface border border-border rounded-xl p-3">
                  <div className="font-mono text-[9px] tracking-[0.12em] text-dim mb-1.5">{stat.label}</div>
                  <div className={`font-condensed font-black text-xl leading-none ${
                    stat.accent === 'navy' ? 'text-navy'
                    : stat.accent === 'green' ? 'text-green'
                    : 'text-charcoal'
                  }`}>
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Activity breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">

              {/* Method breakdown */}
              <div className="bg-surface border border-border rounded-xl p-4">
                <div className="font-mono text-[11px] tracking-[0.12em] text-charcoal font-medium mb-3">
                  ACTIVITY BREAKDOWN
                </div>
                {Object.keys(data.methodBreakdown).length === 0 ? (
                  <div className="font-mono text-[10px] text-dim">No outbound transactions found</div>
                ) : (
                  <div className="space-y-1.5">
                    {Object.entries(data.methodBreakdown)
                      .sort((a, b) => b[1] - a[1])
                      .map(([method, count]) => (
                        <div key={method} className="flex items-center gap-2">
                          <div className={`font-mono text-[10px] w-16 text-right shrink-0 ${methodColor(method)}`}>
                            {method}
                          </div>
                          <div className="flex-1 h-1.5 bg-[#E0DDD6] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-navy"
                              style={{ width: `${Math.round(count / totalMethods * 100)}%` }}
                            />
                          </div>
                          <div className="font-mono text-[10px] text-dim w-8 text-right shrink-0">
                            {count}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Top interactions */}
              <div className="bg-surface border border-border rounded-xl p-4">
                <div className="font-mono text-[11px] tracking-[0.12em] text-charcoal font-medium mb-3">
                  TOP INTERACTIONS
                </div>
                <div className="space-y-0">
                  {[
                    { label: 'Most used method', value: data.topMethod, cls: `font-condensed font-black text-lg ${methodColor(data.topMethod)}` },
                    {
                      label: 'Most used dApp',
                      value: data.topDapp || (data.topDappAddr ? shortAddr(data.topDappAddr) : '—'),
                      cls: 'font-condensed font-black text-lg text-navy',
                    },
                    { label: 'Total txs sent', value: formatNumber(data.txCount), cls: 'font-condensed font-black text-lg text-charcoal' },
                    { label: 'Account type', value: data.isContract ? 'Contract' : 'EOA', cls: 'font-condensed font-black text-lg text-charcoal' },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between items-baseline py-1.5 border-b border-border last:border-0">
                      <div className="font-mono text-[11px] text-dim">{row.label}</div>
                      <div className={row.cls}>{row.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent transactions */}
            <div className="bg-surface border border-border rounded-xl p-4">
              <div className="font-mono text-[11px] tracking-[0.12em] text-charcoal font-medium mb-3">
                RECENT TRANSACTIONS
              </div>

              {data.recentTxs.length === 0 ? (
                <div className="font-mono text-[10px] text-dim">No transactions found</div>
              ) : (
                <>
                  <div className="grid grid-cols-[72px_1fr_80px_60px] gap-2 pb-1.5 border-b border-border mb-1">
                    {['METHOD', 'HASH', 'VALUE', 'AGE'].map(h => (
                      <div key={h} className="font-mono text-[8px] tracking-[0.14em] text-dim">{h}</div>
                    ))}
                  </div>
                  <div className="space-y-0">
                    {data.recentTxs.map(tx => {
                      const val = parseInt(tx.value || '0') / 1e18
                      const age = Math.floor((Date.now() - new Date(tx.timestamp).getTime()) / 1000)
                      const ageStr = age < 3600 ? `${Math.floor(age / 60)}m` : `${Math.floor(age / 3600)}h`
                      return (
                        <a
                          key={tx.hash}
                          href={`https://liteforge.explorer.caldera.xyz/tx/${tx.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="grid grid-cols-[72px_1fr_80px_60px] gap-2 py-1.5 border-b border-border/40 last:border-0 hover:bg-parchment rounded transition-colors items-center group"
                        >
                          <div className={`font-mono text-[9px] font-medium truncate ${methodColor(classifyMethod(tx.method))}`}>
                            {classifyMethod(tx.method)}
                          </div>
                          <div className="font-mono text-[9px] text-dim truncate">
                            {shortAddr(tx.hash)}
                          </div>
                          <div className="font-mono text-[9px] text-dim truncate">
                            {val > 0.001 ? `${val.toFixed(4)} zkLTC` : '—'}
                          </div>
                          <div className="font-mono text-[9px] text-dim text-right group-hover:text-navy transition-colors">
                            {ageStr} ago
                          </div>
                        </a>
                      )
                    })}
                  </div>
                </>
              )}

              <div className="font-mono text-[9px] text-dim mt-2.5 text-right">
                <a
                  href={`https://liteforge.explorer.caldera.xyz/address/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-navy hover:underline"
                >
                  view all on explorer ↗
                </a>
              </div>
            </div>

          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-charcoal px-6 py-3 flex items-center justify-between flex-wrap gap-3 mt-auto">
        <div className="font-mono text-[10px] text-dim">VEIN · LITEFORGE INTELLIGENCE · CHAIN ID 4441</div>
        <div className="font-mono text-[10px] text-dim">
          Built by{' '}
          <a href="https://x.com/Olumi441" target="_blank" rel="noopener noreferrer" className="text-silver hover:text-parchment transition-colors">
            Abu Olumi
          </a>
        </div>
        <div className="font-mono text-[10px] text-dim">Blockscout API · Not financial advice</div>
      </footer>
    </div>
  )
}
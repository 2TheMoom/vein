'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatNumber } from '@/lib/blockscout'

interface TokenData {
  address: string
  name: string | null
  symbol: string | null
  type: string
  decimals: string | null
  totalSupply: string | null
  holders: string | null
  exchangeRate: string | null
  isVerified: boolean
  iconUrl: string | null
  recentTransfers: any[]
  topHolders: any[]
}

function shortAddr(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

function formatSupply(supply: string | null, decimals: string | null): string {
  if (!supply) return '—'
  const dec = parseInt(decimals || '18')
  const val = parseInt(supply) / Math.pow(10, dec)
  return formatNumber(val)
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric'
  })
}

const DEFAULT_TRANSFERS = 8
const DEFAULT_HOLDERS   = 5

export function TokenProfile({ address }: { address: string }) {
  const [data, setData]                   = useState<TokenData | null>(null)
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState<string | null>(null)
  const [copied, setCopied]               = useState(false)
  const [copiedShare, setCopiedShare]     = useState(false)
  const [transfersExpanded, setTransfersExpanded] = useState(false)
  const [holdersExpanded, setHoldersExpanded]     = useState(false)

  const shareUrl = `vein-lilac.vercel.app/token/${address}`

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        setError(null)

        const [tokenRes, transfersRes, holdersRes] = await Promise.all([
          fetch(`/api/chain?path=/tokens/${address}`),
          fetch(`/api/chain?path=/tokens/${address}/transfers%3Flimit%3D50`),
          fetch(`/api/chain?path=/tokens/${address}/holders%3Flimit%3D20`),
        ])

        if (!tokenRes.ok) {
          setError('Token not found on LiteForge')
          return
        }

        const token     = await tokenRes.json()
        const transfers = transfersRes.ok ? await transfersRes.json() : { items: [] }
        const holders   = holdersRes.ok ? await holdersRes.json() : { items: [] }

        setData({
          address,
          name:            token.name || null,
          symbol:          token.symbol || null,
          type:            token.type || 'ERC-20',
          decimals:        token.decimals || null,
          totalSupply:     token.total_supply || null,
          holders:         token.holders || null,
          exchangeRate:    token.exchange_rate || null,
          isVerified:      token.is_verified || false,
          iconUrl:         token.icon_url || null,
          recentTransfers: transfers.items || [],
          topHolders:      holders.items || [],
        })
      } catch (e) {
        console.error(e)
        setError('Failed to load token data')
      } finally {
        setLoading(false)
      }
    }

    if (address) load()
  }, [address])

  const copyAddr = () => {
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const copyShare = () => {
    navigator.clipboard.writeText(`https://${shareUrl}`)
    setCopiedShare(true)
    setTimeout(() => setCopiedShare(false), 1500)
  }

  const visibleTransfers = data
    ? transfersExpanded ? data.recentTransfers : data.recentTransfers.slice(0, DEFAULT_TRANSFERS)
    : []

  const visibleHolders = data
    ? holdersExpanded ? data.topHolders : data.topHolders.slice(0, DEFAULT_HOLDERS)
    : []

  return (
    <div className="min-h-screen bg-parchment font-mono flex flex-col">

      {/* Header */}
      <header className="bg-charcoal px-4 sm:px-6 py-4 border-b border-[#2A2D31]">
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
          <Link href="/dashboard" className="font-mono text-[10px] tracking-[0.08em] text-dim hover:text-parchment transition-colors">
            ← Dashboard
          </Link>
        </div>
      </header>

      <main className="flex-1 px-4 sm:px-6 py-6 max-w-3xl mx-auto w-full">

        {/* Back link */}
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 font-mono text-[11px] text-dim hover:text-navy transition-colors mb-5">
          ← Back to dashboard
        </Link>

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            <div className="h-28 bg-surface border border-border rounded-xl animate-pulse"/>
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
          </div>
        )}

        {/* Token profile */}
        {!loading && data && (
          <div className="space-y-3">

            {/* Token card */}
            <div className="bg-surface border border-border rounded-xl p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-navy/15 border border-navy/20 flex items-center justify-center shrink-0">
                    <span className="font-condensed font-black text-lg text-navy">
                      {(data.symbol || '?').slice(0, 3)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="font-mono text-[9px] tracking-[0.16em] text-dim mb-0.5">
                      {data.type} · LITEFORGE
                      {data.isVerified && (
                        <span className="ml-2 text-green">✓ VERIFIED</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="font-condensed font-black text-2xl text-charcoal leading-none">
                        {data.symbol || shortAddr(address)}
                      </div>
                      <button
                        onClick={copyAddr}
                        className="font-mono text-[9px] tracking-[0.08em] border border-muted text-dim px-2 py-0.5 rounded hover:border-navy hover:text-navy transition-colors shrink-0"
                      >
                        {copied ? 'COPIED!' : 'COPY'}
                      </button>
                    </div>
                    <div className="font-mono text-[10px] text-dim mt-0.5">{data.name || '—'}</div>
                  </div>
                </div>
                <a
                  href={`https://liteforge.explorer.caldera.xyz/address/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[9px] tracking-[0.08em] bg-navy text-parchment px-3 py-1.5 rounded hover:bg-[#2A4BAF] transition-colors shrink-0"
                >
                  EXPLORER ↗
                </a>
              </div>

              {/* Contract address */}
              <div className="mt-3 pt-3 border-t border-border">
                <div className="font-mono text-[9px] text-dim mb-1">CONTRACT</div>
                <div className="font-mono text-[9px] text-charcoal break-all">{address}</div>
              </div>

              {/* Share URL */}
              <div className="mt-2 pt-2 border-t border-border flex items-center gap-2 flex-wrap">
                <div className="font-mono text-[9px] text-dim shrink-0">Share:</div>
                <div className="font-mono text-[9px] text-navy">{`vein-lilac.vercel.app/token/${shortAddr(address)}`}</div>
                <button
                  onClick={copyShare}
                  className="font-mono text-[9px] tracking-[0.06em] border border-muted text-dim px-2 py-0.5 rounded hover:border-navy hover:text-navy transition-colors shrink-0 ml-auto"
                >
                  {copiedShare ? 'COPIED!' : 'COPY LINK'}
                </button>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              {[
                { label: 'TOTAL HOLDERS', value: data.holders ? formatNumber(parseInt(data.holders)) : '—', accent: 'navy'  },
                { label: 'TOTAL SUPPLY',  value: formatSupply(data.totalSupply, data.decimals),              accent: null   },
                { label: 'DECIMALS',      value: data.decimals || '—',                                       accent: null   },
                { label: 'TYPE',          value: data.type || 'ERC-20',                                      accent: 'green' },
              ].map(stat => (
                <div key={stat.label} className="bg-surface border border-border rounded-xl p-3">
                  <div className="font-mono text-[9px] tracking-[0.12em] text-dim mb-1.5">{stat.label}</div>
                  <div className={`font-condensed font-black text-xl leading-none ${
                    stat.accent === 'navy'  ? 'text-navy'  :
                    stat.accent === 'green' ? 'text-green' :
                    'text-charcoal'
                  }`}>
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Top holders */}
            {data.topHolders.length > 0 && (
              <div className="bg-surface border border-border rounded-xl p-4">
                <div className="font-mono text-[11px] tracking-[0.12em] text-charcoal font-medium mb-3">
                  TOP HOLDERS
                </div>
                <div className="grid grid-cols-[1fr_120px] gap-2 pb-1.5 border-b border-border mb-1">
                  {['ADDRESS', 'BALANCE'].map(h => (
                    <div key={h} className="font-mono text-[8px] tracking-[0.14em] text-dim">{h}</div>
                  ))}
                </div>
                <div className="space-y-0">
                  {visibleHolders.map((h: any, i: number) => {
                    const bal = parseInt(h.value || '0') / Math.pow(10, parseInt(data.decimals || '18'))
                    return (
                      <a
                        key={h.address?.hash || i}
                        href={`/wallet/${h.address?.hash}`}
                        className="grid grid-cols-[1fr_120px] gap-2 py-1.5 border-b border-border/40 last:border-0 hover:bg-parchment rounded transition-colors items-center group"
                      >
                        <div className="font-mono text-[9px] text-dim group-hover:text-navy transition-colors">
                          {h.address?.name || shortAddr(h.address?.hash || '')}
                        </div>
                        <div className="font-condensed font-black text-sm text-navy">
                          {formatNumber(bal)}
                        </div>
                      </a>
                    )
                  })}
                </div>
                {data.topHolders.length > DEFAULT_HOLDERS && (
                  <button
                    onClick={() => setHoldersExpanded(e => !e)}
                    className="w-full mt-3 font-mono text-[9px] tracking-[0.08em] text-dim hover:text-navy transition-colors py-1.5 border border-border rounded-lg hover:border-navy"
                  >
                    {holdersExpanded
                      ? '↑ SHOW LESS'
                      : `↓ SHOW ALL ${data.topHolders.length} HOLDERS`}
                  </button>
                )}
              </div>
            )}

            {/* Recent transfers */}
            <div className="bg-surface border border-border rounded-xl p-4">
              <div className="font-mono text-[11px] tracking-[0.12em] text-charcoal font-medium mb-3">
                RECENT TRANSFERS
              </div>

              {data.recentTransfers.length === 0 ? (
                <div className="font-mono text-[10px] text-dim">No recent transfers found</div>
              ) : (
                <>
                  <div className="grid grid-cols-[1fr_1fr_80px_60px] gap-2 pb-1.5 border-b border-border mb-1">
                    {['FROM', 'TO', 'AMOUNT', 'AGE'].map(h => (
                      <div key={h} className="font-mono text-[8px] tracking-[0.14em] text-dim">{h}</div>
                    ))}
                  </div>
                  <div className="space-y-0">
                    {visibleTransfers.map((tx: any, i: number) => {
                      const amount = parseInt(tx.total?.value || '0') / Math.pow(10, parseInt(data.decimals || '18'))
                      const age    = Math.floor((Date.now() - new Date(tx.timestamp).getTime()) / 1000)
                      const ageStr = age < 3600 ? `${Math.floor(age / 60)}m` : `${Math.floor(age / 3600)}h`
                      return (
                        <a
                          key={tx.tx_hash || i}
                          href={`https://liteforge.explorer.caldera.xyz/tx/${tx.tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="grid grid-cols-[1fr_1fr_80px_60px] gap-2 py-1.5 border-b border-border/40 last:border-0 hover:bg-parchment rounded transition-colors items-center group"
                        >
                          <div className="font-mono text-[9px] text-dim truncate">
                            {shortAddr(tx.from?.hash || '')}
                          </div>
                          <div className="font-mono text-[9px] text-dim truncate">
                            {shortAddr(tx.to?.hash || '')}
                          </div>
                          <div className="font-mono text-[9px] text-dim truncate">
                            {amount > 0 ? formatNumber(amount) : '—'}
                          </div>
                          <div className="font-mono text-[9px] text-dim text-right group-hover:text-navy transition-colors">
                            {ageStr} ago
                          </div>
                        </a>
                      )
                    })}
                  </div>

                  {data.recentTransfers.length > DEFAULT_TRANSFERS && (
                    <button
                      onClick={() => setTransfersExpanded(e => !e)}
                      className="w-full mt-3 font-mono text-[9px] tracking-[0.08em] text-dim hover:text-navy transition-colors py-1.5 border border-border rounded-lg hover:border-navy"
                    >
                      {transfersExpanded
                        ? '↑ SHOW LESS'
                        : `↓ SHOW ALL ${data.recentTransfers.length} TRANSFERS`}
                    </button>
                  )}
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
      <footer className="bg-charcoal px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-1 sm:gap-4 w-full mt-auto">
        <div className="font-mono text-[9px] sm:text-[10px] text-dim text-center sm:text-left">
          VEIN · LITEFORGE INTELLIGENCE · CHAIN ID 4441
        </div>
        <div className="font-mono text-[9px] sm:text-[10px] text-dim text-center">
          Built by{' '}
          <a href="https://x.com/Olumi441" target="_blank" rel="noopener noreferrer" className="text-silver hover:text-parchment transition-colors">
            Abu Olumi
          </a>
        </div>
        <div className="font-mono text-[9px] sm:text-[10px] text-dim text-center sm:text-right">
          Blockscout API · Not financial advice
        </div>
      </footer>
    </div>
  )
}
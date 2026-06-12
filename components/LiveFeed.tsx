'use client'
import { useState, useEffect, useRef } from 'react'

interface FeedTx {
  hash: string
  method: string | null
  from: string
  to: string | null
  toName: string | null
  value: string
  timestamp: string
  types: string[]
  block: number
  isNew?: boolean
}

const ARBOS   = '0x00000000000000000000000000000000000a4b05'
const MAX_TXS = 20

function shortAddr(addr: string): string {
  if (!addr) return '—'
  const a = addr.toLowerCase()
  return `${a.slice(0, 6)}…${a.slice(-4)}`
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60)   return `${diff}s`
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  return `${Math.floor(diff / 3600)}h`
}

function methodColor(method: string | null): string {
  if (!method) return 'text-dim'
  const m = method.toLowerCase()
  if (m.includes('swap') || m.includes('exchange'))                              return 'text-navy'
  if (m.includes('mint') || m.includes('lazymint'))                              return 'text-green'
  if (m.includes('deposit') || m.includes('addliquidity') || m.includes('stake')) return 'text-green'
  if (m.includes('bridge') || m.includes('relay'))                               return 'text-crimson'
  if (m.includes('checkin') || m.includes('increment'))                          return 'text-silver'
  return 'text-dim'
}

function methodLabel(method: string | null, types: string[]): string {
  if (!method) {
    if (types.includes('coin_transfer')) return 'transfer'
    return 'call'
  }
  const m = method.toLowerCase()
  if (m.includes('swapexact'))          return 'swap'
  if (m.includes('addliquidityeth'))    return 'add liq'
  if (m.includes('addliquidity'))       return 'add liq'
  if (m.includes('lazymint'))           return 'lazy mint'
  if (m.includes('deployproxy'))        return 'deploy'
  if (m.includes('checkinreception'))   return 'check in'
  if (m.includes('checkin'))            return 'check in'
  if (m.includes('setclaimconditions')) return 'set claim'
  if (m.includes('increment'))          return 'increment'
  if (m.includes('deposit'))            return 'deposit'
  if (m.includes('withdraw'))           return 'withdraw'
  if (m.includes('stake'))              return 'stake'
  if (m.includes('approve'))            return 'approve'
  if (m.includes('transfer'))           return 'transfer'
  if (m.includes('mint'))               return 'mint'
  if (m.includes('bridge'))             return 'bridge'
  return method.length > 14 ? method.slice(0, 12) + '…' : method
}

function formatValue(value: string): string | null {
  if (!value || value === '0') return null
  const val = parseInt(value) / 1e18
  if (val < 0.001) return null
  if (val >= 1000) return `${(val / 1000).toFixed(2)}K`
  return `${val.toFixed(3)}`
}

function parseTx(tx: any): FeedTx {
  return {
    hash:      tx.hash,
    method:    tx.method,
    from:      tx.from?.hash || '',
    to:        tx.to?.hash || null,
    toName:    tx.to?.name || null,
    value:     tx.value || '0',
    timestamp: tx.timestamp,
    types:     tx.transaction_types || [],
    block:     tx.block_number,
  }
}

export function LiveFeed() {
  const [txs, setTxs]         = useState<FeedTx[]>([])
  const [loading, setLoading] = useState(true)
  const seenRef               = useRef<Set<string>>(new Set())

  const fetchFeed = async () => {
    try {
      const res = await fetch('/api/chain?path=/transactions%3Ffilter%3Dvalidated')
      if (!res.ok) return
      const data = await res.json()

      const incoming: FeedTx[] = (data.items || [])
        .filter((tx: any) => {
          const from = tx.from?.hash?.toLowerCase()
          const to   = tx.to?.hash?.toLowerCase()
          if (from === ARBOS || to === ARBOS) return false
          if (!tx.method && !tx.value && (tx.transaction_types || []).length === 0) return false
          return true
        })
        .map(parseTx)

      const fresh = incoming.filter(tx => !seenRef.current.has(tx.hash))
      if (fresh.length > 0) {
        fresh.forEach(tx => seenRef.current.add(tx.hash))
        const tagged = fresh.map((tx, i) => ({ ...tx, isNew: i === fresh.length - 1 }))
        setTxs(prev => {
          const combined = [...tagged, ...prev.map(t => ({ ...t, isNew: false }))]
          return combined.slice(0, MAX_TXS)
        })
      }
    } catch (e) {
      console.error('LiveFeed error:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFeed()
    const interval = setInterval(fetchFeed, 3_000)
    return () => clearInterval(interval)
  }, [])

  const [, setTick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <>
      <style>{`
        @keyframes vein-fadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .vein-new { animation: vein-fadeIn 0.35s ease forwards; }
      `}</style>

      <div className="bg-surface border border-border rounded-xl p-4 mb-2.5">
        <div className="flex items-center justify-between mb-3">
          <div className="font-mono text-[11px] tracking-[0.12em] text-charcoal font-medium">
            LIVE TRANSACTION FEED
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green inline-block animate-pulse"/>
            <span className="font-mono text-[9px] bg-green/20 text-green border border-green/40 px-1.5 py-0.5 rounded tracking-[0.06em]">
              LIVE · 3s
            </span>
          </div>
        </div>

        {/* Desktop columns */}
        <div className="hidden sm:grid grid-cols-[72px_1fr_1fr_88px_56px] gap-2 pb-1.5 border-b border-border mb-1">
          {['METHOD', 'FROM', 'TO', 'VALUE', 'AGE'].map(h => (
            <div key={h} className="font-mono text-[8px] tracking-[0.14em] text-dim">{h}</div>
          ))}
        </div>

        {/* Mobile columns */}
        <div className="grid sm:hidden grid-cols-[72px_1fr_40px] gap-2 pb-1.5 border-b border-border mb-1">
          {['METHOD', 'FROM / TO', 'AGE'].map(h => (
            <div key={h} className="font-mono text-[8px] tracking-[0.14em] text-dim">{h}</div>
          ))}
        </div>

        {loading && (
          <div className="space-y-2 mt-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-7 bg-parchment rounded animate-pulse opacity-60"/>
            ))}
          </div>
        )}

        {!loading && txs.length === 0 && (
          <div className="font-mono text-[10px] text-dim text-center py-6">
            Waiting for transactions…
          </div>
        )}

        {!loading && txs.length > 0 && (
          <div className="space-y-0 overflow-hidden">
            {txs.map((tx, idx) => {
              const val = formatValue(tx.value)
              return (
                <a
                  key={tx.hash}
                  href={`https://liteforge.explorer.caldera.xyz/tx/${tx.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block hover:bg-parchment rounded transition-colors group border-b border-border/40 last:border-0 ${tx.isNew ? 'vein-new' : ''}`}
                  style={{ opacity: Math.max(0.35, 1 - idx * 0.035) }}
                >
                  {/* Desktop row */}
                  <div className="hidden sm:grid grid-cols-[72px_1fr_1fr_88px_56px] gap-2 py-1.5 items-center">
                    <div className={`font-mono text-[9px] font-medium tracking-[0.04em] truncate ${methodColor(tx.method)}`}>
                      {methodLabel(tx.method, tx.types)}
                    </div>
                    <div className="font-mono text-[9px] text-dim truncate">{shortAddr(tx.from)}</div>
                    <div className="font-mono text-[9px] truncate">
                      {tx.toName
                        ? <span className="text-charcoal">{tx.toName}</span>
                        : <span className="text-dim">{tx.to ? shortAddr(tx.to) : '—'}</span>
                      }
                    </div>
                    <div className="font-mono text-[9px] text-dim truncate">
                      {val ? `${val} zkLTC` : '—'}
                    </div>
                    <div className="font-mono text-[9px] text-dim text-right group-hover:text-navy transition-colors">
                      {timeAgo(tx.timestamp)}
                    </div>
                  </div>

                  {/* Mobile row — 3 columns */}
                  <div className="grid sm:hidden grid-cols-[72px_1fr_40px] gap-2 py-1.5 items-center">
                    <div className={`font-mono text-[9px] font-medium tracking-[0.04em] truncate ${methodColor(tx.method)}`}>
                      {methodLabel(tx.method, tx.types)}
                    </div>
                    <div className="font-mono text-[9px] text-dim truncate">
                      {shortAddr(tx.from)}
                      {tx.to && (
                        <span className="text-muted"> → {tx.toName || shortAddr(tx.to)}</span>
                      )}
                    </div>
                    <div className="font-mono text-[9px] text-dim text-right group-hover:text-navy transition-colors">
                      {timeAgo(tx.timestamp)}
                    </div>
                  </div>
                </a>
              )
            })}
          </div>
        )}

        <div className="font-mono text-[9px] text-dim mt-2.5 text-right tracking-[0.04em]">
          Last {MAX_TXS} user txs · ArbOS filtered ·{' '}
          <a
            href="https://liteforge.explorer.caldera.xyz/txs"
            target="_blank"
            rel="noopener noreferrer"
            className="text-navy hover:underline"
          >
            view all ↗
          </a>
        </div>
      </div>
    </>
  )
}
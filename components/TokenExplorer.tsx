'use client'
import { useState, useEffect } from 'react'
import { formatNumber } from '@/lib/blockscout'

interface Token {
  address: string
  name: string | null
  symbol: string | null
  holders: string | null
  totalSupply: string | null
  decimals: string | null
  type: string
}

const DEFAULT_SHOW = 5

export function TokenExplorer() {
  const [tokens, setTokens]     = useState<Token[]>([])
  const [loading, setLoading]   = useState(true)
  const [sortBy, setSortBy]     = useState<'holders' | 'supply'>('holders')
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/chain?path=/tokens%3Ftype%3DERC-20%26limit%3D50')
        if (!res.ok) return
        const data = await res.json()
        const items = (data.items || []).map((t: any) => ({
          address:     t.address,
          name:        t.name || null,
          symbol:      t.symbol || null,
          holders:     t.holders || null,
          totalSupply: t.total_supply || null,
          decimals:    t.decimals || null,
          type:        t.type || 'ERC-20',
        }))
        setTokens(items)
      } catch (e) {
        console.error('TokenExplorer error:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const sorted = [...tokens].sort((a, b) => {
    if (sortBy === 'holders') {
      return parseInt(b.holders || '0') - parseInt(a.holders || '0')
    }
    const aSupply = parseInt(a.totalSupply || '0') / Math.pow(10, parseInt(a.decimals || '18'))
    const bSupply = parseInt(b.totalSupply || '0') / Math.pow(10, parseInt(b.decimals || '18'))
    return bSupply - aSupply
  })

  const visible = expanded ? sorted : sorted.slice(0, DEFAULT_SHOW)

  function formatSupply(supply: string | null, decimals: string | null): string {
    if (!supply) return '—'
    const dec = parseInt(decimals || '18')
    const val = parseInt(supply) / Math.pow(10, dec)
    return formatNumber(val)
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-4 min-w-0">
      <div className="flex items-center justify-between mb-3">
        <div className="font-mono text-[11px] tracking-[0.12em] text-charcoal font-medium">
          TOKEN EXPLORER
        </div>
        <div className="flex gap-1">
          {(['holders', 'supply'] as const).map(s => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`font-mono text-[9px] tracking-[0.08em] px-2 py-1 rounded border transition-colors ${
                sortBy === s
                  ? 'bg-navy text-parchment border-navy'
                  : 'border-muted text-dim hover:border-navy hover:text-navy'
              }`}
            >
              {s === 'holders' ? 'BY HOLDERS' : 'BY SUPPLY'}
            </button>
          ))}
        </div>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[1fr_70px_90px_80px] gap-3 pb-1.5 border-b border-border mb-1">
        {['TOKEN', 'HOLDERS', 'SUPPLY', 'CONTRACT'].map(h => (
          <div key={h} className="font-mono text-[8px] tracking-[0.14em] text-dim">{h}</div>
        ))}
      </div>

      {loading && (
        <div className="space-y-2 mt-2">
          {Array.from({ length: DEFAULT_SHOW }).map((_, i) => (
            <div key={i} className="h-8 bg-parchment rounded animate-pulse opacity-60"/>
          ))}
        </div>
      )}

      {!loading && sorted.length === 0 && (
        <div className="font-mono text-[10px] text-dim text-center py-6">
          No ERC-20 tokens found on LiteForge
        </div>
      )}

      {!loading && sorted.length > 0 && (
        <>
          <div className="space-y-0">
            {visible.map((token) => (
              <a
                key={token.address}
                href={`https://liteforge.explorer.caldera.xyz/address/${token.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="grid grid-cols-[1fr_70px_90px_80px] gap-3 py-2 border-b border-border/40 last:border-0 hover:bg-parchment rounded transition-colors items-center group"
              >
                {/* Token name + symbol */}
                <div className="min-w-0 flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-navy/15 flex items-center justify-center shrink-0">
                    <span className="font-mono text-[7px] text-navy font-medium">
                      {(token.symbol || '?').slice(0, 2)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="font-mono text-[10px] text-charcoal font-medium truncate">
                      {token.symbol || '—'}
                    </div>
                    <div className="font-mono text-[8px] text-dim truncate">
                      {token.name || '—'}
                    </div>
                  </div>
                </div>

                {/* Holders */}
                <div className={`font-condensed font-black text-sm ${
                  sortBy === 'holders' ? 'text-navy' : 'text-charcoal'
                }`}>
                  {token.holders ? formatNumber(parseInt(token.holders)) : '—'}
                </div>

                {/* Supply */}
                <div className={`font-mono text-[9px] truncate ${
                  sortBy === 'supply' ? 'text-navy' : 'text-dim'
                }`}>
                  {formatSupply(token.totalSupply, token.decimals)}
                </div>

                {/* Contract */}
                <div className="font-mono text-[9px] text-dim group-hover:text-navy transition-colors whitespace-nowrap">
                  {token.address.slice(0, 6)}…{token.address.slice(-4)} ↗
                </div>
              </a>
            ))}
          </div>

          {/* Expand / Collapse */}
          {sorted.length > DEFAULT_SHOW && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="w-full mt-3 font-mono text-[9px] tracking-[0.08em] text-dim hover:text-navy transition-colors py-1.5 border border-border rounded-lg hover:border-navy"
            >
              {expanded
                ? `↑ SHOW LESS`
                : `↓ SHOW ALL ${sorted.length} TOKENS`}
            </button>
          )}
        </>
      )}

      <div className="font-mono text-[9px] text-dim mt-2.5">
        ERC-20 tokens on LiteForge · Click any row to view on explorer
      </div>
    </div>
  )
}
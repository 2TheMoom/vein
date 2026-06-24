'use client'
import { useState, useEffect } from 'react'
import { formatNumber } from '@/lib/blockscout'

interface DataPoint {
  date: string
  txCount: number
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function EcosystemGrowth() {
  console.log('[Vein] EcosystemGrowth mounting')

  const [data, setData]           = useState<DataPoint[]>([])
  const [loading, setLoading]     = useState(true)
  const [available, setAvailable] = useState(true)
  const [hovered, setHovered]     = useState<DataPoint | null>(null)

  useEffect(() => {
    async function load() {
      console.log('[Vein] Fetching growth data...')
      try {
        const res = await fetch('/api/growth')
        console.log('[Vein] Growth response:', res.status)
        if (!res.ok) { setAvailable(false); return }
        const json = await res.json()
        console.log('[Vein] Growth data:', json)
        setAvailable(json.available)
        setData(json.chart_data || [])
      } catch (e) {
        console.error('[Vein] Growth error:', e)
        setAvailable(false)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const max     = Math.max(...data.map(d => d.txCount), 1)
  const total   = data.reduce((s, d) => s + d.txCount, 0)
  const latest  = data[data.length - 1]?.txCount || 0
  const prev    = data[data.length - 2]?.txCount || 0
  const delta   = prev > 0 ? ((latest - prev) / prev * 100).toFixed(1) : null
  const up      = latest >= prev
  const visible = data.slice(-14)

  return (
    <div className="bg-surface border border-border rounded-xl p-4 min-w-0">
      <div className="flex items-center justify-between mb-3">
        <div className="font-mono text-[11px] tracking-[0.12em] text-charcoal font-medium">
          ECOSYSTEM GROWTH
        </div>
        <div className="flex items-center gap-2">
          {delta && (
            <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded border ${
              up
                ? 'bg-green/10 text-green border-green/30'
                : 'bg-crimson/10 text-crimson border-crimson/30'
            }`}>
              {up ? '↑' : '↓'} {Math.abs(parseFloat(delta))}% vs yesterday
            </span>
          )}
          <span className="font-mono text-[9px] bg-navy/10 text-navy border border-navy/30 px-1.5 py-0.5 rounded">
            DAILY TXS
          </span>
        </div>
      </div>

      {loading && (
        <div className="h-24 bg-parchment rounded animate-pulse"/>
      )}

      {!loading && !available && (
        <div className="h-24 flex items-center justify-center">
          <div className="font-mono text-[10px] text-dim">Chart data not available on this instance</div>
        </div>
      )}

      {!loading && available && data.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div>
              <div className="font-mono text-[9px] text-dim mb-0.5">YESTERDAY</div>
              <div className="font-condensed font-black text-lg text-navy">
                {formatNumber(latest)}
              </div>
            </div>
            <div>
              <div className="font-mono text-[9px] text-dim mb-0.5">30D TOTAL</div>
              <div className="font-condensed font-black text-lg text-charcoal">
                {formatNumber(total)}
              </div>
            </div>
            <div>
              <div className="font-mono text-[9px] text-dim mb-0.5">PEAK DAY</div>
              <div className="font-condensed font-black text-lg text-green">
                {formatNumber(max)}
              </div>
            </div>
          </div>

          <div
            className="relative h-20 flex items-end gap-0.5"
            onMouseLeave={() => setHovered(null)}
          >
            {hovered && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-charcoal text-parchment font-mono text-[9px] px-2 py-1 rounded z-10 whitespace-nowrap pointer-events-none">
                {formatDate(hovered.date)} — {formatNumber(hovered.txCount)} txs
              </div>
            )}

            {visible.map((d, i) => {
              const heightPct = Math.max(4, (d.txCount / max) * 100)
              const isLatest  = i === visible.length - 1
              const isHovered = hovered?.date === d.date
              return (
                <div
                  key={d.date}
                  className="flex-1 flex flex-col justify-end cursor-pointer"
                  onMouseEnter={() => setHovered(d)}
                >
                  <div
                    className="w-full rounded-sm transition-all duration-200"
                    style={{
                      height: `${heightPct}%`,
                      background: isLatest ? '#1A6B3C' : '#1F3A8F',
                      opacity: isLatest ? 1 : isHovered ? 1 : 0.5 + (i / visible.length) * 0.5,
                    }}
                  />
                </div>
              )
            })}
          </div>

          <div className="flex justify-between mt-1">
            <div className="font-mono text-[8px] text-dim">
              {visible[0] ? formatDate(visible[0].date) : ''}
            </div>
            <div className="font-mono text-[8px] text-dim">
              {visible[visible.length - 1] ? formatDate(visible[visible.length - 1].date) : ''}
            </div>
          </div>

          <div className="font-mono text-[9px] text-dim mt-1.5">
            Daily transaction counts · Last 14 days · Source: Blockscout
          </div>
        </>
      )}
    </div>
  )
}
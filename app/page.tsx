'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { fetchStats, formatNumber } from '@/lib/blockscout'

export default function Landing() {
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    fetchStats().then(setStats).catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-charcoal font-mono flex flex-col">

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-[#2A2D31]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#232629] rounded-lg border border-[#2E3238] flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <line x1="8" y1="22" x2="11" y2="4" stroke="#2E363E" strokeWidth="0.6"/>
              <line x1="5" y1="14" x2="14" y2="14" stroke="#2E363E" strokeWidth="0.4"/>
              <polygon points="7,22 10,4 13,4 10,22" fill="#BEC8D2"/>
              <line x1="10" y1="4" x2="7" y2="22" stroke="#E8ECF0" strokeWidth="0.9" opacity="0.7"/>
              <line x1="13" y1="4" x2="10" y2="22" stroke="#7A8A94" strokeWidth="0.6" opacity="0.5"/>
              <polygon points="9,22 11,4 13,4 11,22" fill="white" opacity="0.12"/>
            </svg>
          </div>
          <div>
            <div className="font-condensed font-black text-lg text-parchment leading-none tracking-tight">VEIN</div>
            <div className="font-mono text-[8px] tracking-[0.16em] text-dim">LITEFORGE INTELLIGENCE</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green inline-block animate-pulse"/>
            <span className="font-mono text-[10px] text-dim tracking-wide">LIVE</span>
          </div>
          <Link
            href="/dashboard"
            className="font-mono text-[10px] tracking-[0.08em] bg-navy text-parchment px-4 py-2 rounded-lg hover:bg-[#2A4BAF] transition-colors"
          >
            OPEN DASHBOARD →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="font-mono text-[9px] tracking-[0.22em] text-dim mb-4">
          LITEFORGE ECOSYSTEM INTELLIGENCE
        </div>
        <h1 className="font-condensed font-black text-parchment leading-none tracking-tight mb-3"
          style={{ fontSize: 'clamp(48px, 8vw, 80px)' }}>
          WHERE THE<br />
          <span className="text-silver">SILVER FLOWS</span>
        </h1>
        <p className="font-mono text-[11px] text-dim tracking-[0.06em] mb-8 leading-relaxed max-w-sm">
          Live on-chain intelligence for LiteForge.<br />
          Every transaction. Every wallet. Every move.
        </p>
        <div className="flex items-center gap-3 flex-wrap justify-center">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 bg-navy text-parchment font-mono text-[11px] tracking-[0.08em] px-6 py-3 rounded-lg hover:bg-[#2A4BAF] transition-colors"
          >
            OPEN DASHBOARD ↗
          </Link>
          <a
            href="https://github.com/2TheMoom/vein"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 border border-[#2E3238] text-dim font-mono text-[11px] tracking-[0.08em] px-6 py-3 rounded-lg hover:border-navy hover:text-parchment transition-colors"
          >
            VIEW SOURCE ↗
          </a>
        </div>
      </section>

      {/* Live stats strip */}
      <section className="border-t border-[#2A2D31] border-b border-b-[#2A2D31]">
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-[#2A2D31]">
          {[
            { label: 'TOTAL TRANSACTIONS', value: stats ? formatNumber(stats.total_transactions) : '—', accent: true },
            { label: 'UNIQUE ADDRESSES', value: stats ? formatNumber(stats.total_addresses) : '—', accent: true },
            { label: 'AVG BLOCK TIME', value: stats ? `${stats.average_block_time}ms` : '—', accent: false },
            { label: 'AVG GAS (GWEI)', value: stats ? `${stats.gas_prices?.average}` : '—', accent: false },
          ].map(stat => (
            <div key={stat.label} className="px-6 py-5 text-center">
              <div className={`font-condensed font-black text-3xl leading-none mb-1 ${stat.accent ? 'text-silver' : 'text-green'}`}>
                {stat.value}
              </div>
              <div className="font-mono text-[9px] tracking-[0.14em] text-dim">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="border-b border-[#2A2D31]">
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#2A2D31]">
          {[
            {
              icon: '◎',
              title: 'LIVE CHAIN DATA',
              body: 'Real-time stats pulled directly from the LiteForge Blockscout API. No middleman. No delay.',
            },
            {
              icon: '▦',
              title: 'ECOSYSTEM BREAKDOWN',
              body: 'Method-level transaction classification, dApp rankings, zkLTC volume, and wallet growth over time.',
            },
            {
              icon: '⊞',
              title: 'WEEKLY REPORTS',
              body: 'Auto-generated week-over-week summaries with deltas, trends, and top-performing dApps. Downloadable.',
            },
          ].map(f => (
            <div key={f.title} className="px-6 py-6">
              <div className="text-navy text-xl mb-3">{f.icon}</div>
              <div className="font-condensed font-black text-base text-parchment mb-2 tracking-[0.02em]">{f.title}</div>
              <div className="font-mono text-[10px] text-dim leading-relaxed tracking-[0.03em]">{f.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-4 flex items-center justify-between flex-wrap gap-3">
        <div className="font-mono text-[10px] text-dim tracking-[0.06em]">
          VEIN · LITEFORGE INTELLIGENCE · CHAIN ID 4441
        </div>
        <div className="font-mono text-[10px] text-dim">
          Built by{' '}
          <a
            href="https://x.com/Olumi441"
            target="_blank"
            rel="noopener noreferrer"
            className="text-silver font-medium hover:text-parchment transition-colors"
          >
            Abu Olumi
          </a>
        </div>
        <div className="font-mono text-[10px] text-dim">
          Blockscout API · Not financial advice
        </div>
      </footer>

    </div>
  )
}
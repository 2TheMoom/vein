'use client'
import { IconFileAnalytics, IconKey } from '@tabler/icons-react'

interface HeaderProps {
  blockNumber?: string
  lastUpdated?: string
  onWeeklyReport: () => void
  onApiAccess: () => void
}

export function Header({ blockNumber, lastUpdated, onWeeklyReport, onApiAccess }: HeaderProps) {
  return (
    <header className="bg-charcoal">
      {/* Top row — logo + live meta */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#2A2D31]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-rock rounded-lg border border-[#2E3238] flex items-center justify-center flex-shrink-0">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <line x1="8" y1="22" x2="11" y2="4" stroke="#2E363E" strokeWidth="0.6"/>
              <line x1="5" y1="14" x2="14" y2="14" stroke="#2E363E" strokeWidth="0.4"/>
              <line x1="6" y1="18" x2="12" y2="18" stroke="#2E363E" strokeWidth="0.4"/>
              <polygon points="7,22 10,4 13,4 10,22" fill="#BEC8D2"/>
              <line x1="10" y1="4" x2="7" y2="22" stroke="#E8ECF0" strokeWidth="0.9" opacity="0.7"/>
              <line x1="13" y1="4" x2="10" y2="22" stroke="#7A8A94" strokeWidth="0.6" opacity="0.5"/>
              <polygon points="9,22 11,4 13,4 11,22" fill="white" opacity="0.12"/>
            </svg>
          </div>
          <div>
            <div className="font-condensed text-xl font-black tracking-tight text-parchment leading-none">VEIN</div>
            <div className="font-mono text-[9px] tracking-[0.18em] text-dim mt-0.5">LITEFORGE INTELLIGENCE</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green inline-block animate-pulse"/>
            <span className="font-mono text-[11px] text-[#9A9A9F] tracking-wide">LIVE</span>
          </div>
          {blockNumber && (
            <div className="font-mono text-[11px] text-[#9A9A9F] hidden sm:block">
              BLOCK <span className="text-parchment font-medium">#{parseInt(blockNumber).toLocaleString()}</span>
            </div>
          )}
          {lastUpdated && (
            <div className="font-mono text-[11px] text-[#9A9A9F] hidden md:block">
              UPDATED <span className="text-parchment font-medium">{lastUpdated}</span>
            </div>
          )}
        </div>
      </div>

      {/* Feature buttons row — prominent */}
      <div className="flex items-center gap-3 px-6 py-2.5">
        <button
          onClick={onWeeklyReport}
          className="flex items-center gap-2.5 bg-navy hover:bg-[#2A4BAF] transition-colors text-parchment rounded-lg px-4 py-2.5 flex-1 max-w-[260px]"
        >
          <IconFileAnalytics size={18} className="flex-shrink-0" />
          <div className="text-left">
            <div className="font-mono text-[11px] font-medium tracking-[0.08em]">WEEKLY REPORT</div>
            <div className="font-mono text-[9px] text-[#8BAAD4] tracking-[0.06em] mt-0.5 hidden sm:block">
              Week-over-week ecosystem deltas
            </div>
          </div>
        </button>

        <div className="w-px h-9 bg-[#2A2D31]"/>

        <button
          onClick={onApiAccess}
          className="flex items-center gap-2.5 bg-navy hover:bg-[#2A4BAF] transition-colors text-parchment rounded-lg px-4 py-2.5 flex-1 max-w-[260px]"
        >
          <IconKey size={18} className="flex-shrink-0" />
          <div className="text-left">
            <div className="font-mono text-[11px] font-medium tracking-[0.08em]">API ACCESS</div>
            <div className="font-mono text-[9px] text-[#8BAAD4] tracking-[0.06em] mt-0.5 hidden sm:block">
              5 free queries · 0.005 zkLTC/query
            </div>
          </div>
        </button>
      </div>
    </header>
  )
}
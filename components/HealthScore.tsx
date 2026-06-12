'use client'

interface HealthScoreProps {
  avgBlockTimeMs: number
  avgGasPrice: number
  utilization: number
  txsToday: number
  totalBlocks: number
}

function computeScore(
  avgBlockTimeMs: number,
  avgGasPrice: number,
  utilization: number,
  txsToday: number,
  totalBlocks: number
): { score: number; label: string; color: string; breakdown: Record<string, number> } {

  const blockScore = Math.max(0, Math.min(100,
    avgBlockTimeMs <= 200  ? 100 :
    avgBlockTimeMs <= 500  ? 100 - ((avgBlockTimeMs - 200) / 300) * 40 :
    avgBlockTimeMs <= 1000 ? 60  - ((avgBlockTimeMs - 500) / 500) * 60 : 0
  ))

  const gasScore = Math.max(0, Math.min(100,
    avgGasPrice <= 0.1 ? 100 :
    avgGasPrice <= 1   ? 100 - ((avgGasPrice - 0.1) / 0.9) * 50 :
    avgGasPrice <= 10  ? 50  - ((avgGasPrice - 1)   / 9)   * 50 : 0
  ))

  const utilScore = Math.max(0, Math.min(100,
    utilization <= 50 ? 100 :
    utilization <= 80 ? 100 - ((utilization - 50) / 30) * 40 :
    100 - ((utilization - 80) / 20) * 60
  ))

  const txScore = Math.max(0, Math.min(100,
    txsToday >= 1_000_000 ? 100 :
    txsToday >= 500_000   ? 80 + ((txsToday - 500_000) / 500_000) * 20 :
    txsToday >= 100_000   ? 50 + ((txsToday - 100_000) / 400_000) * 30 :
    txsToday >= 10_000    ? 20 + ((txsToday - 10_000)  / 90_000)  * 30 : 10
  ))

  const expectedBlocks = (Date.now() - new Date('2026-03-20').getTime()) / avgBlockTimeMs
  const uptimeRatio    = Math.min(1, totalBlocks / expectedBlocks)
  const uptimeScore    = Math.round(uptimeRatio * 100)

  const score = Math.round(
    blockScore  * 0.25 +
    gasScore    * 0.20 +
    utilScore   * 0.15 +
    txScore     * 0.25 +
    uptimeScore * 0.15
  )

  const label =
    score >= 90 ? 'EXCELLENT' :
    score >= 75 ? 'HEALTHY'   :
    score >= 50 ? 'MODERATE'  : 'STRESSED'

  const color =
    score >= 90 ? '#1A6B3C' :
    score >= 75 ? '#1F3A8F' :
    score >= 50 ? '#B07A1C' : '#B01C2E'

  return {
    score, label, color,
    breakdown: {
      'Block time':  Math.round(blockScore),
      'Gas price':   Math.round(gasScore),
      'Utilization': Math.round(utilScore),
      'TX activity': Math.round(txScore),
      'Uptime':      Math.round(uptimeScore),
    },
  }
}

export function HealthScore({
  avgBlockTimeMs, avgGasPrice, utilization, txsToday, totalBlocks,
}: HealthScoreProps) {
  const { score, label, color, breakdown } = computeScore(
    avgBlockTimeMs, avgGasPrice, utilization, txsToday, totalBlocks
  )

  const radius      = 42
  const circumference = Math.PI * radius
  const filled      = (score / 100) * circumference

  return (
    <div
      className="bg-surface border border-border rounded-xl p-3.5 h-full"
      style={{ borderTopWidth: '3px', borderTopColor: color, borderTopStyle: 'solid' }}
    >
      <div className="font-mono text-[10px] tracking-[0.12em] text-dim mb-2">CHAIN HEALTH</div>

      {/* Desktop layout — gauge left, breakdown right */}
      <div className="hidden sm:flex items-end gap-3">
        <div className="relative w-24 h-14 shrink-0">
          <svg viewBox="0 0 100 56" className="w-full h-full overflow-visible">
            <path d="M 8 50 A 42 42 0 0 1 92 50" fill="none" stroke="#E0DDD6" strokeWidth="7" strokeLinecap="round"/>
            <path
              d="M 8 50 A 42 42 0 0 1 92 50"
              fill="none" stroke={color} strokeWidth="7" strokeLinecap="round"
              strokeDasharray={`${filled} ${circumference}`}
              style={{ transition: 'stroke-dasharray 0.8s ease' }}
            />
            <text x="50" y="48" textAnchor="middle" fontSize="18" fontWeight="800"
              fontFamily="'Barlow Condensed', sans-serif" fill="#161719">
              {score}
            </text>
          </svg>
        </div>
        <div className="flex-1 min-w-0 pb-1">
          <div className="font-condensed font-black text-xl leading-none mb-1" style={{ color }}>{label}</div>
          <div className="space-y-0.5">
            {Object.entries(breakdown).map(([key, val]) => (
              <div key={key} className="flex items-center gap-1.5">
                <div className="font-mono text-[8px] text-dim w-14 shrink-0 text-right">{key}</div>
                <div className="flex-1 h-1 bg-[#E0DDD6] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${val}%`, background: color }}/>
                </div>
                <div className="font-mono text-[8px] text-dim w-5 text-right shrink-0">{val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile layout — score big, breakdown below */}
      <div className="sm:hidden">
        <div className="flex items-center gap-4 mb-3">
          {/* Gauge */}
          <div className="relative w-20 h-12 shrink-0">
            <svg viewBox="0 0 100 56" className="w-full h-full overflow-visible">
              <path d="M 8 50 A 42 42 0 0 1 92 50" fill="none" stroke="#E0DDD6" strokeWidth="8" strokeLinecap="round"/>
              <path
                d="M 8 50 A 42 42 0 0 1 92 50"
                fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${filled} ${circumference}`}
                style={{ transition: 'stroke-dasharray 0.8s ease' }}
              />
              <text x="50" y="48" textAnchor="middle" fontSize="20" fontWeight="800"
                fontFamily="'Barlow Condensed', sans-serif" fill="#161719">
                {score}
              </text>
            </svg>
          </div>
          <div>
            <div className="font-condensed font-black text-2xl leading-none" style={{ color }}>{label}</div>
            <div className="font-mono text-[9px] text-dim mt-0.5">out of 100</div>
          </div>
        </div>
        {/* Breakdown in 2-col grid on mobile */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {Object.entries(breakdown).map(([key, val]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className="font-mono text-[8px] text-dim w-14 shrink-0">{key}</div>
              <div className="flex-1 h-1 bg-[#E0DDD6] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${val}%`, background: color }}/>
              </div>
              <div className="font-mono text-[8px] text-dim w-5 text-right shrink-0">{val}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
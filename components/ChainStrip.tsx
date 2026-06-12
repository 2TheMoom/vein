interface ChainStripProps {
  slowGas: number
  avgGas: number
  fastGas: number
  utilization: number
  totalBlocks: string
  gasUsedToday: string
}

export function ChainStrip({ slowGas, avgGas, fastGas, utilization, totalBlocks, gasUsedToday }: ChainStripProps) {
  const gasUsedBillions = (parseInt(gasUsedToday) / 1e9).toFixed(1) + 'B'
  const totalBlocksM    = (parseInt(totalBlocks)  / 1e6).toFixed(1) + 'M'

  const items = [
    { label: 'SLOW GAS',      value: `${slowGas} gwei`,          accent: false },
    { label: 'AVG GAS',       value: `${avgGas} gwei`,           accent: true  },
    { label: 'FAST GAS',      value: `${fastGas} gwei`,          accent: false },
    { label: 'NETWORK UTIL',  value: `${utilization.toFixed(2)}%`, accent: true },
    { label: 'TOTAL BLOCKS',  value: totalBlocksM,               accent: false },
    { label: 'GAS USED TODAY',value: gasUsedBillions,            accent: false },
  ]

  return (
    <div className="bg-charcoal rounded-xl p-3.5 mb-2.5">
      {/* Desktop: single row */}
      <div className="hidden sm:flex items-center justify-between">
        {items.map((item, i) => (
          <div key={item.label} className="flex items-center gap-3">
            <div className="text-center">
              <div className="font-mono text-[9px] tracking-[0.12em] text-dim mb-1">{item.label}</div>
              <div className={`font-condensed font-black text-base ${item.accent ? 'text-green' : 'text-parchment'}`}>
                {item.value}
              </div>
            </div>
            {i < items.length - 1 && <div className="w-px h-8 bg-[#2E3238]"/>}
          </div>
        ))}
      </div>

      {/* Mobile: 2×3 grid */}
      <div className="grid grid-cols-3 gap-y-3 sm:hidden">
        {items.map(item => (
          <div key={item.label} className="text-center">
            <div className="font-mono text-[8px] tracking-[0.1em] text-dim mb-0.5">{item.label}</div>
            <div className={`font-condensed font-black text-sm ${item.accent ? 'text-green' : 'text-parchment'}`}>
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
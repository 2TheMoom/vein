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
  const totalBlocksM = (parseInt(totalBlocks) / 1e6).toFixed(1) + 'M'

  return (
    <div className="bg-charcoal rounded-xl p-3.5 flex items-center justify-between flex-wrap gap-3 mb-2.5">
      {[
        { label: 'SLOW GAS', value: `${slowGas} gwei`, accent: false },
        { label: 'AVG GAS', value: `${avgGas} gwei`, accent: true },
        { label: 'FAST GAS', value: `${fastGas} gwei`, accent: false },
        { label: 'NETWORK UTIL', value: `${utilization.toFixed(2)}%`, accent: true },
        { label: 'TOTAL BLOCKS', value: totalBlocksM, accent: false },
        { label: 'GAS USED TODAY', value: gasUsedBillions, accent: false },
      ].map((item, i, arr) => (
        <div key={item.label} className="flex items-center gap-3">
          <div className="text-center">
            <div className="font-mono text-[9px] tracking-[0.12em] text-dim mb-1">{item.label}</div>
            <div className={`font-condensed font-black text-base ${item.accent ? 'text-green' : 'text-parchment'}`}>
              {item.value}
            </div>
          </div>
          {i < arr.length - 1 && <div className="w-px h-8 bg-[#2E3238] hidden sm:block"/>}
        </div>
      ))}
    </div>
  )
}
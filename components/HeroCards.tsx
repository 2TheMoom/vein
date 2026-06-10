import { formatNumber } from '@/lib/blockscout'

interface HeroCardsProps {
  totalTxs: string
  totalAddresses: string
  avgBlockTime: number
  avgGasPrice: number
  txsToday: string
}

export function HeroCards({ totalTxs, totalAddresses, avgBlockTime, avgGasPrice, txsToday }: HeroCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-2.5">
      <div className="bg-surface border border-border rounded-xl p-3.5 border-t-[3px] border-t-navy">
        <div className="font-mono text-[10px] tracking-[0.12em] text-dim mb-2">TOTAL TRANSACTIONS</div>
        <div className="font-condensed font-black text-[2rem] text-charcoal leading-none">
          {formatNumber(totalTxs)}
        </div>
        <div className="font-mono text-[10px] text-green mt-1.5 flex items-center gap-1">
          ↑ {formatNumber(txsToday)} today
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-3.5 border-t-[3px] border-t-navy">
        <div className="font-mono text-[10px] tracking-[0.12em] text-dim mb-2">TOTAL ADDRESSES</div>
        <div className="font-condensed font-black text-[2rem] text-charcoal leading-none">
          {formatNumber(totalAddresses)}
        </div>
        <div className="font-mono text-[10px] text-dim mt-1.5">all-time unique</div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-3.5 border-t-[3px] border-t-green">
        <div className="font-mono text-[10px] tracking-[0.12em] text-dim mb-2">AVG BLOCK TIME</div>
        <div className="font-condensed font-black text-[2rem] text-charcoal leading-none">
          {avgBlockTime}
          <span className="text-base font-normal text-dim"> ms</span>
        </div>
        <div className="font-mono text-[10px] text-green mt-1.5 flex items-center gap-1">
          ✓ healthy
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-3.5 border-t-[3px] border-t-green">
        <div className="font-mono text-[10px] tracking-[0.12em] text-dim mb-2">GAS PRICE (AVG)</div>
        <div className="font-condensed font-black text-[2rem] text-charcoal leading-none">
          {avgGasPrice}
          <span className="text-base font-normal text-dim"> gwei</span>
        </div>
        <div className="font-mono text-[10px] text-green mt-1.5 flex items-center gap-1">
          ✓ sub-cent
        </div>
      </div>
    </div>
  )
}
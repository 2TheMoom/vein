'use client'

const QUERIES = [
  { icon: '⇄', label: 'Bridge activity (24h)', color: 'text-navy', prompt: 'Show me bridge activity on LiteForge in the last 24 hours' },
  { icon: '▦', label: 'Top methods today', color: 'text-navy', prompt: 'What are the top transaction methods on LiteForge today?' },
  { icon: '◎', label: 'New wallets (7d)', color: 'text-green', prompt: 'How many new wallets joined LiteForge this week?' },
  { icon: '◈', label: 'zkLTC volume', color: 'text-green', prompt: 'Show me wzkLTC transfer volume on LiteForge' },
  { icon: '▲', label: 'Hottest dApp now', color: 'text-crimson', prompt: 'What is the most active dApp on LiteForge right now?' },
  { icon: '⊞', label: 'Ecosystem report', color: 'text-dim', prompt: 'Give me a full LiteForge ecosystem health report' },
  { icon: '{ }', label: 'Top contracts', color: 'text-navy', prompt: 'Show me the most deployed contracts on LiteForge' },
  { icon: '⛽', label: 'Gas usage trend', color: 'text-dim', prompt: 'What is the gas usage trend on LiteForge this week?' },
  { icon: '⊕', label: 'Token mints today', color: 'text-green', prompt: 'Show all token minting activity on LiteForge today' },
]

export function QueryPanel() {
  return (
    <div className="bg-surface border border-border rounded-xl p-4 mb-2.5">
      <div className="flex items-center justify-between mb-3">
        <div className="font-mono text-[11px] tracking-[0.12em] text-charcoal font-medium">QUERY THE CHAIN</div>
        <span className="font-mono text-[9px] bg-navy/10 text-navy border border-navy/30 px-1.5 py-0.5 rounded tracking-[0.06em]">
          PREDEFINED
        </span>
      </div>
      <div className="font-mono text-[10px] text-dim mb-3 leading-relaxed">
        Select a query to pull filtered on-chain data. Results load inline below.
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {QUERIES.map((q) => (
          <button
            key={q.label}
            className="bg-surface border border-muted rounded-lg px-3 py-2.5 font-mono text-[10px] text-charcoal text-left flex items-center gap-2 hover:border-navy hover:text-navy transition-colors leading-snug"
          >
            <span className={`flex-shrink-0 ${q.color} text-sm`}>{q.icon}</span>
            {q.label} ↗
          </button>
        ))}
      </div>
    </div>
  )
}
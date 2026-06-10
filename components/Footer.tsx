export function Footer() {
  return (
    <footer className="bg-charcoal px-6 py-3 flex items-center justify-between flex-nowrap gap-4">
      <div className="font-mono text-[10px] text-dim tracking-[0.06em] whitespace-nowrap">
        VEIN · LITEFORGE INTELLIGENCE · CHAIN ID 4441
      </div>
      <div className="font-mono text-[10px] text-dim whitespace-nowrap">
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
      <div className="font-mono text-[10px] text-dim whitespace-nowrap">
        Blockscout API · Not financial advice
      </div>
    </footer>
  )
}
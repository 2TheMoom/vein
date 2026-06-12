'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function WalletSearch() {
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSearch = () => {
    const addr = input.trim()
    if (!addr) return
    if (!/^0x[0-9a-fA-F]{40}$/.test(addr)) {
      setError('Enter a valid EVM address (0x...)')
      return
    }
    setError('')
    router.push(`/wallet/${addr}`)
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-4 mb-2.5">
      <div className="flex items-center justify-between mb-3">
        <div className="font-mono text-[11px] tracking-[0.12em] text-charcoal font-medium">
          WALLET LOOKUP
        </div>
        <span className="font-mono text-[9px] bg-navy/10 text-navy border border-navy/30 px-1.5 py-0.5 rounded tracking-[0.06em]">
          PROFILE
        </span>
      </div>
      <div className="font-mono text-[10px] text-dim mb-3">
        Enter any wallet address to see their LiteForge activity profile.
      </div>
      {/* Stack on mobile, row on desktop */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={input}
          onChange={e => { setInput(e.target.value); setError('') }}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder="0x1234…abcd"
          className="flex-1 bg-parchment border border-border rounded-lg px-3 py-2.5 font-mono text-[10px] text-charcoal placeholder:text-muted focus:outline-none focus:border-navy transition-colors"
        />
        <button
          onClick={handleSearch}
          className="bg-navy text-parchment font-mono text-[10px] tracking-[0.08em] px-4 py-2.5 rounded-lg hover:bg-[#2A4BAF] transition-colors sm:shrink-0 w-full sm:w-auto"
        >
          SEARCH ↗
        </button>
      </div>
      {error && (
        <div className="font-mono text-[9px] text-crimson mt-1.5">{error}</div>
      )}
    </div>
  )
}
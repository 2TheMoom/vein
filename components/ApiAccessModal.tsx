'use client'
import { useState, Fragment } from 'react'
import { IconKey, IconX } from '@tabler/icons-react'
import { PAYMENT_DESTINATION, QUERY_PRICE_ZKLTC, FREE_QUERY_LIMIT } from '@/lib/blockscout'

const ENDPOINTS = [
  { method: 'GET', url: 'vein-lilac.vercel.app/api/intelligence/stats?wallet=YOUR_WALLET', desc: 'Full ecosystem snapshot — transactions, addresses, gas, block time' },
  { method: 'GET', url: 'vein-lilac.vercel.app/api/intelligence/activity?wallet=YOUR_WALLET&period=24h', desc: 'Transaction activity — period: 24h · 7d · 30d' },
  { method: 'GET', url: 'vein-lilac.vercel.app/api/intelligence/dapps?wallet=YOUR_WALLET', desc: 'Top dApp rankings by transaction count' },
  { method: 'GET', url: 'vein-lilac.vercel.app/api/intelligence/zkltc?wallet=YOUR_WALLET', desc: 'zkLTC · wzkLTC volume, holders, bridge interactions' },
  { method: 'GET', url: 'vein-lilac.vercel.app/api/intelligence/report/weekly?wallet=YOUR_WALLET', desc: 'Latest weekly intelligence report with deltas' },
  { method: 'POST', url: 'vein-lilac.vercel.app/api/intelligence/confirm/:queryId', desc: 'Confirm payment · Body: {"wallet": "0xYOURS", "txId": "0xTX_HASH"}' },
]

const STEPS = [
  <Fragment key="s0">Send <strong className="text-charcoal">0.005 zkLTC</strong> to the payment destination above on LiteForge</Fragment>,
  <Fragment key="s1">Copy your <strong className="text-charcoal">transaction hash</strong> from the LiteForge explorer</Fragment>,
  <Fragment key="s2">Call <strong className="text-charcoal">POST /api/intelligence/confirm/:queryId</strong> with your wallet and tx hash</Fragment>,
  <Fragment key="s3">1 credit added — <strong className="text-charcoal">next query served immediately</strong></Fragment>,
  <Fragment key="s4">Pass <strong className="text-charcoal">?wallet=0xYOURS</strong> on every request — that&apos;s how queries are tracked per wallet</Fragment>,
]

interface ApiAccessModalProps {
  open: boolean
  onClose: () => void
}

export function ApiAccessModal({ open, onClose }: ApiAccessModalProps) {
  const [copied, setCopied] = useState<string | null>(null)

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 1500)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 bg-charcoal/80 overflow-y-auto">
      <div className="w-full max-w-[560px] bg-surface border border-border rounded-xl overflow-hidden shadow-2xl my-4">

        {/* Header */}
        <div className="bg-charcoal px-5 py-3.5 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <IconKey size={16} className="text-silver" />
              <span className="font-condensed font-black text-xl text-parchment tracking-wide">API ACCESS</span>
              <span className="font-mono text-[9px] bg-green/20 text-green border border-green/40 px-2 py-0.5 rounded tracking-[0.06em]">
                LITEFORGE
              </span>
            </div>
            <div className="font-mono text-[10px] text-dim mt-0.5 tracking-[0.06em]">
              pay-per-query intelligence on LiteForge · Chain ID 4441
            </div>
          </div>
          <button onClick={onClose} className="text-dim hover:text-parchment transition-colors" aria-label="Close">
            <IconX size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">

          {/* Tier cards */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'FREE TIER', value: `${FREE_QUERY_LIMIT} queries`, desc: 'per wallet address' },
              { label: 'PRICE / QUERY', value: `${QUERY_PRICE_ZKLTC} zkLTC`, desc: 'after free tier' },
              { label: 'NETWORK', value: 'LiteForge', desc: 'EVM · Chain ID 4441' },
            ].map(t => (
              <div key={t.label} className="bg-parchment border border-border rounded-lg p-2.5">
                <div className="font-mono text-[9px] tracking-[0.14em] text-dim mb-1.5">{t.label}</div>
                <div className="font-condensed font-black text-[18px] text-navy leading-none">{t.value}</div>
                <div className="font-mono text-[9px] text-dim mt-1">{t.desc}</div>
              </div>
            ))}
          </div>

          {/* Payment destination */}
          <div>
            <div className="font-mono text-[9px] tracking-[0.16em] text-dim mb-1.5">PAYMENT DESTINATION</div>
            <div className="bg-parchment border border-border rounded-lg p-2.5 flex items-center gap-2">
              <div className="font-mono text-[9px] text-navy break-all flex-1 leading-relaxed">
                {PAYMENT_DESTINATION}
              </div>
              <button
                onClick={() => copy(PAYMENT_DESTINATION, 'dest')}
                className="bg-navy text-parchment rounded px-2.5 py-1.5 font-mono text-[9px] tracking-[0.08em] shrink-0 hover:bg-[#2A4BAF] transition-colors"
              >
                {copied === 'dest' ? 'COPIED!' : 'COPY'}
              </button>
            </div>
            <div className="font-mono text-[9px] text-dim mt-1">Send zkLTC to this address on LiteForge using any EVM wallet</div>
          </div>

          {/* Endpoints */}
          <div>
            <div className="font-mono text-[9px] tracking-[0.16em] text-dim mb-1.5">ENDPOINTS</div>
            <div className="space-y-1.5">
              {ENDPOINTS.map((ep, i) => (
                <div key={i} className="bg-parchment border border-border rounded-lg p-2.5 flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div>
                      <span className={`font-mono text-[9px] font-medium tracking-[0.1em] mr-1 ${ep.method === 'POST' ? 'text-crimson' : 'text-green'}`}>
                        {ep.method}
                      </span>
                      <span className="font-mono text-[9px] text-charcoal break-all leading-relaxed">{ep.url}</span>
                    </div>
                    <div className="font-mono text-[9px] text-dim mt-0.5">{ep.desc}</div>
                  </div>
                  <button
                    onClick={() => copy(`https://${ep.url}`, `ep${i}`)}
                    className="border border-muted text-dim rounded px-1.5 py-1 font-mono text-[9px] shrink-0 hover:border-navy hover:text-navy transition-colors"
                  >
                    {copied === `ep${i}` ? '✓' : 'COPY'}
                  </button>
                </div>
              ))}
            </div>
            <div className="font-mono text-[9px] text-dim mt-1">
              Replace <span className="text-navy">YOUR_WALLET</span> with your actual wallet address
            </div>
          </div>

          <div className="h-px bg-border"/>

          {/* How to pay */}
          <div>
            <div className="font-mono text-[9px] tracking-[0.16em] text-dim mb-2">HOW TO PAY</div>
            <div className="grid grid-cols-[20px_1fr] gap-x-2.5 gap-y-1.5 items-start">
              {STEPS.map((step, i) => (
                <Fragment key={i}>
                  <div className="w-5 h-5 rounded-full bg-navy text-parchment font-mono text-[9px] flex items-center justify-center shrink-0 font-medium">
                    {i + 1}
                  </div>
                  <div className="font-mono text-[10px] text-dim leading-relaxed pt-0.5">
                    {step}
                  </div>
                </Fragment>
              ))}
            </div>
          </div>

          {/* Code snippet */}
          <div>
            <div className="font-mono text-[9px] tracking-[0.16em] text-dim mb-1.5">EXAMPLE REQUEST</div>
            <div className="bg-charcoal rounded-lg p-3">
              <pre className="font-mono text-[9px] text-[#9A9A9F] leading-relaxed whitespace-pre-wrap">{`// Ecosystem snapshot
const res = await fetch(
  'https://vein-lilac.vercel.app/api/intelligence/stats' +
  '?wallet=0xYOUR_WALLET_ADDRESS'
);
const data = await res.json();
// → { totalTxs, totalAddresses, avgBlockTime, gasPrice, ... }`}</pre>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border flex gap-2">
          <button className="flex items-center gap-1.5 bg-navy text-parchment rounded-lg px-4 py-2 font-mono text-[10px] tracking-[0.08em] hover:bg-[#2A4BAF] transition-colors">
            VIEW DOCS ↗
          </button>
          <button
            onClick={onClose}
            className="border border-muted text-dim rounded-lg px-4 py-2 font-mono text-[10px] tracking-[0.08em] hover:border-navy hover:text-navy transition-colors"
          >
            CLOSE
          </button>
        </div>

      </div>
    </div>
  )
}
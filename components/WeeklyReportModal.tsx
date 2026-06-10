'use client'
import { useState, useEffect } from 'react'
import { IconFileAnalytics, IconX, IconChevronLeft, IconChevronRight, IconDownload, IconClock } from '@tabler/icons-react'

interface WeeklyReportModalProps {
  open: boolean
  onClose: () => void
}

interface ReportRow {
  id: number
  week_number: number
  week_label: string
  period_start: string
  period_end: string
  data: any
  generated_at: string
}

export function WeeklyReportModal({ open, onClose }: WeeklyReportModalProps) {
  const [reports, setReports] = useState<ReportRow[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [daysUntilFirst, setDaysUntilFirst] = useState<number | null>(null)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetch('/api/reports')
      .then(r => r.json())
      .then(d => {
        setReports(d.reports || [])
        setCurrentIndex(0)
      })
      .catch(() => setReports([]))
      .finally(() => setLoading(false))
  }, [open])

  // Check how many days until first report
  useEffect(() => {
    if (!open || reports.length > 0) return
    fetch('/api/cron/weekly-report')
      .then(r => r.json())
      .then(d => {
        if (d.daysUntilFirstReport) setDaysUntilFirst(d.daysUntilFirstReport)
      })
      .catch(() => {})
  }, [open, reports])

  const report = reports[currentIndex] || null
  const data = report?.data || null
  const canPrev = currentIndex < reports.length - 1
  const canNext = currentIndex > 0

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  const downloadReport = () => {
    if (!report || !data) return

    const periodStart = formatDate(report.period_start)
    const periodEnd = formatDate(report.period_end)

    const content = [
      '═══════════════════════════════════════════',
      `  VEIN — LITEFORGE INTELLIGENCE`,
      `  ${report.week_label.toUpperCase()} · ${periodStart} – ${periodEnd}`,
      '═══════════════════════════════════════════',
      '',
      'ECOSYSTEM METRICS',
      '─────────────────────────────────────────',
      `Total transactions (all-time)  ${data.totalTransactions?.toLocaleString() || '—'}`,
      `Transactions this week         ${data.transactionsThisWeek?.toLocaleString() || '—'}  ${data.deltas?.transactions || ''}`,
      `Total addresses (all-time)     ${data.totalAddresses?.toLocaleString() || '—'}  ${data.deltas?.wallets || ''}`,
      `wzkLTC volume (7d)             ${data.wzkltcVolume || '—'} wzkLTC  ${data.deltas?.volume || ''}`,
      `Bridge interactions (7d)       ${data.bridgeInteractions || '—'}  ${data.deltas?.bridge || ''}`,
      `Avg block time                 ${data.avgBlockTimeMs || '—'} ms`,
      `Avg gas price                  ${data.avgGasPrice || '—'} gwei`,
      `Top dApp                       ${data.topDapp || '—'}`,
      `Top method                     ${data.topMethod || '—'}`,
      '',
      'INSIGHT',
      '─────────────────────────────────────────',
      data.insight || '—',
      '',
      '─────────────────────────────────────────',
      `Generated: ${formatDate(report.generated_at)}`,
      `Source:    vein.vercel.app`,
      `Chain:     LiteForge · Chain ID 4441`,
      `Builder:   Abu Olumi (x.com/Olumi441)`,
      '═══════════════════════════════════════════',
    ].join('\n')

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vein-${report.week_label.toLowerCase().replace(' ', '-')}-report.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 bg-charcoal/80 overflow-y-auto">
      <div className="w-full max-w-[540px] bg-surface border border-border rounded-xl overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="bg-charcoal px-5 py-3.5 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <IconFileAnalytics size={16} className="text-silver" />
              <span className="font-condensed font-black text-xl text-parchment tracking-wide">
                WEEKLY REPORT
              </span>
              {report && (
                <span className="font-mono text-[9px] bg-navy text-parchment px-2 py-0.5 rounded tracking-[0.1em]">
                  {report.week_label.toUpperCase()} · LITEFORGE
                </span>
              )}
            </div>
            <div className="font-mono text-[10px] text-dim mt-0.5 tracking-[0.06em]">
              {report
                ? `${formatDate(report.period_start)} – ${formatDate(report.period_end)}`
                : 'Auto-generated every 7 days after launch'}
            </div>
          </div>
          <button onClick={onClose} className="text-dim hover:text-parchment transition-colors shrink-0" aria-label="Close">
            <IconX size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">

          {loading && (
            <div className="text-center py-10">
              <div className="font-mono text-[10px] text-dim tracking-[0.12em] animate-pulse">
                LOADING REPORTS…
              </div>
            </div>
          )}

          {!loading && reports.length === 0 && (
            <div className="text-center py-10 space-y-3">
              <IconClock size={32} className="text-dim mx-auto" />
              <div className="font-condensed font-black text-2xl text-charcoal">
                FIRST REPORT PENDING
              </div>
              <div className="font-mono text-[10px] text-dim leading-relaxed max-w-xs mx-auto">
                {daysUntilFirst !== null
                  ? `Vein has been live for less than 7 days. First report generates in ${daysUntilFirst} day${daysUntilFirst === 1 ? '' : 's'}.`
                  : 'Weekly reports auto-generate every 7 days after Vein launch. Check back soon.'}
              </div>
            </div>
          )}

          {!loading && report && data && (
            <>
              {/* Week navigation */}
              {reports.length > 1 && (
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
                  <button
                    onClick={() => setCurrentIndex(i => i + 1)}
                    disabled={!canPrev}
                    className="flex items-center gap-1 font-mono text-[10px] text-dim hover:text-navy disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <IconChevronLeft size={14} />
                    PREV WEEK
                  </button>
                  <div className="font-mono text-[10px] text-dim tracking-[0.1em]">
                    {currentIndex + 1} / {reports.length}
                  </div>
                  <button
                    onClick={() => setCurrentIndex(i => i - 1)}
                    disabled={!canNext}
                    className="flex items-center gap-1 font-mono text-[10px] text-dim hover:text-navy disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    NEXT WEEK
                    <IconChevronRight size={14} />
                  </button>
                </div>
              )}

              {/* Period label */}
              <div className="font-mono text-[9px] text-dim tracking-[0.1em] mb-3.5 pb-2.5 border-b border-border">
                LITEFORGE TESTNET · {formatDate(report.period_start).toUpperCase()} – {formatDate(report.period_end).toUpperCase()}
              </div>

              {/* Metrics */}
              <div className="space-y-0">
                {[
                  {
                    label: 'Transactions this week',
                    value: data.transactionsThisWeek?.toLocaleString() || '—',
                    delta: data.deltas?.transactions,
                    up: !data.deltas?.transactions?.startsWith('-'),
                  },
                  {
                    label: 'Total addresses',
                    value: data.totalAddresses?.toLocaleString() || '—',
                    delta: data.deltas?.wallets,
                    up: !data.deltas?.wallets?.startsWith('-'),
                  },
                  {
                    label: 'wzkLTC volume',
                    value: `${data.wzkltcVolume || '—'} wzkLTC`,
                    delta: data.deltas?.volume,
                    up: !data.deltas?.volume?.startsWith('-'),
                  },
                  {
                    label: 'Bridge interactions',
                    value: data.bridgeInteractions?.toLocaleString() || '—',
                    delta: data.deltas?.bridge,
                    up: !data.deltas?.bridge?.startsWith('-'),
                  },
                  {
                    label: 'Avg block time',
                    value: `${data.avgBlockTimeMs || '—'} ms`,
                    delta: 'stable',
                    up: true,
                  },
                  {
                    label: 'Avg gas price',
                    value: `${data.avgGasPrice || '—'} gwei`,
                    delta: 'stable',
                    up: true,
                  },
                  {
                    label: 'Top dApp',
                    value: data.topDapp || '—',
                    delta: null,
                    up: true,
                  },
                ].map(row => (
                  <div
                    key={row.label}
                    className="flex items-baseline justify-between py-2 border-b border-border last:border-0"
                  >
                    <div className="font-mono text-[11px] text-dim">{row.label}</div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-condensed font-black text-xl text-charcoal">{row.value}</span>
                      {row.delta && (
                        <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
                          row.delta === 'stable'
                            ? 'bg-navy/10 text-navy'
                            : row.up
                              ? 'bg-green/10 text-green'
                              : 'bg-crimson/10 text-crimson'
                        }`}>
                          {row.delta}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Insight */}
              {data.insight && (
                <div className="mt-3 p-3 bg-parchment rounded-lg border-l-[3px] border-navy font-mono text-[10px] text-dim leading-relaxed">
                  {data.insight}
                </div>
              )}

              {/* Generated timestamp */}
              <div className="mt-3 font-mono text-[9px] text-dim text-right tracking-[0.06em]">
                Generated {formatDate(report.generated_at)}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border flex gap-2">
          {report && (
            <button
              onClick={downloadReport}
              className="flex items-center gap-1.5 bg-navy text-parchment rounded-lg px-4 py-2 font-mono text-[10px] tracking-[0.08em] hover:bg-[#2A4BAF] transition-colors"
            >
              <IconDownload size={12} />
              DOWNLOAD REPORT
            </button>
          )}
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
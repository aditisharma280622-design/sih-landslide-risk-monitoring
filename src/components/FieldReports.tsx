import { useState } from 'react'
import type { FieldReport } from '@/types/risk'

interface FieldReportsProps {
  reports: FieldReport[]
  onSelectZone: (zoneId: string) => void
}

type Filter = 'all' | 'verified' | 'pending' | 'high-impact'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'verified', label: 'Verified' },
  { id: 'pending', label: 'Pending' },
  { id: 'high-impact', label: 'High Impact' },
]

const STATUS_STYLE: Record<FieldReport['status'], string> = {
  verified: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  pending: 'text-amber-700 bg-amber-50 border-amber-200',
}

const IMPACT_STYLE: Record<FieldReport['impact'], string> = {
  high: 'text-red-700',
  moderate: 'text-orange-700',
  low: 'text-[#1d3045]/60',
}

export default function FieldReports({ reports, onSelectZone }: FieldReportsProps) {
  const [filter, setFilter] = useState<Filter>('all')

  const filtered = reports.filter((report) => {
    if (filter === 'verified') return report.status === 'verified'
    if (filter === 'pending') return report.status === 'pending'
    if (filter === 'high-impact') return report.impact === 'high'
    return true
  })

  return (
    <div className="rounded-md border border-[#1d3045]/10 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1d3045]/10 px-4 py-3">
        <div>
          <h2 className="text-sm font-medium tracking-[0.08em] text-[#1d3045] uppercase">Field Reports</h2>
          <p className="mt-0.5 text-xs text-[#1d3045]/50">Crowd-sourced updates near active zones</p>
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter field reports">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
              className={`rounded-full border px-2.5 py-1 text-[11px] font-medium tracking-[0.04em] uppercase transition-colors ${
                filter === f.id
                  ? 'border-[#1d3045] bg-[#1d3045] text-white'
                  : 'border-[#1d3045]/15 text-[#1d3045]/60 hover:bg-[#1d3045]/5'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <ul className="divide-y divide-[#1d3045]/8">
        {filtered.map((report) => (
          <li key={report.id}>
            <button
              type="button"
              onClick={() => report.zoneId && onSelectZone(report.zoneId)}
              className="flex w-full flex-wrap items-start justify-between gap-2 px-4 py-3 text-left transition-colors hover:bg-[#1d3045]/[0.03]"
            >
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="text-xs font-mono text-[#1d3045]/40">{report.id}</span>
                  <span
                    className={`rounded-full border px-1.5 py-0.5 text-[10px] font-medium tracking-[0.06em] uppercase ${STATUS_STYLE[report.status]}`}
                  >
                    {report.status}
                  </span>
                </span>
                <span className="mt-1 block text-sm font-medium text-[#1d3045]">{report.title}</span>
                <span className="mt-0.5 block text-xs text-[#1d3045]/60">
                  {report.location} · {report.submittedAgo}
                </span>
              </span>
              <span className={`shrink-0 text-[11px] font-medium tracking-[0.06em] uppercase ${IMPACT_STYLE[report.impact]}`}>
                {report.impact} impact
              </span>
            </button>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="px-4 py-6 text-center text-xs text-[#1d3045]/40">No reports match this filter.</li>
        )}
      </ul>
    </div>
  )
}

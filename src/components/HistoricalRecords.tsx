import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import type { HistoricalRecord, Severity } from '@/types/risk'
import { SEVERITY_STYLES } from '@/types/risk'

interface HistoricalRecordsProps {
  records: HistoricalRecord[]
}

const SEVERITY_FILTERS: { id: Severity | 'all'; label: string }[] = [
  { id: 'all', label: 'All Severities' },
  { id: 'critical', label: 'Critical' },
  { id: 'high', label: 'High' },
  { id: 'moderate', label: 'Moderate' },
  { id: 'low', label: 'Low' },
]

export default function HistoricalRecords({ records }: HistoricalRecordsProps) {
  const [query, setQuery] = useState('')
  const [severityFilter, setSeverityFilter] = useState<Severity | 'all'>('all')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return records
      .filter((r) => severityFilter === 'all' || r.severity === severityFilter)
      .filter(
        (r) =>
          q === '' ||
          r.location.toLowerCase().includes(q) ||
          r.district.toLowerCase().includes(q) ||
          r.state.toLowerCase().includes(q),
      )
      .sort((a, b) => (a.date < b.date ? 1 : -1))
  }, [records, query, severityFilter])

  return (
    <div className="rounded-md border border-[#1d3045]/10 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1d3045]/10 px-4 py-3">
        <div>
          <h2 className="text-sm font-medium tracking-[0.08em] text-[#1d3045] uppercase">
            Historical Records
          </h2>
          <p className="mt-0.5 text-xs text-[#1d3045]/50">
            Demo dataset — illustrative prototype records, not a verified archive
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="relative">
            <span className="sr-only">Search historical records</span>
            <Search
              size={14}
              strokeWidth={1.5}
              className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-[#1d3045]/40"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search location, district, state"
              className="w-56 rounded-full border border-[#1d3045]/15 py-1.5 pr-3 pl-8 text-xs text-[#1d3045] outline-none focus:border-[#1d3045]/40"
            />
          </label>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as Severity | 'all')}
            className="rounded-full border border-[#1d3045]/15 py-1.5 px-3 text-xs text-[#1d3045] outline-none focus:border-[#1d3045]/40"
            aria-label="Filter by severity"
          >
            {SEVERITY_FILTERS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[#1d3045]/10 text-[11px] tracking-[0.08em] text-[#1d3045]/50 uppercase">
              <th className="px-4 py-2 font-medium">Date</th>
              <th className="px-4 py-2 font-medium">Location</th>
              <th className="px-4 py-2 font-medium">District</th>
              <th className="px-4 py-2 font-medium">Severity</th>
              <th className="px-4 py-2 font-medium">Trigger</th>
              <th className="px-4 py-2 font-medium">Impact</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1d3045]/8">
            {filtered.map((record) => {
              const style = SEVERITY_STYLES[record.severity]
              return (
                <tr key={record.id} className="align-top">
                  <td className="px-4 py-2.5 font-mono text-xs whitespace-nowrap text-[#1d3045]/70">
                    {record.date}
                  </td>
                  <td className="px-4 py-2.5 text-[#1d3045]">{record.location}</td>
                  <td className="px-4 py-2.5 text-[#1d3045]/70">
                    {record.district}, {record.state}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium tracking-[0.06em] uppercase ${style.text} ${style.bg} ${style.border}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
                      {style.label}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-[#1d3045]/70">{record.trigger}</td>
                  <td className="px-4 py-2.5 text-[#1d3045]/70">{record.impact}</td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-xs text-[#1d3045]/40">
                  No records match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

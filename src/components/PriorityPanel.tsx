import type { PrioritizedRiskZone } from '@/types/risk'
import { SEVERITY_STYLES } from '@/types/risk'

interface PriorityPanelProps {
  zones: PrioritizedRiskZone[]
  selectedZoneId: string | null
  onSelectZone: (zoneId: string) => void
}

export default function PriorityPanel({ zones, selectedZoneId, onSelectZone }: PriorityPanelProps) {
  return (
    <div className="flex h-full flex-col rounded-md border border-[#1d3045]/10 bg-white shadow-sm">
      <div className="border-b border-[#1d3045]/10 px-4 py-3">
        <h2 className="text-sm font-medium tracking-[0.08em] text-[#1d3045] uppercase">
          Impact-Weighted Priority
        </h2>
        <p className="mt-0.5 text-xs text-[#1d3045]/50">Risk is only part of the story.</p>
      </div>

      <ol className="flex-1 divide-y divide-[#1d3045]/8 overflow-y-auto">
        {zones.map((zone, index) => {
          const style = SEVERITY_STYLES[zone.severity]
          const active = zone.id === selectedZoneId
          return (
            <li key={zone.id}>
              <button
                type="button"
                onClick={() => onSelectZone(zone.id)}
                aria-current={active ? 'true' : undefined}
                className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[#1d3045]/[0.03] ${
                  active ? 'bg-[#1d3045]/5' : ''
                }`}
              >
                <span className="mt-0.5 font-mono text-xs text-[#1d3045]/40 tabular-nums">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-[#1d3045]">Zone {zone.id}</span>
                    <span
                      className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-medium tracking-[0.06em] uppercase ${style.text} ${style.bg} ${style.border}`}
                    >
                      {style.label}
                    </span>
                  </span>
                  <span className="mt-1 flex items-center gap-3 text-xs text-[#1d3045]/60">
                    <span>
                      Priority{' '}
                      <span className="font-mono font-medium text-[#1d3045] tabular-nums">
                        {zone.priorityScore}
                      </span>
                    </span>
                    <span>
                      Risk{' '}
                      <span className="font-mono tabular-nums">{zone.riskScore}%</span>
                    </span>
                  </span>
                  <span className="mt-0.5 block text-xs text-[#1d3045]/50">
                    {zone.populationExposed.toLocaleString('en-IN')} exposed
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

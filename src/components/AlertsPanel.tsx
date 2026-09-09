import type { Alert } from '@/types/risk'
import { SEVERITY_STYLES } from '@/types/risk'

interface AlertsPanelProps {
  alerts: Alert[]
  onSelectZone: (zoneId: string) => void
}

export default function AlertsPanel({ alerts, onSelectZone }: AlertsPanelProps) {
  return (
    <div className="rounded-md border border-[#1d3045]/10 bg-white shadow-sm">
      <div className="border-b border-[#1d3045]/10 px-4 py-3">
        <h2 className="text-sm font-medium tracking-[0.08em] text-[#1d3045] uppercase">Alerts</h2>
        <p className="mt-0.5 text-xs text-[#1d3045]/50">{alerts.length} active in the last 6 hours</p>
      </div>

      <ul className="divide-y divide-[#1d3045]/8">
        {alerts.map((alert) => {
          const style = SEVERITY_STYLES[alert.severity]
          return (
            <li key={alert.id}>
              <button
                type="button"
                onClick={() => onSelectZone(alert.zoneId)}
                className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[#1d3045]/[0.03]"
              >
                <span
                  className={`mt-0.5 shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-medium tracking-[0.06em] uppercase ${style.text} ${style.bg} ${style.border}`}
                >
                  {style.label}
                </span>
                {alert.simulated && (
                  <span className="mt-0.5 shrink-0 rounded-full border border-sky-200 bg-sky-50 px-1.5 py-0.5 text-[10px] font-medium tracking-[0.06em] text-sky-700 uppercase">
                    Simulated
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-[#1d3045]">Zone {alert.zoneName}</span>
                  <span className="mt-0.5 block text-xs text-[#1d3045]/60">{alert.reason}</span>
                  <span className="mt-0.5 block text-[11px] text-[#1d3045]/40">{alert.timeAgo}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

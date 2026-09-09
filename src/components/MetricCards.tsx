import { AlertTriangle, Building2, TrendingUp, Users } from 'lucide-react'
import type { PrioritizedRiskZone } from '@/types/risk'

interface MetricCardsProps {
  zones: PrioritizedRiskZone[]
}

export default function MetricCards({ zones }: MetricCardsProps) {
  const highRiskZones = zones.filter((z) => z.severity === 'critical' || z.severity === 'high')
  const populationExposed = zones.reduce((sum, z) => sum + z.populationExposed, 0)
  const criticalInfraSites = zones.reduce((sum, z) => sum + z.infrastructure.length, 0)
  const regionalRisk = Math.round(zones.reduce((sum, z) => sum + z.riskScore, 0) / zones.length)
  const regionalLabel = regionalRisk >= 70 ? 'HIGH' : regionalRisk >= 45 ? 'MODERATE' : 'LOW'

  const cards = [
    {
      label: 'Active High-Risk Zones',
      value: highRiskZones.length.toString(),
      detail: `${zones.filter((z) => z.trend === 'increasing').length} trending up`,
      icon: AlertTriangle,
    },
    {
      label: 'Population Exposed',
      value: populationExposed.toLocaleString('en-IN'),
      detail: 'people',
      icon: Users,
    },
    {
      label: 'Critical Infrastructure',
      value: criticalInfraSites.toString(),
      detail: 'sites at risk',
      icon: Building2,
    },
    {
      label: 'Regional Risk',
      value: `${regionalRisk}%`,
      detail: regionalLabel,
      icon: TrendingUp,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map(({ label, value, detail, icon: Icon }) => (
        <div
          key={label}
          className="rounded-md border border-[#1d3045]/10 bg-white px-4 py-3 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium tracking-[0.12em] text-[#1d3045]/60 uppercase">
              {label}
            </p>
            <Icon size={16} strokeWidth={1.5} className="text-[#1d3045]/40" />
          </div>
          <p className="mt-2 font-mono text-2xl font-medium tabular-nums text-[#1d3045]">
            {value}
          </p>
          <p className="mt-0.5 text-xs text-[#1d3045]/50">{detail}</p>
        </div>
      ))}
    </div>
  )
}

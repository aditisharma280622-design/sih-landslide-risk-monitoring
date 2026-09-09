import { useState } from 'react'
import { ArrowUp, ArrowDown, Minus, X, Navigation } from 'lucide-react'
import type { PrioritizedRiskZone } from '@/types/risk'
import { SEVERITY_STYLES } from '@/types/risk'
import RiskTrend from '@/components/RiskTrend'

interface RiskDetailPanelProps {
  zone: PrioritizedRiskZone
  onClose: () => void
  /** Set by the live simulation panel: risk score before the active scenario was applied. */
  baselineRiskScore?: number
  /** Set by the live simulation panel: explicit trend history ending at the current score. */
  trendSeries?: number[]
  /** Called when user wants to find a safe route from this zone */
  onFindSafeRoute?: (origin: string, destination: string) => void
}

const TREND_META = {
  increasing: { label: 'Increasing', icon: ArrowUp, className: 'text-red-600' },
  steady: { label: 'Steady', icon: Minus, className: 'text-[#1d3045]/60' },
  decreasing: { label: 'Decreasing', icon: ArrowDown, className: 'text-emerald-600' },
}

/**
 * Available emergency destinations for safe route calculation.
 * These are common emergency endpoints during disaster response.
 */
const EMERGENCY_DESTINATIONS = [
  { id: 'N02', name: 'District Hospital (Gangtok)', type: 'hospital' },
  { id: 'N04', name: 'Emergency Shelter (Sikkim)', type: 'emergency_shelter' },
  { id: 'N06', name: 'Shillong Hospital', type: 'hospital' },
  { id: 'N11', name: 'Guwahati Regional Center', type: 'hospital' },
  { id: 'N13', name: 'Agartala Emergency', type: 'hospital' },
]

export default function RiskDetailPanel({
  zone,
  onClose,
  baselineRiskScore,
  trendSeries,
  onFindSafeRoute,
}: RiskDetailPanelProps) {
  const [showFullAnalysisNote, setShowFullAnalysisNote] = useState(false)
  const [selectedDestination, setSelectedDestination] = useState<string>(EMERGENCY_DESTINATIONS[0].id)
  const style = SEVERITY_STYLES[zone.severity]
  const trendMeta = TREND_META[zone.trend]
  const TrendIcon = trendMeta.icon
  const delta =
    baselineRiskScore !== undefined && baselineRiskScore !== zone.riskScore
      ? zone.riskScore - baselineRiskScore
      : null

  // Map zone ID to road network node ID
  // Mangan Ridge (NE-07) → N01, Gangtok Periphery (NE-05) → N02, etc.
  const zoneToNodeMapping: Record<string, string> = {
    'NE-07': 'N01', // Mangan Ridge
    'NE-05': 'N02', // Gangtok Periphery
    'NE-12': 'N05', // Sohra Escarpment
    'NE-03': 'N08', // Bomdila Slopes
  }

  const originNodeId = zoneToNodeMapping[zone.id] || 'N01'
  const isHighRisk = zone.severity === 'high' || zone.severity === 'critical'

  return (
    <div className="flex h-full flex-col overflow-y-auto rounded-md border border-[#1d3045]/10 bg-white shadow-sm">
      <div className="flex items-start justify-between border-b border-[#1d3045]/10 px-4 py-3">
        <div>
          <p className="text-[11px] font-medium tracking-[0.12em] text-[#1d3045]/50 uppercase">
            Zone {zone.id}
          </p>
          <h3 className="mt-0.5 text-lg font-medium text-[#1d3045]">{zone.name}</h3>
          <span
            className={`mt-1 inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium tracking-[0.08em] uppercase ${style.text} ${style.bg} ${style.border}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
            {style.label} Risk
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close zone details"
          className="rounded-full p-1.5 text-[#1d3045]/50 transition-colors hover:bg-[#1d3045]/5 hover:text-[#1d3045]"
        >
          <X size={16} strokeWidth={1.5} />
        </button>
      </div>

      <div className="space-y-5 px-4 py-4">
        {/* Live risk */}
        <section aria-labelledby="live-risk-heading">
          <p id="live-risk-heading" className="text-[11px] font-medium tracking-[0.12em] text-[#1d3045]/50 uppercase">
            Live Risk
          </p>
          <div className="mt-1 flex items-baseline gap-3">
            <span className="font-mono text-4xl font-medium tabular-nums text-[#1d3045]">
              {zone.riskScore}%
            </span>
            <span className={`text-xs font-medium tracking-[0.08em] uppercase ${style.text}`}>
              {style.label}
            </span>
          </div>
          <p className={`mt-1 flex items-center gap-2 text-xs font-medium ${trendMeta.className}`}>
            <span className="flex items-center gap-1">
              <TrendIcon size={12} strokeWidth={2} />
              {trendMeta.label} trend
            </span>
            {delta !== null && (
              <span
                className={`rounded px-1.5 py-0.5 font-mono tabular-nums ${
                  delta > 0 ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
                }`}
              >
                {delta > 0 ? '↑' : '↓'} {delta > 0 ? '+' : ''}
                {delta}%
              </span>
            )}
          </p>
          <div className="mt-3">
            <RiskTrend zoneId={zone.id} currentScore={zone.riskScore} trend={zone.trend} series={trendSeries} />
          </div>

          <dl className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded border border-[#1d3045]/10 px-3 py-2">
              <dt className="text-[10px] font-medium tracking-[0.1em] text-[#1d3045]/50 uppercase">
                Rainfall
              </dt>
              <dd className="mt-0.5 font-mono text-sm text-[#1d3045]">{zone.rainfall24h} mm / 24h</dd>
              {zone.rainfall24h >= 90 && (
                <p className="mt-0.5 text-[10px] font-medium text-red-600">↑ Elevated</p>
              )}
            </div>
            <div className="rounded border border-[#1d3045]/10 px-3 py-2">
              <dt className="text-[10px] font-medium tracking-[0.1em] text-[#1d3045]/50 uppercase">
                Soil Moisture
              </dt>
              <dd className="mt-0.5 font-mono text-sm text-[#1d3045]">{zone.soilMoisture}%</dd>
              {zone.soilMoisture >= 55 && (
                <p className="mt-0.5 text-[10px] font-medium text-red-600">↑ Elevated</p>
              )}
            </div>
            <div className="rounded border border-[#1d3045]/10 px-3 py-2">
              <dt className="text-[10px] font-medium tracking-[0.1em] text-[#1d3045]/50 uppercase">
                Slope
              </dt>
              <dd className="mt-0.5 font-mono text-sm text-[#1d3045]">{zone.slope}°</dd>
              <p className="mt-0.5 text-[10px] font-medium text-[#1d3045]/40">
                {zone.slope >= 25 ? 'High susceptibility' : 'Moderate susceptibility'}
              </p>
            </div>
            <div className="rounded border border-[#1d3045]/10 px-3 py-2">
              <dt className="text-[10px] font-medium tracking-[0.1em] text-[#1d3045]/50 uppercase">
                Historical Events
              </dt>
              <dd className="mt-0.5 font-mono text-sm text-[#1d3045]">{zone.historicalEvents} nearby</dd>
              <p className="mt-0.5 text-[10px] font-medium text-[#1d3045]/40">
                {zone.historicalEvents >= 2 ? 'Multiple events' : 'Isolated event'}
              </p>
            </div>
          </dl>
        </section>

        {/* Population + infrastructure */}
        <section className="border-t border-[#1d3045]/10 pt-4">
          <p className="text-[11px] font-medium tracking-[0.12em] text-[#1d3045]/50 uppercase">
            Population Exposed
          </p>
          <p className="mt-1 font-mono text-xl text-[#1d3045]">
            {zone.populationExposed.toLocaleString('en-IN')}
          </p>

          <p className="mt-4 text-[11px] font-medium tracking-[0.12em] text-[#1d3045]/50 uppercase">
            Infrastructure
          </p>
          <ul className="mt-1 space-y-1">
            {zone.infrastructure.map((item, index) => (
              <li key={`${item.label}-${index}`} className="text-sm text-[#1d3045]/80">
                {item.label}
              </li>
            ))}
          </ul>
        </section>

        {/* Priority breakdown */}
        <section className="border-t border-[#1d3045]/10 pt-4">
          <p className="text-[11px] font-medium tracking-[0.12em] text-[#1d3045]/50 uppercase">
            Impact-Weighted Priority
          </p>
          <table className="mt-2 w-full text-sm">
            <tbody>
              <tr className="border-b border-[#1d3045]/5">
                <td className="py-1.5 text-[#1d3045]/70">Risk Probability</td>
                <td className="py-1.5 text-right font-mono tabular-nums text-[#1d3045]">
                  {zone.priorityBreakdown.riskComponent}%
                </td>
                <td className="py-1.5 pl-3 text-right text-[#1d3045]/40">40%</td>
              </tr>
              <tr className="border-b border-[#1d3045]/5">
                <td className="py-1.5 text-[#1d3045]/70">Population Impact</td>
                <td className="py-1.5 text-right font-mono tabular-nums text-[#1d3045]">
                  {zone.priorityBreakdown.populationComponent}
                </td>
                <td className="py-1.5 pl-3 text-right text-[#1d3045]/40">25%</td>
              </tr>
              <tr className="border-b border-[#1d3045]/5">
                <td className="py-1.5 text-[#1d3045]/70">Infrastructure</td>
                <td className="py-1.5 text-right font-mono tabular-nums text-[#1d3045]">
                  {zone.priorityBreakdown.infrastructureComponent}
                </td>
                <td className="py-1.5 pl-3 text-right text-[#1d3045]/40">25%</td>
              </tr>
              <tr>
                <td className="py-1.5 text-[#1d3045]/70">Route Penalty</td>
                <td className="py-1.5 text-right font-mono tabular-nums text-[#1d3045]">
                  {zone.priorityBreakdown.routePenaltyComponent}
                </td>
                <td className="py-1.5 pl-3 text-right text-[#1d3045]/40">10%</td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="border-t border-[#1d3045]/15">
                <td className="py-2 text-xs font-medium tracking-[0.08em] text-[#1d3045] uppercase">
                  Final Priority
                </td>
                <td colSpan={2} className="py-2 text-right font-mono text-lg font-medium tabular-nums text-[#1d3045]">
                  {zone.priorityScore}/100
                </td>
              </tr>
            </tfoot>
          </table>
          <p className="mt-2 text-[11px] text-[#1d3045]/40">
            Prototype scoring model for demonstration — not a validated disaster-management formula.
          </p>
        </section>

        <p className="rounded border border-[#1d3045]/10 bg-[#1d3045]/5 px-3 py-2 text-xs text-[#1d3045]/70">
          {zone.reason}
        </p>

        {/* Safe Route Feature: Show when risk is high or critical */}
        {isHighRisk && onFindSafeRoute && (
          <section className="border-t border-[#1d3045]/10 pt-4">
            <p className="text-[11px] font-medium tracking-[0.12em] text-[#1d3045]/50 uppercase">
              Emergency Access
            </p>

            <div className="mt-2 space-y-2">
              <div>
                <label
                  htmlFor="route-destination"
                  className="block text-xs font-medium text-[#1d3045] mb-1"
                >
                  Safe Route To:
                </label>
                <select
                  id="route-destination"
                  value={selectedDestination}
                  onChange={(e) => setSelectedDestination(e.target.value)}
                  className="w-full rounded border border-[#1d3045]/10 bg-white px-2.5 py-1.5 text-xs text-[#1d3045] transition-colors hover:border-[#1d3045]/20 focus:border-[#1d3045]/30 focus:outline-none"
                >
                  {EMERGENCY_DESTINATIONS.map((dest) => (
                    <option key={dest.id} value={dest.id}>
                      {dest.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => onFindSafeRoute(originNodeId, selectedDestination)}
                className="w-full flex items-center justify-center gap-2 rounded-md bg-blue-600 py-2.5 text-xs font-medium tracking-[0.1em] text-white uppercase transition-opacity hover:opacity-90"
              >
                <Navigation size={14} strokeWidth={2} />
                Find Safe Route
              </button>
            </div>
          </section>
        )}

        <button
          type="button"
          onClick={() => setShowFullAnalysisNote((v) => !v)}
          className="w-full rounded-md bg-[#1d3045] py-2.5 text-xs font-medium tracking-[0.1em] text-white uppercase transition-opacity hover:opacity-90"
        >
          View Full Analysis
        </button>
        {showFullAnalysisNote && (
          <p className="text-xs text-[#1d3045]/50" role="status">
            Full satellite and historical analysis view is planned for a later phase of PahariRakshak.
          </p>
        )}
      </div>
    </div>
  )
}

import type { PrioritizedRiskZone, RiskZone } from '@/types/risk'
import { SCENARIOS, type ScenarioId, getRiskLevel, generateRiskExplanation, SIM_RISK_LEVEL_STYLES } from '@/utils/riskSimulation'

interface LiveRiskSimulationProps {
  baseZone: RiskZone
  effectiveZone: PrioritizedRiskZone
  scenarioId: ScenarioId | null
  onScenarioSelect: (id: ScenarioId) => void
  onReset: () => void
}

export default function LiveRiskSimulation({
  baseZone,
  effectiveZone,
  scenarioId,
  onScenarioSelect,
  onReset,
}: LiveRiskSimulationProps) {
  const level = getRiskLevel(effectiveZone.riskScore)
  const levelStyle = SIM_RISK_LEVEL_STYLES[level]

  const explanation = generateRiskExplanation({
    rainfall: effectiveZone.rainfall24h,
    soilMoisture: effectiveZone.soilMoisture,
    slope: effectiveZone.slope,
    historicalEvents: effectiveZone.historicalEvents,
    alternateRoutePenalty: effectiveZone.alternateRoutePenalty,
  })

  const metrics = [
    { label: 'Rainfall', value: `${effectiveZone.rainfall24h} mm` },
    { label: 'Soil Moisture', value: `${effectiveZone.soilMoisture}%` },
    { label: 'Slope', value: `${effectiveZone.slope}°` },
    { label: 'Risk Score', value: `${effectiveZone.riskScore}%` },
    { label: 'Priority Score', value: `${effectiveZone.priorityScore}/100` },
  ]

  return (
    <div className="rounded-md border border-[#1d3045]/10 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[#1d3045]/10 px-4 py-3">
        <div>
          <h2 className="text-sm font-medium tracking-[0.08em] text-[#1d3045] uppercase">
            Live Risk Simulation
          </h2>
          <p className="mt-0.5 text-xs text-[#1d3045]/50">
            Zone {baseZone.id} · {baseZone.name}
          </p>
        </div>
        <span className="rounded-full border border-[#1d3045]/15 bg-[#1d3045]/5 px-2 py-0.5 text-[10px] font-medium tracking-[0.08em] text-[#1d3045]/60 uppercase">
          Demo Simulation
        </span>
      </div>

      <div className="px-4 py-4">
        {/* Scenario controls */}
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Rainfall scenario">
          {SCENARIOS.map((scenario) => (
            <button
              key={scenario.id}
              type="button"
              onClick={() => onScenarioSelect(scenario.id)}
              aria-pressed={scenarioId === scenario.id}
              className={`rounded-full border px-3 py-1.5 text-[11px] font-medium tracking-[0.06em] uppercase transition-colors ${
                scenarioId === scenario.id
                  ? 'border-[#1d3045] bg-[#1d3045] text-white'
                  : 'border-[#1d3045]/15 text-[#1d3045]/70 hover:bg-[#1d3045]/5'
              }`}
            >
              {scenario.label}
            </button>
          ))}
          <button
            type="button"
            onClick={onReset}
            disabled={scenarioId === null}
            className="rounded-full border border-[#1d3045]/15 px-3 py-1.5 text-[11px] font-medium tracking-[0.06em] text-[#1d3045]/70 uppercase transition-colors hover:bg-[#1d3045]/5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Reset
          </button>
        </div>

        {/* Live readouts */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded border border-[#1d3045]/10 px-3 py-2">
              <p className="text-[10px] font-medium tracking-[0.1em] text-[#1d3045]/50 uppercase">
                {metric.label}
              </p>
              <p className="mt-0.5 font-mono text-base text-[#1d3045] tabular-nums">{metric.value}</p>
            </div>
          ))}
          <div className="rounded border border-[#1d3045]/10 px-3 py-2">
            <p className="text-[10px] font-medium tracking-[0.1em] text-[#1d3045]/50 uppercase">
              Current Status
            </p>
            <span
              className={`mt-1 inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium tracking-[0.06em] uppercase ${levelStyle.text} ${levelStyle.bg} ${levelStyle.border}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${levelStyle.dot}`} aria-hidden="true" />
              {levelStyle.label}
            </span>
          </div>
        </div>

        {/* Explainability */}
        <div className="mt-4 border-t border-[#1d3045]/10 pt-4">
          <p className="text-[11px] font-medium tracking-[0.12em] text-[#1d3045]/50 uppercase">
            Why is this zone at risk?
          </p>
          <ul className="mt-2 space-y-1">
            {explanation.map((point) => (
              <li key={point} className="flex gap-2 text-xs text-[#1d3045]/75">
                <span aria-hidden="true">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-4 text-[11px] text-[#1d3045]/40">
          Prototype simulation — live environmental feeds will replace these inputs in production.
        </p>
      </div>
    </div>
  )
}

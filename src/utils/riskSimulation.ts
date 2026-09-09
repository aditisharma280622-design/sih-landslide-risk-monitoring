import type { PriorityBreakdown, RiskZone, Severity, Trend } from '@/types/risk'

/**
 * Prototype "Dynamic Live Risk Simulation" engine for the SIH demo.
 *
 * Nothing here is a trained model — it's a small, fully deterministic
 * formula standing in for the real ML risk-prediction API that will
 * eventually replace it. Every function is pure (same inputs always
 * produce the same outputs) so the cause → effect chain the judges see
 * on screen — rainfall up → soil moisture up → risk up → priority up →
 * severity up → alert — is always reproducible, never randomized.
 */

export type ScenarioId = 'normal' | 'heavy' | 'extreme'

export interface Scenario {
  id: ScenarioId
  label: string
  /** Multiplies the zone's baseline 24h rainfall. */
  rainfallMultiplier: number
}

export const SCENARIOS: Scenario[] = [
  { id: 'normal', label: 'Normal Conditions', rainfallMultiplier: 1.0 },
  { id: 'heavy', label: 'Heavy Rainfall', rainfallMultiplier: 1.5 },
  { id: 'extreme', label: 'Extreme Rainfall', rainfallMultiplier: 2.0 },
]

/** Realistic caps so a scenario multiplier can never push a reading past physical plausibility. */
const RAINFALL_CAP_MM = 320
const RAINFALL_SCALE_MM = 300 // rainfall level (mm/24h) treated as "maximum contribution" for the risk formula
const SOIL_MOISTURE_MM_SENSITIVITY = 0.15 // % soil moisture gained per extra mm of rainfall over baseline
const SLOPE_SCALE_DEG = 60
const HISTORICAL_SCALE_EVENTS = 10

export interface SimulationInputs {
  baseRainfall: number
  baseSoilMoisture: number
  slope: number
  historicalEvents: number
}

export interface SimulatedConditions {
  rainfall: number
  soilMoisture: number
  riskScore: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/**
 * Applies a scenario's rainfall multiplier to a zone's baseline readings
 * and derives soil moisture and risk score from it.
 *
 * riskScore = rainfall contribution (40%) + soil moisture contribution (30%)
 *           + slope contribution (20%) + historical vulnerability (10%)
 */
export function simulateConditions(
  inputs: SimulationInputs,
  rainfallMultiplier: number,
): SimulatedConditions {
  const rainfall = clamp(Math.round(inputs.baseRainfall * rainfallMultiplier), 0, RAINFALL_CAP_MM)
  const rainfallDelta = rainfall - inputs.baseRainfall
  const soilMoisture = clamp(
    Math.round(inputs.baseSoilMoisture + rainfallDelta * SOIL_MOISTURE_MM_SENSITIVITY),
    0,
    100,
  )

  const rainfallContribution = (Math.min(rainfall, RAINFALL_SCALE_MM) / RAINFALL_SCALE_MM) * 40
  const soilMoistureContribution = (soilMoisture / 100) * 30
  const slopeContribution = (Math.min(inputs.slope, SLOPE_SCALE_DEG) / SLOPE_SCALE_DEG) * 20
  const historicalContribution =
    (Math.min(inputs.historicalEvents, HISTORICAL_SCALE_EVENTS) / HISTORICAL_SCALE_EVENTS) * 10

  const riskScore = clamp(
    Math.round(rainfallContribution + soilMoistureContribution + slopeContribution + historicalContribution),
    0,
    100,
  )

  return { rainfall, soilMoisture, riskScore }
}

/** The simulation's finer 5-tier scale, used only inside the simulation panel/detail readouts. */
export type SimRiskLevel = 'low' | 'moderate' | 'high' | 'very-high' | 'critical'

export function getRiskLevel(riskScore: number): SimRiskLevel {
  if (riskScore >= 85) return 'critical'
  if (riskScore >= 70) return 'very-high'
  if (riskScore >= 50) return 'high'
  if (riskScore >= 30) return 'moderate'
  return 'low'
}

export const SIM_RISK_LEVEL_STYLES: Record<
  SimRiskLevel,
  { label: string; text: string; bg: string; border: string; dot: string }
> = {
  critical: { label: 'Critical', text: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-600' },
  'very-high': {
    label: 'Very High',
    text: 'text-orange-800',
    bg: 'bg-orange-50',
    border: 'border-orange-300',
    dot: 'bg-orange-600',
  },
  high: {
    label: 'High',
    text: 'text-orange-700',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    dot: 'bg-orange-500',
  },
  moderate: {
    label: 'Moderate',
    text: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    dot: 'bg-amber-400',
  },
  low: {
    label: 'Low',
    text: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
}

/**
 * Collapses the simulation's 5-tier scale down to the dashboard's existing
 * 4-tier Severity, so map colors, the priority panel, and alerts — none of
 * which were redesigned for this feature — keep working exactly as before.
 */
export function toLegacySeverity(level: SimRiskLevel): Severity {
  if (level === 'critical') return 'critical'
  if (level === 'very-high' || level === 'high') return 'high'
  if (level === 'moderate') return 'moderate'
  return 'low'
}

/**
 * The same impact-weighted priority formula used across PahariRakshak:
 * risk 40% + population 25% + infrastructure 25% + route penalty 10%.
 * Population is normalized against the current dataset's maximum, since
 * it isn't itself a 0-100 scale. This is a prototype scoring model, not a
 * validated disaster-management formula.
 */
const PRIORITY_WEIGHTS = {
  risk: 0.4,
  population: 0.25,
  infrastructure: 0.25,
  routePenalty: 0.1,
}

export function calculatePriority(
  zone: Pick<RiskZone, 'riskScore' | 'populationExposed' | 'infrastructureCriticality' | 'alternateRoutePenalty'>,
  maxPopulationInDataset: number,
): { priorityScore: number; priorityBreakdown: PriorityBreakdown } {
  const riskComponent = zone.riskScore
  const populationComponent = (zone.populationExposed / Math.max(maxPopulationInDataset, 1)) * 100
  const infrastructureComponent = zone.infrastructureCriticality
  const routePenaltyComponent = zone.alternateRoutePenalty

  const priorityScore = Math.round(
    riskComponent * PRIORITY_WEIGHTS.risk +
      populationComponent * PRIORITY_WEIGHTS.population +
      infrastructureComponent * PRIORITY_WEIGHTS.infrastructure +
      routePenaltyComponent * PRIORITY_WEIGHTS.routePenalty,
  )

  return {
    priorityScore,
    priorityBreakdown: {
      riskComponent: Math.round(riskComponent),
      populationComponent: Math.round(populationComponent),
      infrastructureComponent: Math.round(infrastructureComponent),
      routePenaltyComponent: Math.round(routePenaltyComponent),
    },
  }
}

/** Simple string hash so each zone gets a stable, repeatable "random" walk. */
function seededRandom(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0
  return () => {
    h = (Math.imul(h, 1664525) + 1013904223) | 0
    return ((h >>> 0) % 1000) / 1000
  }
}

/**
 * Builds a plausible 6-point run-up to `currentScore` for the trend chart's
 * placeholder state (before any simulation scenario has been applied to a
 * zone). Deterministic per zone id, not random — the same zone always
 * produces the same placeholder history.
 */
export function buildPlaceholderSeries(zoneId: string, currentScore: number, trend: Trend): number[] {
  const rand = seededRandom(zoneId)
  const points = 6
  const drift = trend === 'increasing' ? -3 : trend === 'decreasing' ? 3 : 0
  const series: number[] = []
  let value = currentScore
  for (let i = points - 1; i >= 0; i--) {
    series[i] = Math.min(100, Math.max(0, value))
    value = value + drift + (rand() - 0.5) * 6
  }
  series[points - 1] = currentScore
  return series
}

export interface ExplanationInputs {
  rainfall: number
  soilMoisture: number
  slope: number
  historicalEvents: number
  alternateRoutePenalty: number
}

/** Builds the "Why is this zone at risk?" bullet list from whichever factors are actually elevated. */
export function generateRiskExplanation(inputs: ExplanationInputs): string[] {
  const points: string[] = []

  if (inputs.rainfall >= 150) {
    points.push('Extreme rainfall is increasing pore-water pressure')
  } else if (inputs.rainfall >= 90) {
    points.push('Elevated rainfall is raising pore-water pressure in the slope')
  }

  if (inputs.soilMoisture >= 75) {
    points.push('High soil moisture is reducing slope stability')
  } else if (inputs.soilMoisture >= 55) {
    points.push('Rising soil moisture is gradually reducing slope stability')
  }

  if (inputs.slope >= 35) {
    points.push('Steep terrain increases failure susceptibility')
  } else if (inputs.slope >= 25) {
    points.push('Moderately steep terrain contributes to failure susceptibility')
  }

  if (inputs.historicalEvents >= 5) {
    points.push('Frequent historical landslide activity raises baseline vulnerability')
  } else if (inputs.historicalEvents >= 2) {
    points.push('Some historical landslide activity raises baseline vulnerability')
  }

  if (inputs.alternateRoutePenalty >= 60) {
    points.push('Limited alternate routes increase impact priority if this slope fails')
  }

  if (points.length === 0) {
    points.push('Conditions are currently within normal range for this zone')
  }

  return points
}

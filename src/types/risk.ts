export type Severity = 'critical' | 'high' | 'moderate' | 'low'

export type Trend = 'increasing' | 'steady' | 'decreasing'

export type InfrastructureType = 'hospital' | 'highway' | 'bridge' | 'settlement'

export interface InfrastructureRef {
  type: InfrastructureType
  label: string
}

export interface RiskZone {
  id: string
  name: string
  state: string
  lat: number
  lng: number
  /** Modeled probability of a landslide event, 0-100. */
  riskScore: number
  /** Population estimated to be exposed within the zone's impact radius. */
  populationExposed: number
  /** 0-100 composite score for how critical the infrastructure in range is. */
  infrastructureCriticality: number
  /** 0-100; how costly it would be if the alternate/detour route were also cut off. */
  alternateRoutePenalty: number
  rainfall24h: number
  soilMoisture: number
  slope: number
  historicalEvents: number
  trend: Trend
  severity: Severity
  reason: string
  infrastructure: InfrastructureRef[]
}

export interface PriorityBreakdown {
  riskComponent: number
  populationComponent: number
  infrastructureComponent: number
  routePenaltyComponent: number
}

/** A RiskZone with the derived priority score attached, once calculated. */
export interface PrioritizedRiskZone extends RiskZone {
  priorityScore: number
  priorityBreakdown: PriorityBreakdown
}

export interface InfrastructurePoint {
  id: string
  type: InfrastructureType
  name: string
  state: string
  lat: number
  lng: number
}

export interface HistoricalRecord {
  id: string
  date: string
  location: string
  district: string
  state: string
  lat: number
  lng: number
  severity: Severity
  trigger: string
  impact: string
}

export type FieldReportStatus = 'verified' | 'pending'
export type FieldReportImpact = 'high' | 'moderate' | 'low'

export interface FieldReport {
  id: string
  title: string
  location: string
  state: string
  lat: number
  lng: number
  submittedAgo: string
  status: FieldReportStatus
  impact: FieldReportImpact
  zoneId?: string
}

export interface Alert {
  id: string
  severity: Severity
  zoneId: string
  zoneName: string
  reason: string
  timeAgo: string
  /** True for alerts generated live by the risk simulation panel, rather than the static mock feed. */
  simulated?: boolean
}

/** Shared severity → color/label mapping so every dashboard component reads it the same way. */
export const SEVERITY_STYLES: Record<
  Severity,
  { label: string; text: string; bg: string; border: string; dot: string }
> = {
  critical: {
    label: 'Critical',
    text: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
    dot: 'bg-red-600',
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

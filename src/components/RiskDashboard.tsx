import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import DashboardHeader from '@/components/DashboardHeader'
import MetricCards from '@/components/MetricCards'
import RiskLegend from '@/components/RiskLegend'
import PriorityPanel from '@/components/PriorityPanel'
import RiskDetailPanel from '@/components/RiskDetailPanel'
import LiveRiskSimulation from '@/components/LiveRiskSimulation'
import AlertsPanel from '@/components/AlertsPanel'
import FieldReports from '@/components/FieldReports'
import HistoricalRecords from '@/components/HistoricalRecords'
import SafeRoutePanel from '@/components/SafeRoutePanel'
import {
  ALERTS,
  FIELD_REPORTS,
  HISTORICAL_RECORDS,
  INFRASTRUCTURE_POINTS,
  RISK_ZONES,
  prioritizeZones,
} from '@/data/mockRiskData'
import { ROAD_NETWORK } from '@/data/mockRoadNetwork'
import type { Alert, RiskZone, Trend } from '@/types/risk'
import type { RouteResult } from '@/utils/safeRouting'
import { findSafeRoute, updateEdgeRiskForZone } from '@/utils/safeRouting'
import {
  SCENARIOS,
  buildPlaceholderSeries,
  getRiskLevel,
  simulateConditions,
  toLegacySeverity,
  type ScenarioId,
} from '@/utils/riskSimulation'

// Leaflet pulls in a fair amount of code the cinematic landing page never
// needs, so the map is only fetched once someone actually reaches the
// dashboard.
const RiskMap = lazy(() => import('@/components/RiskMap'))

interface RiskDashboardProps {
  onExitToLanding: () => void
}

const RISK_ESCALATION_ALERT_THRESHOLD = 5 // percentage points

/** Applies the active scenario's rainfall multiplier to a single zone, deriving its downstream fields. */
function applyScenario(zone: RiskZone, scenarioId: ScenarioId): RiskZone {
  const scenario = SCENARIOS.find((s) => s.id === scenarioId)!
  const simulated = simulateConditions(
    {
      baseRainfall: zone.rainfall24h,
      baseSoilMoisture: zone.soilMoisture,
      slope: zone.slope,
      historicalEvents: zone.historicalEvents,
    },
    scenario.rainfallMultiplier,
  )
  const level = getRiskLevel(simulated.riskScore)
  const trend: Trend =
    simulated.riskScore > zone.riskScore + 1
      ? 'increasing'
      : simulated.riskScore < zone.riskScore - 1
        ? 'decreasing'
        : 'steady'

  return {
    ...zone,
    rainfall24h: simulated.rainfall,
    soilMoisture: simulated.soilMoisture,
    riskScore: simulated.riskScore,
    severity: toLegacySeverity(level),
    trend,
    reason: `${scenario.label} scenario — elevated rainfall and soil moisture are driving risk`,
  }
}

export default function RiskDashboard({ onExitToLanding }: RiskDashboardProps) {
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(RISK_ZONES[0]?.id ?? null)
  const [scenarioId, setScenarioId] = useState<ScenarioId | null>(null)
  const [trendHistory, setTrendHistory] = useState<number[] | null>(null)
  const [simAlerts, setSimAlerts] = useState<Alert[]>([])

  // Safe route state
  const [activeRoute, setActiveRoute] = useState<RouteResult | null>(null)
  const [safeRouteOrigin, setSafeRouteOrigin] = useState<string | null>(null)
  const [safeRouteDestination, setSafeRouteDestination] = useState<string | null>(null)
  const [updatedRoadNetwork, setUpdatedRoadNetwork] = useState(ROAD_NETWORK)

  const mapSectionRef = useRef<HTMLDivElement>(null)
  const alertsSectionRef = useRef<HTMLDivElement>(null)
  const reportsSectionRef = useRef<HTMLDivElement>(null)
  const historySectionRef = useRef<HTMLDivElement>(null)

  const baseZone = useMemo(() => RISK_ZONES.find((z) => z.id === selectedZoneId), [selectedZoneId])

  // Only the selected zone's environmental readings change — every other
  // zone's data (and every other zone's map marker) stays exactly as it
  // was, per the "keep all other zones intact" requirement.
  const effectiveZones = useMemo(() => {
    if (!selectedZoneId || scenarioId === null) return RISK_ZONES
    return RISK_ZONES.map((zone) => (zone.id === selectedZoneId ? applyScenario(zone, scenarioId) : zone))
  }, [selectedZoneId, scenarioId])

  const prioritizedZones = useMemo(() => prioritizeZones(effectiveZones), [effectiveZones])
  const selectedZone = useMemo(
    () => prioritizedZones.find((z) => z.id === selectedZoneId),
    [prioritizedZones, selectedZoneId],
  )

  const allAlerts = useMemo(() => [...simAlerts, ...ALERTS], [simAlerts])

  const handleSelectZone = (zoneId: string) => {
    setSelectedZoneId(zoneId)
    setScenarioId(null)
    setTrendHistory(null)
    mapSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleNavigate = (section: 'map' | 'alerts' | 'reports' | 'history') => {
    const target = {
      map: mapSectionRef,
      alerts: alertsSectionRef,
      reports: reportsSectionRef,
      history: historySectionRef,
    }[section]
    target.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleScenarioSelect = (nextScenarioId: ScenarioId) => {
    if (!baseZone || nextScenarioId === scenarioId) return // no-op re-click guard, never re-fires an alert

    const referenceRiskScore =
      scenarioId === null ? baseZone.riskScore : applyScenario(baseZone, scenarioId).riskScore
    const simulatedZone = applyScenario(baseZone, nextScenarioId)

    setScenarioId(nextScenarioId)
    setTrendHistory((prev) => {
      const history = prev ?? buildPlaceholderSeries(baseZone.id, baseZone.riskScore, baseZone.trend)
      return [...history.slice(-5), simulatedZone.riskScore]
    })

    // A single, explicit user action (not an effect watching derived
    // state) generates at most one alert per click, so re-renders — even
    // React StrictMode's double-invoke — can never duplicate it.
    const delta = simulatedZone.riskScore - referenceRiskScore
    if (delta >= RISK_ESCALATION_ALERT_THRESHOLD) {
      const scenario = SCENARIOS.find((s) => s.id === nextScenarioId)!
      setSimAlerts((prev) => [
        {
          id: `sim-${baseZone.id}-${Date.now()}`,
          severity: simulatedZone.severity,
          zoneId: baseZone.id,
          zoneName: baseZone.name,
          reason: `Risk escalated ${referenceRiskScore}% → ${simulatedZone.riskScore}% under ${scenario.label.toLowerCase()} — rising rainfall and soil moisture`,
          timeAgo: 'Just now',
          simulated: true,
        },
        ...prev,
      ])
    }
  }

  const handleResetScenario = () => {
    setScenarioId(null)
    setTrendHistory(null)
    // When resetting scenario, reset road network to baseline
    setUpdatedRoadNetwork(ROAD_NETWORK)
    // Recalculate route if active with baseline network
    if (activeRoute && safeRouteOrigin && safeRouteDestination) {
      const freshRoute = findSafeRoute(ROAD_NETWORK, safeRouteOrigin, safeRouteDestination)
      if (freshRoute) {
        setActiveRoute(freshRoute)
      }
    }
  }

  const handleFindSafeRoute = (origin: string, destination: string) => {
    const route = findSafeRoute(updatedRoadNetwork, origin, destination)
    if (route) {
      setActiveRoute(route)
      setSafeRouteOrigin(origin)
      setSafeRouteDestination(destination)
    }
  }

  const handleCloseSafeRoute = () => {
    setActiveRoute(null)
    setSafeRouteOrigin(null)
    setSafeRouteDestination(null)
  }

  // Recalculate road risk when zone risk changes via simulation
  useEffect(() => {
    if (selectedZone && scenarioId !== null) {
      // Mangan Ridge (N01) is directly affected by its own zone risk
      // This is a simplified cascade: if Mangan Ridge risk escalates, its associated roads escalate
      const affectedEdges =
        selectedZone.id === 'NE-07'
          ? ['E01', 'E03', 'E21'] // Edges connected to Mangan Ridge
          : []

      if (affectedEdges.length > 0) {
        const newNetwork = updateEdgeRiskForZone(
          ROAD_NETWORK,
          selectedZone.id,
          selectedZone.riskScore,
          affectedEdges,
        )
        setUpdatedRoadNetwork(newNetwork)

        // Recalculate active route with updated network
        if (activeRoute && safeRouteOrigin && safeRouteDestination) {
          const refreshedRoute = findSafeRoute(newNetwork, safeRouteOrigin, safeRouteDestination)
          if (refreshedRoute) {
            setActiveRoute(refreshedRoute)
          }
        }
      }
    }
  }, [selectedZone, scenarioId, activeRoute, safeRouteOrigin, safeRouteDestination])

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <DashboardHeader onNavigate={handleNavigate} onExitToLanding={onExitToLanding} />

      <main className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-medium tracking-[0.02em] text-[#1d3045] sm:text-2xl">
              Landslide Risk Monitoring
            </h1>
            <p className="mt-1 text-sm text-[#1d3045]/60">
              North Eastern Region · Live environmental and impact intelligence
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#1d3045]/50">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-40" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="font-medium tracking-[0.08em] text-[#1d3045] uppercase">Live</span>
            <span>· Last updated 12 seconds ago</span>
          </div>
        </div>

        <MetricCards zones={prioritizedZones} />

        <p className="text-[11px] tracking-[0.08em] text-[#1d3045]/40 uppercase">
          Prototype dashboard · all figures are illustrative demo data
        </p>

        <div ref={mapSectionRef} className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">
          <div className="relative h-[420px] overflow-hidden rounded-md border border-[#1d3045]/10 shadow-sm sm:h-[520px] xl:h-[640px]">
            <Suspense
              fallback={
                <div className="flex h-full w-full items-center justify-center bg-[#eef1f4] text-xs text-[#1d3045]/40 uppercase tracking-[0.08em]">
                  Loading map…
                </div>
              }
            >
              <RiskMap
                zones={prioritizedZones}
                infrastructure={INFRASTRUCTURE_POINTS}
                historicalRecords={HISTORICAL_RECORDS}
                fieldReports={FIELD_REPORTS}
                selectedZoneId={selectedZoneId}
                onSelectZone={handleSelectZone}
                roadNetwork={updatedRoadNetwork}
                activeRoute={activeRoute}
                safeRouteOrigin={safeRouteOrigin}
                safeRouteDestination={safeRouteDestination}
              />
            </Suspense>
            <RiskLegend />
          </div>

          <div className="flex flex-col gap-4 xl:h-[640px]">
            <div className="min-h-0 flex-1 basis-1/2">
              <PriorityPanel
                zones={prioritizedZones}
                selectedZoneId={selectedZoneId}
                onSelectZone={handleSelectZone}
              />
            </div>
            {selectedZone && (
              <div className="min-h-0 flex-1 basis-1/2">
                <RiskDetailPanel
                  zone={selectedZone}
                  onClose={() => setSelectedZoneId(null)}
                  baselineRiskScore={baseZone?.riskScore}
                  trendSeries={trendHistory ?? undefined}
                  onFindSafeRoute={handleFindSafeRoute}
                />
              </div>
            )}
          </div>
        </div>

        {baseZone && selectedZone && (
          <LiveRiskSimulation
            baseZone={baseZone}
            effectiveZone={selectedZone}
            scenarioId={scenarioId}
            onScenarioSelect={handleScenarioSelect}
            onReset={handleResetScenario}
          />
        )}

        {activeRoute && safeRouteOrigin && safeRouteDestination && (
          <SafeRoutePanel
            route={activeRoute}
            network={updatedRoadNetwork}
            originId={safeRouteOrigin}
            destinationId={safeRouteDestination}
            onClose={handleCloseSafeRoute}
          />
        )}

        <div ref={alertsSectionRef}>
          <AlertsPanel alerts={allAlerts} onSelectZone={handleSelectZone} />
        </div>

        <div ref={reportsSectionRef}>
          <FieldReports reports={FIELD_REPORTS} onSelectZone={handleSelectZone} />
        </div>

        <div ref={historySectionRef}>
          <HistoricalRecords records={HISTORICAL_RECORDS} />
        </div>
      </main>
    </div>
  )
}

import { X, AlertTriangle, CheckCircle2, MapPin, Navigation } from 'lucide-react'
import type { RoadNetwork } from '@/data/mockRoadNetwork'
import type { RouteResult } from '@/utils/safeRouting'
import { estimateTravelTimeMinutes } from '@/utils/safeRouting'

interface SafeRoutePanelProps {
  /** The safe route result to display */
  route: RouteResult | null
  /** The road network containing nodes */
  network: RoadNetwork
  /** Current origin node ID */
  originId: string
  /** Current destination node ID */
  destinationId: string
  /** Baseline distance (original shortest path before risk escalation) */
  baselineDistance?: number
  /** Called when user closes the panel */
  onClose: () => void
}

export default function SafeRoutePanel({
  route,
  network,
  originId,
  destinationId,
  baselineDistance,
  onClose,
}: SafeRoutePanelProps) {
  if (!route) {
    return (
      <div className="flex flex-col items-center justify-center rounded-md border border-[#1d3045]/10 bg-white p-8 shadow-sm text-center">
        <p className="text-[#1d3045]/50">No route available</p>
      </div>
    )
  }

  const originNode = network.nodes.find((n) => n.id === originId)
  const destNode = network.nodes.find((n) => n.id === destinationId)
  const travelTime = estimateTravelTimeMinutes(route.distanceKm)

  const additionalDistance =
    baselineDistance !== undefined ? Math.round((route.distanceKm - baselineDistance) * 10) / 10 : null

  return (
    <div className="flex flex-col overflow-y-auto rounded-md border border-[#1d3045]/10 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-[#1d3045]/10 px-4 py-3">
        <div>
          <p className="text-[11px] font-medium tracking-[0.12em] text-[#1d3045]/50 uppercase">Safe Route Recommendation</p>
          <h3 className="mt-0.5 text-lg font-medium text-[#1d3045]">Protected Path</h3>
          <p className="mt-1 text-xs text-[#1d3045]/60">
            Route optimized for safety while minimizing detour distance
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close safe route panel"
          className="rounded-full p-1.5 text-[#1d3045]/50 transition-colors hover:bg-[#1d3045]/5 hover:text-[#1d3045]"
        >
          <X size={16} strokeWidth={1.5} />
        </button>
      </div>

      {/* Content */}
      <div className="space-y-5 px-4 py-4">
        {/* Route nodes */}
        <section aria-labelledby="route-nodes-heading">
          <p id="route-nodes-heading" className="text-[11px] font-medium tracking-[0.12em] text-[#1d3045]/50 uppercase">
            Route
          </p>
          <div className="mt-2 space-y-2">
            {originNode && (
              <div className="flex items-start gap-2">
                <MapPin size={14} className="mt-1 flex-shrink-0 text-emerald-600" strokeWidth={2} />
                <div>
                  <p className="font-medium text-sm text-[#1d3045]">{originNode.name}</p>
                  <p className="text-xs text-[#1d3045]/50">Origin</p>
                </div>
              </div>
            )}

            {route.path.length > 2 && (
              <div className="flex items-center justify-center py-1">
                <div className="h-2 w-0.5 bg-[#1d3045]/20" />
              </div>
            )}

            {destNode && (
              <div className="flex items-start gap-2">
                <Navigation size={14} className="mt-1 flex-shrink-0 text-blue-600" strokeWidth={2} />
                <div>
                  <p className="font-medium text-sm text-[#1d3045]">{destNode.name}</p>
                  <p className="text-xs text-[#1d3045]/50">Destination</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Route metrics */}
        <section className="border-t border-[#1d3045]/10 pt-4" aria-labelledby="metrics-heading">
          <p id="metrics-heading" className="text-[11px] font-medium tracking-[0.12em] text-[#1d3045]/50 uppercase">
            Route Details
          </p>
          <dl className="mt-2 grid grid-cols-2 gap-3">
            <div className="rounded border border-[#1d3045]/10 px-3 py-2">
              <dt className="text-[10px] font-medium tracking-[0.1em] text-[#1d3045]/50 uppercase">Distance</dt>
              <dd className="mt-0.5 font-mono text-sm font-medium text-[#1d3045]">{route.distanceKm} km</dd>
            </div>
            <div className="rounded border border-[#1d3045]/10 px-3 py-2">
              <dt className="text-[10px] font-medium tracking-[0.1em] text-[#1d3045]/50 uppercase">Est. Time</dt>
              <dd className="mt-0.5 font-mono text-sm font-medium text-[#1d3045]">~{travelTime} min</dd>
            </div>
            <div className="rounded border border-[#1d3045]/10 px-3 py-2">
              <dt className="text-[10px] font-medium tracking-[0.1em] text-[#1d3045]/50 uppercase">Safety</dt>
              <dd className="mt-0.5 font-mono text-sm font-medium text-emerald-700">
                {(route.safetyScore * 100).toFixed(0)}%
              </dd>
            </div>
            <div className="rounded border border-[#1d3045]/10 px-3 py-2">
              <dt className="text-[10px] font-medium tracking-[0.1em] text-[#1d3045]/50 uppercase">Segments</dt>
              <dd className="mt-0.5 font-mono text-sm font-medium text-[#1d3045]">{route.path.length - 1}</dd>
            </div>
          </dl>
        </section>

        {/* Additional distance comparison */}
        {additionalDistance !== null && additionalDistance > 0 && (
          <section className="border-t border-[#1d3045]/10 pt-4">
            <div className="flex items-start gap-3 rounded border border-amber-200 bg-amber-50 px-3 py-2">
              <AlertTriangle size={16} className="mt-0.5 flex-shrink-0 text-amber-700" strokeWidth={2} />
              <div>
                <p className="text-sm font-medium text-amber-900">Added Distance for Safety</p>
                <p className="text-xs text-amber-800">
                  <span className="font-mono font-medium">+{additionalDistance} km</span> additional to avoid high-risk segments
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Risk warnings */}
        {route.blockedSegments.length > 0 && (
          <section className="border-t border-[#1d3045]/10 pt-4">
            <div className="flex items-start gap-3 rounded border border-red-200 bg-red-50 px-3 py-2">
              <AlertTriangle size={16} className="mt-0.5 flex-shrink-0 text-red-700" strokeWidth={2} />
              <div>
                <p className="text-sm font-medium text-red-900">High-Risk Segments</p>
                <p className="text-xs text-red-800">
                  {route.blockedSegments.length} segment(s) with elevated landslide risk were unavoidable on this route
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Safety confirmation */}
        {route.safetyScore >= 0.7 && route.blockedSegments.length === 0 && (
          <section className="border-t border-[#1d3045]/10 pt-4">
            <div className="flex items-start gap-3 rounded border border-emerald-200 bg-emerald-50 px-3 py-2">
              <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0 text-emerald-700" strokeWidth={2} />
              <div>
                <p className="text-sm font-medium text-emerald-900">Safe Route Confirmed</p>
                <p className="text-xs text-emerald-800">This route avoids all high-risk landslide zones</p>
              </div>
            </div>
          </section>
        )}

        {/* Footer note */}
        <p className="text-[10px] leading-relaxed text-[#1d3045]/50">
          <strong>Prototype routing:</strong> Road network and travel estimates are demo data. This system demonstrates how
          environmental risk cascades to road safety and route recalculation.
        </p>
      </div>
    </div>
  )
}

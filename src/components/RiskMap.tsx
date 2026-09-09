import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { FieldReport, HistoricalRecord, InfrastructurePoint, PrioritizedRiskZone, Severity } from '@/types/risk'
import type { RoadNetwork } from '@/data/mockRoadNetwork'
import type { RouteResult } from '@/utils/safeRouting'
import { NER_MAP_CENTER, NER_MAP_ZOOM } from '@/data/mockRiskData'

interface RiskMapProps {
  zones: PrioritizedRiskZone[]
  infrastructure: InfrastructurePoint[]
  historicalRecords: HistoricalRecord[]
  fieldReports: FieldReport[]
  selectedZoneId: string | null
  onSelectZone: (zoneId: string) => void
  roadNetwork?: RoadNetwork
  activeRoute?: RouteResult | null
  safeRouteOrigin?: string | null
  safeRouteDestination?: string | null
}

const SEVERITY_COLOR: Record<Severity, string> = {
  critical: '#dc2626',
  high: '#f97316',
  moderate: '#f59e0b',
  low: '#10b981',
}

const INFRA_SYMBOL: Record<InfrastructurePoint['type'], string> = {
  hospital: 'H',
  highway: '—',
  bridge: '≈',
  settlement: '●',
}

function divIcon(html: string, size: number) {
  return L.divIcon({
    html,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

function infrastructureIcon(type: InfrastructurePoint['type']) {
  return divIcon(
    `<div style="
      width:20px;height:20px;border-radius:6px;
      background:#ffffff;border:1px solid rgba(29,48,69,0.25);
      display:flex;align-items:center;justify-content:center;
      font:600 10px/1 monospace;color:#1d3045;box-shadow:0 1px 2px rgba(0,0,0,0.15);
    ">${INFRA_SYMBOL[type]}</div>`,
    20,
  )
}

const fieldReportIcon = divIcon(
  `<div style="
    width:14px;height:14px;border-radius:50%;
    background:#0ea5e9;border:2px solid white;
    box-shadow:0 1px 3px rgba(0,0,0,0.35);
  "></div>`,
  14,
)

/** Recenters the map on the selected zone without remounting the whole map. */
function FocusZone({ zone }: { zone: PrioritizedRiskZone | undefined }) {
  const map = useMap()
  useEffect(() => {
    if (zone) map.flyTo([zone.lat, zone.lng], Math.max(map.getZoom(), 8), { duration: 0.6 })
  }, [zone, map])
  return null
}

export default function RiskMap({
  zones,
  infrastructure,
  historicalRecords,
  fieldReports,
  selectedZoneId,
  onSelectZone,
  roadNetwork,
  activeRoute,
  safeRouteOrigin,
  safeRouteDestination,
}: RiskMapProps) {
  const selectedZone = useMemo(() => zones.find((z) => z.id === selectedZoneId), [zones, selectedZoneId])

  // Build route coordinates for polyline visualization
  const routeCoordinates = useMemo(() => {
    if (!activeRoute || !roadNetwork) return []
    return activeRoute.path
      .map((nodeId) => {
        const node = roadNetwork.nodes.find((n) => n.id === nodeId)
        return node ? ([node.lat, node.lng] as [number, number]) : null
      })
      .filter((coord) => coord !== null) as [number, number][]
  }, [activeRoute, roadNetwork])

  return (
    <MapContainer
      center={NER_MAP_CENTER}
      zoom={NER_MAP_ZOOM}
      scrollWheelZoom
      style={{ height: '100%', width: '100%' }}
      aria-label="Landslide risk map of the North Eastern Region"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FocusZone zone={selectedZone} />

      {/* Historical landslide points — smallest, most muted markers */}
      {historicalRecords.map((record) => (
        <CircleMarker
          key={record.id}
          center={[record.lat, record.lng]}
          radius={4}
          pathOptions={{ color: '#1d3045', weight: 1, fillColor: '#1d3045', fillOpacity: 0.35 }}
        >
          <Popup>
            <p className="text-xs font-medium">{record.location}</p>
            <p className="text-xs text-gray-500">
              {record.date} · {record.trigger}
            </p>
          </Popup>
        </CircleMarker>
      ))}

      {/* Infrastructure */}
      {infrastructure.map((point) => (
        <Marker key={point.id} position={[point.lat, point.lng]} icon={infrastructureIcon(point.type)}>
          <Popup>
            <p className="text-xs font-medium">{point.name}</p>
            <p className="text-xs text-gray-500 capitalize">{point.type}</p>
          </Popup>
        </Marker>
      ))}

      {/* Field reports */}
      {fieldReports.map((report) => (
        <Marker key={report.id} position={[report.lat, report.lng]} icon={fieldReportIcon}>
          <Popup>
            <p className="text-xs font-medium">{report.title}</p>
            <p className="text-xs text-gray-500">
              {report.location} · {report.submittedAgo}
            </p>
          </Popup>
        </Marker>
      ))}

      {/* Active safe route polyline */}
      {routeCoordinates.length > 1 && (
        <Polyline
          positions={routeCoordinates}
          pathOptions={{
            color: '#0ea5e9',
            weight: 3,
            opacity: 0.8,
            dashArray: '5, 5',
            lineCap: 'round',
            lineJoin: 'round',
          }}
        >
          <Popup>
            <p className="text-xs font-medium">Safe Route</p>
            <p className="text-xs text-gray-500">
              {activeRoute?.distanceKm} km · Safety {((activeRoute?.safetyScore ?? 0) * 100).toFixed(0)}%
            </p>
          </Popup>
        </Polyline>
      )}

      {/* Route origin and destination markers */}
      {safeRouteOrigin && roadNetwork && (
        (() => {
          const originNode = roadNetwork.nodes.find((n) => n.id === safeRouteOrigin)
          if (!originNode) return null
          return (
            <CircleMarker
              key={`route-origin-${safeRouteOrigin}`}
              center={[originNode.lat, originNode.lng]}
              radius={8}
              pathOptions={{
                color: '#10b981',
                weight: 2,
                fillColor: '#10b981',
                fillOpacity: 0.8,
              }}
            >
              <Popup>
                <p className="text-xs font-medium">{originNode.name}</p>
                <p className="text-xs text-gray-500">Route Origin</p>
              </Popup>
            </CircleMarker>
          )
        })()
      )}

      {safeRouteDestination && roadNetwork && (
        (() => {
          const destNode = roadNetwork.nodes.find((n) => n.id === safeRouteDestination)
          if (!destNode) return null
          return (
            <CircleMarker
              key={`route-dest-${safeRouteDestination}`}
              center={[destNode.lat, destNode.lng]}
              radius={8}
              pathOptions={{
                color: '#3b82f6',
                weight: 2,
                fillColor: '#3b82f6',
                fillOpacity: 0.8,
              }}
            >
              <Popup>
                <p className="text-xs font-medium">{destNode.name}</p>
                <p className="text-xs text-gray-500">Route Destination</p>
              </Popup>
            </CircleMarker>
          )
        })()
      )}

      {/* Risk zones — the primary layer, drawn last so they sit on top */}
      {zones.map((zone) => {
        const color = SEVERITY_COLOR[zone.severity]
        const isSelected = zone.id === selectedZoneId
        const radius = 10 + Math.min(zone.populationExposed / 900, 14)
        return (
          <CircleMarker
            key={zone.id}
            center={[zone.lat, zone.lng]}
            radius={radius}
            pathOptions={{
              color: isSelected ? '#1d3045' : color,
              weight: isSelected ? 3 : 1.5,
              fillColor: color,
              fillOpacity: isSelected ? 0.55 : 0.35,
            }}
            eventHandlers={{ click: () => onSelectZone(zone.id) }}
          >
            <Popup>
              <p className="text-xs font-medium">Zone {zone.id}</p>
              <p className="text-xs text-gray-500">
                {zone.name} · {zone.riskScore}% risk
              </p>
            </Popup>
          </CircleMarker>
        )
      })}
    </MapContainer>
  )
}

/**
 * Safe Route Calculation Engine
 *
 * Implements Dijkstra's shortest-path algorithm with risk-aware cost calculation.
 * Routes are optimized for BOTH distance and safety, with landslide risk taking
 * priority over raw distance metrics.
 *
 * This utility is independent of React and can be used in any context.
 */

import type { RoadEdge, RoadNetwork } from '@/data/mockRoadNetwork'

export interface RouteRequest {
  network: RoadNetwork
  origin: string
  destination: string
  blockedEdges?: string[] // Edge IDs to force-block
}

export interface RouteResult {
  /** Ordered list of node IDs from origin to destination */
  path: string[]
  /** Total distance in kilometers */
  distanceKm: number
  /** Safety score (0-1, higher is safer) */
  safetyScore: number
  /** Edge IDs that are high-risk or blocked */
  blockedSegments: string[]
  /** Whether the route includes any high-risk segments that were unavoidable */
  hasWarnings: boolean
}

/**
 * Calculate the cost of an edge based on distance and risk.
 *
 * The cost function prioritizes safety while still considering distance.
 * Risk-aware cost avoids dangerous roads even if they're shorter.
 *
 * Cost formula:
 * baseCost = distance (km)
 * riskPenalty = 0 if risk < 0.30
 *               (risk - 0.30) * 2 if 0.30 <= risk < 0.60  → 0 to 0.60
 *               (risk - 0.60) * 8 if 0.60 <= risk < 0.80  → 0 to 1.60
 *               ∞ if risk >= 0.80 (effectively blocked)
 *
 * A slightly longer safe route will always be preferred to a dangerous shortcut.
 */
export function calculateEdgeCost(edge: RoadEdge): number {
  const riskNorm = edge.riskScore / 100 // Normalize 0-100 to 0-1

  // Edge with risk >= 80 is considered blocked
  if (edge.blocked || edge.riskScore >= 80) {
    return Infinity
  }

  // Distance component (base cost)
  const distanceCost = edge.distanceKm

  // Risk penalty component (non-linear, steeper as risk increases)
  let riskPenalty = 0
  if (riskNorm >= 0.8) {
    // Blocked edges already return Infinity above
    riskPenalty = Infinity
  } else if (riskNorm >= 0.6) {
    // High risk: steep penalty (multiplier: 8)
    riskPenalty = (riskNorm - 0.6) * 8
  } else if (riskNorm >= 0.3) {
    // Moderate risk: light penalty (multiplier: 2)
    riskPenalty = (riskNorm - 0.3) * 2
  }
  // Low risk (< 0.30): no penalty

  return distanceCost + riskPenalty
}

/**
 * Dijkstra's shortest-path algorithm with risk-aware cost.
 *
 * Returns the path from origin to destination that minimizes cost
 * (distance + risk-weighted penalty).
 */
export function dijkstraRoute(request: RouteRequest): RouteResult | null {
  const { network, origin, destination, blockedEdges = [] } = request

  // Validate nodes exist
  const originNode = network.nodes.find((n) => n.id === origin)
  const destNode = network.nodes.find((n) => n.id === destination)
  if (!originNode || !destNode) {
    return null
  }

  const nodeIds = new Set(network.nodes.map((n) => n.id))
  if (!nodeIds.has(origin) || !nodeIds.has(destination)) {
    return null
  }

  // Initialize distances and previous nodes
  const distances: Record<string, number> = {}
  const previous: Record<string, string | null> = {}
  const unvisited = new Set<string>()

  for (const node of network.nodes) {
    distances[node.id] = node.id === origin ? 0 : Infinity
    previous[node.id] = null
    unvisited.add(node.id)
  }

  // Dijkstra's algorithm
  while (unvisited.size > 0) {
    // Find unvisited node with smallest distance
    let current: string | null = null
    let minDistance = Infinity
    for (const nodeId of unvisited) {
      if (distances[nodeId] < minDistance) {
        minDistance = distances[nodeId]
        current = nodeId
      }
    }

    if (current === null || minDistance === Infinity) {
      // No path exists
      break
    }

    if (current === destination) {
      // Found destination, reconstruct path
      const path: string[] = []
      let node: string | null = destination
      while (node !== null) {
        path.unshift(node)
        node = previous[node]
      }

      // Calculate route metrics
      const resultPath = path
      let totalDistance = 0
      let riskSum = 0
      const blockedSegs: string[] = []

      for (let i = 0; i < resultPath.length - 1; i++) {
        const from = resultPath[i]
        const to = resultPath[i + 1]
        const edge = network.edges.find(
          (e) => (e.from === from && e.to === to) || (e.from === to && e.to === from),
        )
        if (edge) {
          totalDistance += edge.distanceKm
          riskSum += edge.riskScore
          if (edge.blocked || edge.riskScore >= 80) {
            blockedSegs.push(edge.id)
          }
        }
      }

      const avgRisk = resultPath.length > 1 ? riskSum / (resultPath.length - 1) : 0
      const safetyScore = Math.max(0, 1 - avgRisk / 100)

      return {
        path: resultPath,
        distanceKm: Math.round(totalDistance * 10) / 10,
        safetyScore: Math.round(safetyScore * 1000) / 1000,
        blockedSegments: blockedSegs,
        hasWarnings: blockedSegs.length > 0,
      }
    }

    unvisited.delete(current)

    // Check neighbors
    for (const edge of network.edges) {
      if (!((edge.from === current && unvisited.has(edge.to)) || (edge.to === current && unvisited.has(edge.from)))) {
        continue
      }

      // Skip blocked edges unless we're explicitly checking them
      if (blockedEdges.includes(edge.id) || edge.blocked) {
        continue
      }

      const neighbor = edge.from === current ? edge.to : edge.from
      const edgeCost = calculateEdgeCost(edge)

      if (edgeCost !== Infinity) {
        const newDist = distances[current] + edgeCost
        if (newDist < distances[neighbor]) {
          distances[neighbor] = newDist
          previous[neighbor] = current
        }
      }
    }
  }

  // No path found
  return null
}

/**
 * Find the safest route between two points, considering current risk state.
 * This is the main public API for route calculation.
 */
export function findSafeRoute(
  network: RoadNetwork,
  origin: string,
  destination: string,
  blockedEdges: string[] = [],
): RouteResult | null {
  return dijkstraRoute({ network, origin, destination, blockedEdges })
}

/**
 * Update edge risk scores in-place when environmental conditions change.
 * Used to cascade risk escalation from RiskZone to RoadEdge.
 *
 * Correlation: If a zone's risk increases and it affects nearby roads,
 * we elevate those roads' risk scores accordingly.
 */
export function updateEdgeRiskForZone(
  network: RoadNetwork,
  _zoneId: string,
  zoneRiskScore: number,
  affectedEdgeIds: string[],
): RoadNetwork {
  // Create a shallow copy to avoid mutation
  const updated = {
    ...network,
    edges: network.edges.map((edge) => {
      if (affectedEdgeIds.includes(edge.id)) {
        // Escalate risk if zone risk is high
        const escalation = Math.max(0, (zoneRiskScore - 50) * 0.5)
        return {
          ...edge,
          riskScore: Math.min(100, edge.riskScore + escalation),
        }
      }
      return edge
    }),
  }
  return updated
}

/**
 * Get estimated travel time from distance.
 * Prototype estimate: assume 40 km/h average speed on mountain roads.
 * Returns minutes (rounded to nearest 5).
 */
export function estimateTravelTimeMinutes(distanceKm: number): number {
  const speedKmPerHour = 40
  const minutes = (distanceKm / speedKmPerHour) * 60
  return Math.round(minutes / 5) * 5
}

/**
 * Describe what a route avoids or highlights.
 */
export function describeRoute(
  _network: RoadNetwork,
  route: RouteResult,
): { description: string; warnings: string[] } {
  const warnings: string[] = []

  if (route.blockedSegments.length > 0) {
    warnings.push(`Route includes ${route.blockedSegments.length} high-risk segment(s) that could not be avoided`)
  }

  if (route.safetyScore < 0.5) {
    warnings.push('Safety score is low; consider alternative routes if available')
  }

  const description =
    warnings.length > 0
      ? `Recommended route covers ${route.distanceKm} km with safety score ${(route.safetyScore * 100).toFixed(0)}%.`
      : `Safe route identified: ${route.distanceKm} km, safety score ${(route.safetyScore * 100).toFixed(0)}%.`

  return { description, warnings }
}

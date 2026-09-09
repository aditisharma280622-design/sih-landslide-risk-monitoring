/**
 * Prototype road network for the Safe Route feature.
 *
 * This is mock/demo data assembled for the SIH 2026 submission.
 * Road coordinates, distances, and risk values are illustrative.
 * This is NOT a real road network connected to live mapping or traffic data.
 *
 * USE CASES:
 * - Demonstrate how Dijkstra routing responds to landslide risk escalation
 * - Show alternative route calculation when a high-risk segment blocks primary access
 * - Integrate with the existing Live Risk Simulation to cascade risk → road impact
 */

export interface RoadNode {
  id: string
  name: string
  lat: number
  lng: number
  type: 'settlement' | 'hospital' | 'junction' | 'emergency_shelter' | 'police_station'
}

export interface RoadEdge {
  id: string
  from: string
  to: string
  /** Distance in kilometers */
  distanceKm: number
  /** Risk score for this edge; 0-100 scale. Edges >= 80 are considered blocked. */
  riskScore: number
  /** True if this edge is explicitly blocked by user action or simulation. */
  blocked: boolean
}

export interface RoadNetwork {
  nodes: RoadNode[]
  edges: RoadEdge[]
}

/**
 * Demo road network spanning the North Eastern Region.
 * Approximately 18 nodes and 28 edges covering major transport corridors
 * and emergency access routes.
 */
export const ROAD_NETWORK: RoadNetwork = {
  nodes: [
    // Sikkim nodes
    {
      id: 'N01',
      name: 'Mangan Ridge',
      lat: 27.5117,
      lng: 88.5318,
      type: 'settlement',
    },
    {
      id: 'N02',
      name: 'Gangtok',
      lat: 27.3389,
      lng: 88.6065,
      type: 'hospital',
    },
    {
      id: 'N03',
      name: 'Lachung',
      lat: 27.7056,
      lng: 88.3889,
      type: 'settlement',
    },
    {
      id: 'N04',
      name: 'Sikkim Emergency Shelter',
      lat: 27.4,
      lng: 88.5,
      type: 'emergency_shelter',
    },

    // Meghalaya nodes
    {
      id: 'N05',
      name: 'Cherrapunji',
      lat: 25.2841,
      lng: 91.7385,
      type: 'settlement',
    },
    {
      id: 'N06',
      name: 'Shillong',
      lat: 25.5788,
      lng: 91.8933,
      type: 'hospital',
    },
    {
      id: 'N07',
      name: 'Police Station Shillong',
      lat: 25.575,
      lng: 91.895,
      type: 'police_station',
    },

    // Arunachal Pradesh nodes
    {
      id: 'N08',
      name: 'Bomdila',
      lat: 27.2645,
      lng: 92.4159,
      type: 'settlement',
    },
    {
      id: 'N09',
      name: 'Tawang',
      lat: 27.5859,
      lng: 91.8594,
      type: 'emergency_shelter',
    },
    {
      id: 'N10',
      name: 'Itanagar',
      lat: 28.107,
      lng: 93.6068,
      type: 'hospital',
    },

    // Assam nodes
    {
      id: 'N11',
      name: 'Guwahati',
      lat: 26.1445,
      lng: 91.7362,
      type: 'hospital',
    },
    {
      id: 'N12',
      name: 'Regional Police',
      lat: 26.145,
      lng: 91.735,
      type: 'police_station',
    },

    // Tripura nodes
    {
      id: 'N13',
      name: 'Agartala',
      lat: 23.8333,
      lng: 91.2667,
      type: 'hospital',
    },
    {
      id: 'N14',
      name: 'Jampui',
      lat: 23.9863,
      lng: 92.2856,
      type: 'settlement',
    },

    // Mizoram nodes
    {
      id: 'N15',
      name: 'Aizawl',
      lat: 23.7367,
      lng: 92.7241,
      type: 'hospital',
    },
    {
      id: 'N16',
      name: 'Lunglei',
      lat: 22.8833,
      lng: 92.75,
      type: 'settlement',
    },

    // Manipur nodes
    {
      id: 'N17',
      name: 'Imphal',
      lat: 24.8170,
      lng: 94.9042,
      type: 'hospital',
    },

    // Central junction
    {
      id: 'N18',
      name: 'NH-37 Junction',
      lat: 25.8,
      lng: 92.5,
      type: 'junction',
    },
  ],

  edges: [
    // Sikkim corridor: Mangan Ridge → Gangtok → Lachung
    // This is a key corridor where high landslide risk directly impacts travel
    {
      id: 'E01',
      from: 'N01',
      to: 'N02',
      distanceKm: 12.4,
      riskScore: 25, // Baseline: moderate risk, can escalate during simulation
      blocked: false,
    },
    {
      id: 'E02',
      from: 'N02',
      to: 'N03',
      distanceKm: 28.5,
      riskScore: 18,
      blocked: false,
    },
    {
      id: 'E03',
      from: 'N01',
      to: 'N04',
      distanceKm: 9.8,
      riskScore: 35,
      blocked: false,
    },
    {
      id: 'E04',
      from: 'N04',
      to: 'N02',
      distanceKm: 8.5,
      riskScore: 20,
      blocked: false,
    },

    // Meghalaya corridor: Cherrapunji ↔ Shillong
    {
      id: 'E05',
      from: 'N05',
      to: 'N06',
      distanceKm: 35.2,
      riskScore: 28,
      blocked: false,
    },
    {
      id: 'E06',
      from: 'N06',
      to: 'N07',
      distanceKm: 0.8,
      riskScore: 10,
      blocked: false,
    },

    // Arunachal Pradesh: Bomdila → Tawang → Itanagar
    {
      id: 'E07',
      from: 'N08',
      to: 'N09',
      distanceKm: 48.3,
      riskScore: 32,
      blocked: false,
    },
    {
      id: 'E08',
      from: 'N09',
      to: 'N10',
      distanceKm: 120.0,
      riskScore: 15,
      blocked: false,
    },
    {
      id: 'E09',
      from: 'N08',
      to: 'N10',
      distanceKm: 98.0,
      riskScore: 22,
      blocked: false,
    },

    // Assam corridor: Guwahati ↔ Regional Police
    {
      id: 'E10',
      from: 'N11',
      to: 'N12',
      distanceKm: 1.5,
      riskScore: 8,
      blocked: false,
    },

    // Tripura corridor: Agartala ↔ Jampui ↔ Lunglei approach
    {
      id: 'E11',
      from: 'N13',
      to: 'N14',
      distanceKm: 22.5,
      riskScore: 18,
      blocked: false,
    },
    {
      id: 'E12',
      from: 'N14',
      to: 'N13',
      distanceKm: 22.5,
      riskScore: 18,
      blocked: false,
    },

    // Mizoram corridor: Aizawl ↔ Lunglei
    {
      id: 'E13',
      from: 'N15',
      to: 'N16',
      distanceKm: 110.0,
      riskScore: 20,
      blocked: false,
    },

    // Inter-region connections
    // Sikkim ↔ Assam via junction
    {
      id: 'E14',
      from: 'N02',
      to: 'N18',
      distanceKm: 85.0,
      riskScore: 16,
      blocked: false,
    },
    {
      id: 'E15',
      from: 'N18',
      to: 'N11',
      distanceKm: 65.0,
      riskScore: 14,
      blocked: false,
    },

    // Meghalaya ↔ Junction
    {
      id: 'E16',
      from: 'N06',
      to: 'N18',
      distanceKm: 68.0,
      riskScore: 19,
      blocked: false,
    },

    // Arunachal ↔ Assam via Itanagar
    {
      id: 'E17',
      from: 'N10',
      to: 'N11',
      distanceKm: 250.0,
      riskScore: 12,
      blocked: false,
    },

    // Assam ↔ Tripura
    {
      id: 'E18',
      from: 'N11',
      to: 'N13',
      distanceKm: 145.0,
      riskScore: 17,
      blocked: false,
    },

    // Tripura ↔ Mizoram
    {
      id: 'E19',
      from: 'N13',
      to: 'N15',
      distanceKm: 135.0,
      riskScore: 21,
      blocked: false,
    },

    // Tripura ↔ Manipur
    {
      id: 'E20',
      from: 'N13',
      to: 'N17',
      distanceKm: 180.0,
      riskScore: 24,
      blocked: false,
    },

    // Alternative routes for resilience
    // Mangan Ridge → Lachung (alternate to Gangtok)
    {
      id: 'E21',
      from: 'N01',
      to: 'N03',
      distanceKm: 42.0,
      riskScore: 20,
      blocked: false,
    },

    // Gangtok → Tawang (cross-region alternate)
    {
      id: 'E22',
      from: 'N02',
      to: 'N09',
      distanceKm: 220.0,
      riskScore: 18,
      blocked: false,
    },

    // Shillong → Guwahati (alternate route)
    {
      id: 'E23',
      from: 'N06',
      to: 'N11',
      distanceKm: 92.0,
      riskScore: 15,
      blocked: false,
    },

    // Cherrapunji → Assam (alternate)
    {
      id: 'E24',
      from: 'N05',
      to: 'N11',
      distanceKm: 120.0,
      riskScore: 22,
      blocked: false,
    },

    // Bomdila → Guwahati (alternate for Itanagar)
    {
      id: 'E25',
      from: 'N08',
      to: 'N11',
      distanceKm: 280.0,
      riskScore: 19,
      blocked: false,
    },

    // Lunglei → Mizoram junction
    {
      id: 'E26',
      from: 'N16',
      to: 'N15',
      distanceKm: 110.0,
      riskScore: 19,
      blocked: false,
    },

    // Manipur access
    {
      id: 'E27',
      from: 'N17',
      to: 'N11',
      distanceKm: 255.0,
      riskScore: 20,
      blocked: false,
    },

    // Emergency shelter to hospital shortcuts
    {
      id: 'E28',
      from: 'N04',
      to: 'N06',
      distanceKm: 95.0,
      riskScore: 25,
      blocked: false,
    },
  ],
}

/**
 * Helper to look up edge by nodes (undirected lookup for routing).
 * Road networks are typically bidirectional in emergency contexts.
 */
export function findEdge(
  network: RoadNetwork,
  fromId: string,
  toId: string,
  includeBlockedAndHighRisk: boolean = false,
): RoadEdge | undefined {
  const edge = network.edges.find((e) => (e.from === fromId && e.to === toId) || (e.from === toId && e.to === fromId))
  if (!edge) return undefined
  if (!includeBlockedAndHighRisk && (edge.blocked || edge.riskScore >= 80)) return undefined
  return edge
}

/**
 * Get all neighbors of a node (both directions, respecting blockage).
 */
export function getNeighbors(
  network: RoadNetwork,
  nodeId: string,
  includeBlockedAndHighRisk: boolean = false,
): Array<{ nodeId: string; edge: RoadEdge }> {
  const neighbors = network.edges
    .filter((e) => {
      if (includeBlockedAndHighRisk) return e.from === nodeId || e.to === nodeId
      return (e.from === nodeId || e.to === nodeId) && !e.blocked && e.riskScore < 80
    })
    .map((e) => ({
      nodeId: e.from === nodeId ? e.to : e.from,
      edge: e,
    }))
  return neighbors
}



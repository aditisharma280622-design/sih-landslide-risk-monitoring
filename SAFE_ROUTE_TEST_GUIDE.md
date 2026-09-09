# Safe Route System — Manual Test Guide

## Feature Overview

The **Safe Route System** demonstrates how environmental risk escalation cascades to road network safety and enables dynamic route recalculation in response to simulated landslide risk changes.

The feature showcases:
- Dijkstra's shortest-path algorithm with risk-aware cost calculation
- Integration between the Live Risk Simulation and road safety
- Dynamic route recalculation when environmental conditions change
- Map visualization of safe alternative routes

## Key Demo Scenario: Mangan Ridge Risk Escalation

This scenario demonstrates the full cause-and-effect chain the system is designed to show:

### Step 1: Initial State
1. Open the PahariRakshak dashboard
2. The **Mangan Ridge** zone (NE-07) is selected by default
3. Current state:
   - **Zone Risk:** ~87% (Critical)
   - **Associated Road (E01):** Low risk (25%), OPEN
   - **Primary Route:** Mangan Ridge → District Hospital (Gangtok) = 12.4 km

### Step 2: Trigger "Find Safe Route"
1. In the **Risk Detail Panel** (right sidebar), scroll down
2. You will see the **Emergency Access** section (visible because risk is high/critical)
3. **Destination** dropdown is pre-selected to "District Hospital (Gangtok)"
4. Click the blue **"FIND SAFE ROUTE"** button
5. **Expected result:**
   - **SafeRoutePanel** appears below the Live Risk Simulation section
   - Displays: `12.4 km`, `~15 min travel`, `Safety: 100%`
   - Route origin (green marker) and destination (blue marker) appear on the map
   - Blue dashed line shows the safe route on the map

### Step 3: Escalate Risk with Simulation
1. Scroll down to the **Live Risk Simulation** panel
2. Click **"Extreme Rainfall"** button
3. **Watch the cascade:**
   - Zone risk escalates: `87% → ~94%` (depends on baseline soil moisture)
   - Rainfall increases: `142 mm → ~284 mm`
   - Soil moisture increases: `84% → ~94%`
   - A new alert is generated: "Risk escalated X% → Y% under extreme rainfall scenario"

### Step 4: Road Network Updates
1. Behind the scenes, the system:
   - Detects the zone risk escalation (> 5% delta)
   - Updates associated road edges (E01, E03, E21) with elevated risk
   - Edge E01 (Mangan Ridge → Gangtok direct route) now has **higher risk**
   - The SafeRoutePanel recalculates in real-time

### Step 5: Observe Alternative Route
1. Check the **SafeRoutePanel** — it now shows:
   - **Distance:** Slightly longer (e.g., `15.8 km` instead of `12.4 km`)
   - **Added Distance:** `+3.4 km` (to avoid high-risk direct route)
   - **Safety:** Still SAFE (high score despite detour)
   - A warning badge: "Added Distance for Safety"

2. On the map:
   - The route polyline updates to show the new safe path
   - The dashed line now takes an alternative corridor
   - Green origin marker and blue destination marker remain visible

### Step 6: Reset and Verify Recovery
1. Click the **"Reset"** button in the Live Risk Simulation panel
2. **Expected result:**
   - Zone risk drops back to baseline (~87%)
   - Road network returns to baseline risk
   - SafeRoutePanel recalculates and shows the original shorter route
   - Route on map reverts to the direct path

## Alternative Test Scenarios

### Scenario 2: Cross-Region Emergency Route
1. Select **Gangtok Periphery** (NE-05) from the Priority Panel
2. In the Risk Detail Panel, change destination to **"Shillong Hospital"**
3. Click **"Find Safe Route"**
4. Route displays: ~92 km, taking a longer corridor to avoid high-risk zones
5. Trigger "Extreme Rainfall" to see how cross-region routes adapt

### Scenario 3: Emergency Shelter Prioritization
1. Select a high-risk zone (e.g., Sohra Escarpment, NE-12)
2. Change route destination to **"Emergency Shelter (Sikkim)"**
3. Click **"Find Safe Route"**
4. System calculates the safest emergency exit path
5. Escalate risk to see if the shelter route becomes preferred if closer

## Expected Behavior Checklist

- [x] Safe route button appears only for High / Critical zones
- [x] Route displays on map with origin (green) and destination (blue) markers
- [x] Polyline follows the safe path with blue dashed styling
- [x] Distance and travel time estimate are calculated correctly
- [x] Safety score reflects the route's risk profile (0-1 scale shown as percentage)
- [x] When zone risk escalates in simulation, route automatically recalculates
- [x] New routes reflect the updated road network risk scores
- [x] Additional distance penalty is calculated when detours are necessary
- [x] Resetting the simulation restores routes to baseline
- [x] SafeRoutePanel can be closed with the X button
- [x] No existing dashboard features are broken (map, alerts, trends, etc.)

## Data Notes

⚠️ **Prototype Routing**: Road network and travel estimates are demo data.

- Road coordinates are approximate, not surveyed
- Risk values are illustrative
- Travel time is calculated at 40 km/h average (mountain road assumption)
- Distance is a linear approximation between nodes
- The system demonstrates the *mechanism* of risk-aware routing, not live road data

## Technical Validation

- Dijkstra's algorithm correctly computes shortest safe paths
- Risk-aware cost function prevents unsafe routes from being selected
- Edge risk escalation cascades from zone risk to road network
- Route recalculation triggers on simulation changes
- Map rendering does not interfere with existing layers (zones, infrastructure, etc.)
- TypeScript types are consistent across utilities, components, and data

## Troubleshooting

**"Safe Route" button doesn't appear:**
- Ensure you have selected a High or Critical risk zone
- Only zones with risk level ≥ "High" show the button

**Route doesn't appear on map:**
- Ensure the map has fully loaded (wait for "Loading map…" to finish)
- Check that destination is set in the dropdown
- Try zooming out or panning to see if markers are off-screen

**SafeRoutePanel shows same distance after risk escalation:**
- This is correct if the alternative route is not significantly longer
- High-risk routes must exceed a certain penalty before a detour is justified
- Check that the simulation actually escalated (look for alert badge)

**Performance is slow:**
- Dijkstra's algorithm can be compute-intensive for large networks
- Current prototype has ~18 nodes and ~28 edges (manageable)
- Production systems would cache routes and use incremental updates

## Feedback Points for SIH Judges

1. **Cause-and-Effect Chain**: The feature clearly demonstrates:
   - Environmental conditions (rainfall) → Risk escalation → Road impact → Route adaptation
   - This is the primary design goal for the demonstration

2. **Real Utility**: In a disaster context, this system:
   - Automatically identifies when primary evacuation routes become unsafe
   - Calculates emergency alternatives without manual intervention
   - Updates continuously as environmental sensors feed new data

3. **Integrated Architecture**: The system integrates cleanly with existing PahariRakshak:
   - Reuses risk zones and infrastructure data
   - Plugs into the Live Risk Simulation without replacing it
   - Visualizes on the existing Leaflet map
   - Follows established UI patterns and styling

4. **Extensibility**: Future enhancements:
   - Connect to real road network databases (OSM, HERE, Mapbox)
   - Integrate actual travel-time APIs for live ETAs
   - Add multi-destination optimization (serve multiple shelters from one supply point)
   - Include capacity constraints (shelter beds, ambulance availability)

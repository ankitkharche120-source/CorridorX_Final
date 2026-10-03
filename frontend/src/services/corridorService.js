const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export const corridorService = {
  async computeRoute(origin, destination, alternatives = true) {
    if (!origin || !destination) throw new Error('Origin and destination are required');
    const response = await fetch(`${BACKEND_URL}/api/routes/emergency-route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin, destination, alternatives })
    });
    if (!response.ok) throw new Error(`Route calculation failed: HTTP ${response.status}`);
    return await response.json();
  },

  generateCorridorNodesFromRoute(waypoints, hospitalName = 'Hospital Trauma Bay') {
    if (!waypoints || waypoints.length < 2) return [];

    const total = waypoints.length;
    const step = Math.max(1, Math.floor(total / 4));

    return [
      {
        id: 'NODE-01',
        sequence: 1,
        name: 'Corridor Entry Pre-emption Point',
        type: 'PRIMARY_FEEDER_JUNCTION',
        location: waypoints[Math.min(step, total - 1)],
        status: 'ACTIVE',
        traffic_density: 'HEAVY (Congestion Clearing)',
        large_board_id: 'BOARD-L-01',
        small_board_id: 'BOARD-S-01'
      },
      {
        id: 'NODE-02',
        sequence: 2,
        name: 'Arterial Corridor Intersection',
        type: 'MAIN_EXPRESSWAY_CROSSING',
        location: waypoints[Math.min(step * 2, total - 1)],
        status: 'PREPARING',
        traffic_density: 'CRITICAL (Pre-empting Green Wave)',
        large_board_id: 'BOARD-L-02',
        small_board_id: 'BOARD-S-02'
      },
      {
        id: 'NODE-03',
        sequence: 3,
        name: 'Hospital Approaching Intersection',
        type: 'TRAUMA_ROUTE_CROSSING',
        location: waypoints[Math.min(step * 3, total - 1)],
        status: 'STANDBY',
        traffic_density: 'MODERATE (Lane Clearing Sync)',
        large_board_id: 'BOARD-L-03',
        small_board_id: 'BOARD-S-03'
      },
      {
        id: 'NODE-04',
        sequence: 4,
        name: `${hospitalName} Emergency Gate`,
        type: 'HOSPITAL_ARRIVAL_BAY',
        location: waypoints[total - 1],
        status: 'STANDBY',
        traffic_density: 'PRIORITY_CLEAR (Ambulance Bay Open)',
        large_board_id: 'BOARD-L-04',
        small_board_id: 'BOARD-S-04'
      }
    ];
  }
};

export default corridorService;

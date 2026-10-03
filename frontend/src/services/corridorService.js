/**
 * Corridor Service & Adaptive Junction Algorithm
 * Adapted from Smart-EVP Adaptive Junction Preemption & Telemetry concepts:
 * - GPS vehicle telemetry: lat, lng, speed, heading
 * - Route geometry & road intersection points
 * - Distance, ETA & approach angle relative to junction
 * - Configurable simulation thresholds: UPCOMING -> PREPARING -> ACTIVE -> PASSED -> NORMALIZED
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export const CORRIDOR_CONFIG = {
  preparingDistance: 500, // meters
  activeDistance: 200,    // meters
  passedDistance: 50,     // meters
  preparingETA: 30,       // seconds
  routeDeviationThreshold: 120 // meters from polyline
};

/**
 * Calculate Great-Circle Distance in meters using Haversine formula
 */
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate forward azimuth / bearing in degrees (0..360)
 */
export function calculateBearing(lat1, lon1, lat2, lon2) {
  const y = Math.sin((lon2 - lon1) * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180));
  const x =
    Math.cos(lat1 * (Math.PI / 180)) * Math.sin(lat2 * (Math.PI / 180)) -
    Math.sin(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.cos((lon2 - lon1) * (Math.PI / 180));
  const θ = Math.atan2(y, x);
  return (θ * 180 / Math.PI + 360) % 360;
}

/**
 * Identify logical road junctions from route geometry.
 * Detects significant road turns / direction changes along the polyline,
 * ensuring junctions are logically anchored on roads and spaced out sensibly.
 */
export function generateJunctionsFromRoute(waypoints, targetName = 'Target Destination', stagePrefix = 1) {
  if (!waypoints || waypoints.length < 2) return [];

  const totalPoints = waypoints.length;
  const candidateIndices = [];

  // Look for curvature / heading changes > 22 degrees or spaced segments
  let prevBearing = calculateBearing(waypoints[0].lat, waypoints[0].lng, waypoints[1].lat, waypoints[1].lng);

  for (let i = 1; i < totalPoints - 1; i++) {
    const bearing = calculateBearing(waypoints[i].lat, waypoints[i].lng, waypoints[i + 1].lat, waypoints[i + 1].lng);
    const angleDiff = Math.abs(bearing - prevBearing);
    const normalizedAngle = angleDiff > 180 ? 360 - angleDiff : angleDiff;

    if (normalizedAngle >= 22) {
      candidateIndices.push(i);
      prevBearing = bearing;
    }
  }

  // Pick 4 well-spaced junctions along the actual route
  const targetCount = 4;
  let selectedIndices = [];

  if (candidateIndices.length >= targetCount) {
    const stride = Math.floor(candidateIndices.length / targetCount);
    for (let k = 0; k < targetCount; k++) {
      selectedIndices.push(candidateIndices[k * stride]);
    }
  } else {
    // If route is straight, distribute points along actual waypoints
    const step = Math.max(1, Math.floor(totalPoints / (targetCount + 1)));
    for (let k = 1; k <= targetCount; k++) {
      selectedIndices.push(Math.min(k * step, totalPoints - 1));
    }
  }

  // Ensure unique, strictly sorted indices
  selectedIndices = [...new Set(selectedIndices)].sort((a, b) => a - b);
  // Ensure the final junction is near or at the destination approach
  if (selectedIndices[selectedIndices.length - 1] < totalPoints - 1) {
    selectedIndices[selectedIndices.length - 1] = totalPoints - 1;
  }

  const junctionNames = stagePrefix === 1 ? [
    'Ambulance Station Feeder Junction',
    'Arterial Inflow Cross-Intersection',
    'Pickup Area Preemption Point',
    `Approach to ${targetName}`
  ] : [
    'Patient Evacuation Feeder Junction',
    'Main Expressway Crossing',
    'Hospital Trauma Route Corridor',
    `${targetName} Emergency Bay Gate`
  ];

  const baseSequence = stagePrefix === 1 ? 0 : 4;

  return selectedIndices.map((wpIndex, idx) => {
    const wp = waypoints[wpIndex];
    const prevWp = waypoints[Math.max(0, wpIndex - 1)];
    const approachBearing = Math.round(calculateBearing(prevWp.lat, prevWp.lng, wp.lat, wp.lng));
    const seqNum = baseSequence + idx + 1;
    const formattedId = seqNum < 10 ? `J-0${seqNum}` : `J-${seqNum}`;

    return {
      id: formattedId,
      name: junctionNames[idx] || `Emergency Corridor Junction ${seqNum}`,
      sequence: seqNum,
      lat: wp.lat,
      lng: wp.lng,
      location: { lat: wp.lat, lng: wp.lng },
      routeIndex: wpIndex,
      approachBearing,
      status: 'UPCOMING',
      distanceFromAmbulance: null,
      etaSeconds: null,
      large_board_id: `BOARD-L-0${idx + 1}`,
      small_board_id: `BOARD-S-0${idx + 1}`,
      traffic_density: idx === 0 ? 'HEAVY (Preemption Inflow)' : (idx === 1 ? 'CRITICAL (Expressway Sync)' : 'PRIORITY CLEAR')
    };
  });
}

/**
 * Adaptive Junction Evaluation Algorithm (Smart-EVP Concept)
 * Evaluates junctions against live ambulance telemetry:
 * - position (lat, lng, routeIndex)
 * - speed (km/h)
 * - heading (degrees)
 */
export function evaluateJunctionStates(junctions, ambulanceTelemetry, routeWaypoints) {
  if (!junctions || junctions.length === 0) return [];
  const { lat, lng, speedKmh = 45, heading = 0, currentIndex = 0, isArrivedAtHospital = false } = ambulanceTelemetry;

  if (isArrivedAtHospital) {
    return junctions.map(j => ({
      ...j,
      status: 'NORMALIZED',
      distanceFromAmbulance: 0,
      etaSeconds: 0
    }));
  }

  const speedMs = Math.max(5, (speedKmh * 1000) / 3600); // meters per second

  // Evaluate each junction
  return junctions.map((j) => {
    const distanceMeters = Math.round(calculateHaversineDistance(lat, lng, j.lat, j.lng));
    const etaSec = Math.round(distanceMeters / speedMs);

    let status = 'UPCOMING';

    // Has ambulance passed this junction on route?
    if (currentIndex > j.routeIndex + 2) {
      status = 'NORMALIZED';
    } else if (currentIndex > j.routeIndex) {
      status = 'PASSED';
    } else if (
      distanceMeters <= CORRIDOR_CONFIG.activeDistance ||
      currentIndex === j.routeIndex ||
      (etaSec <= 15 && distanceMeters <= 350)
    ) {
      // Emergency green wave active right at the intersection
      status = 'ACTIVE';
    } else if (
      distanceMeters <= CORRIDOR_CONFIG.preparingDistance ||
      etaSec <= CORRIDOR_CONFIG.preparingETA ||
      (j.routeIndex - currentIndex) <= 4
    ) {
      // Early warning lights and lane clearing
      status = 'PREPARING';
    } else {
      status = 'UPCOMING';
    }

    return {
      ...j,
      status,
      distanceFromAmbulance: distanceMeters,
      etaSeconds: etaSec
    };
  });
}

/**
 * Route Deviation Detector (Smart-EVP Geofence Concept)
 * Checks perpendicular / minimum distance of ambulance to route polyline.
 */
export function checkRouteDeviation(ambulancePos, routeWaypoints, thresholdMeters = CORRIDOR_CONFIG.routeDeviationThreshold) {
  if (!routeWaypoints || routeWaypoints.length < 2) return { isDeviated: false, minDistanceMeters: 0 };

  let minDistance = Infinity;
  for (let i = 0; i < routeWaypoints.length; i++) {
    const d = calculateHaversineDistance(ambulancePos.lat, ambulancePos.lng, routeWaypoints[i].lat, routeWaypoints[i].lng);
    if (d < minDistance) {
      minDistance = d;
    }
  }

  const isDeviated = minDistance > thresholdMeters;
  return {
    isDeviated,
    minDistanceMeters: Math.round(minDistance),
    status: isDeviated ? 'ROUTE DEVIATION' : 'ON ROUTE'
  };
}

export const corridorService = {
  generateCorridorNodesFromRoute: generateJunctionsFromRoute,
  generateJunctionsFromRoute,
  evaluateJunctionStates,
  checkRouteDeviation,
  calculateHaversineDistance,
  calculateBearing,
  CORRIDOR_CONFIG
};

export default corridorService;

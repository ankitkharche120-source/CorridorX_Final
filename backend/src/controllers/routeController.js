const config = require('../config');

/**
 * Route Controller
 * Interfaces with Google Routes API and Google Roads API server-side
 * to keep API keys secure and resolve browser CORS limitations.
 */

// Helper Haversine calculation for offline fallback
const calculateHaversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Decodes Google Polyline format into [{ latitude, longitude }]
const decodePolyline = (str, precision = 5) => {
  if (!str) return [];
  let index = 0, lat = 0, lng = 0, coordinates = [];
  let factor = Math.pow(10, precision);

  while (index < str.length) {
    let byte = null, shift = 0, result = 0;
    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const latChange = ((result & 1) ? ~(result >> 1) : (result >> 1));

    shift = 0;
    result = 0;
    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const lngChange = ((result & 1) ? ~(result >> 1) : (result >> 1));

    lat += latChange;
    lng += lngChange;
    coordinates.push({ latitude: +(lat / factor).toFixed(6), longitude: +(lng / factor).toFixed(6) });
  }
  return coordinates;
};

exports.computeEmergencyRoute = async (req, res) => {
  try {
    const { origin, destination, intermediates = [], alternatives = true } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        message: 'Origin and destination coordinates are required.'
      });
    }

    const apiKey = process.env.GOOGLE_ROUTES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

    // Call official Google Routes API (v2:computeRoutes) if valid key configured
    if (apiKey && apiKey.trim().length > 10 && !apiKey.includes('YourGoogle')) {
      try {
        const bodyPayload = {
          origin: {
            location: {
              latLng: {
                latitude: origin.latitude,
                longitude: origin.longitude
              }
            }
          },
          destination: {
            location: {
              latLng: {
                latitude: destination.latitude,
                longitude: destination.longitude
              }
            }
          },
          travelMode: 'DRIVE',
          routingPreference: 'TRAFFIC_AWARE_OPTIMAL',
          computeAlternativeRoutes: Boolean(alternatives),
          routeModifiers: {
            avoidTolls: false,
            avoidHighways: false,
            avoidFerries: true
          },
          languageCode: 'en-US',
          units: 'METRIC'
        };

        if (intermediates.length > 0) {
          bodyPayload.intermediates = intermediates.map(pt => ({
            location: { latLng: { latitude: pt.latitude, longitude: pt.longitude } }
          }));
        }

        const gResponse = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs,routes.description'
          },
          body: JSON.stringify(bodyPayload)
        });

        if (gResponse.ok) {
          const gData = await gResponse.json();
          if (gData.routes && gData.routes.length > 0) {
            const formattedRoutes = gData.routes.map((r, idx) => {
              const durationSec = parseInt((r.duration || '300s').replace('s', ''), 10);
              const pathPoints = decodePolyline(r.polyline?.encodedPolyline);
              return {
                id: `ROUTE-${idx + 1}`,
                isPrimary: idx === 0,
                description: r.description || (idx === 0 ? 'Fastest Emergency Corridor (Traffic-Aware)' : `Alternative Route ${idx}`),
                distanceMeters: r.distanceMeters,
                distanceKm: +(r.distanceMeters / 1000).toFixed(1),
                durationSeconds: durationSec,
                etaMinutes: Math.max(1, Math.round(durationSec / 60)),
                encodedPolyline: r.polyline?.encodedPolyline || null,
                pathPoints
              };
            });

            return res.status(200).json({
              success: true,
              source: 'GOOGLE_ROUTES_API',
              route: formattedRoutes[0],
              alternatives: formattedRoutes.slice(1)
            });
          }
        } else {
          const errText = await gResponse.text();
          console.warn('[Google Routes API] Non-OK response:', errText);
        }
      } catch (gErr) {
        console.warn('[Google Routes API] Call failed, using mathematical fallback:', gErr.message);
      }
    }

    // High-accuracy urban mathematical fallback (Haversine with 1.28 urban road detour factor)
    const distanceMeters = Math.round(
      calculateHaversine(origin.latitude, origin.longitude, destination.latitude, destination.longitude) * 1.28
    );
    // Average urban green-wave emergency speed: 48 km/h (13.3 m/s)
    const durationSeconds = Math.max(30, Math.round(distanceMeters / 13.3));

    // Generate realistic interpolated waypoints for polyline rendering
    const pointsCount = 6;
    const pathPoints = [];
    for (let i = 0; i <= pointsCount; i++) {
      const fraction = i / pointsCount;
      // Slight urban curvature
      const jitterLat = Math.sin(fraction * Math.PI) * 0.0012;
      const jitterLng = Math.cos(fraction * Math.PI) * 0.0008;
      pathPoints.push({
        latitude: +(origin.latitude + (destination.latitude - origin.latitude) * fraction + jitterLat).toFixed(6),
        longitude: +(origin.longitude + (destination.longitude - origin.longitude) * fraction + jitterLng).toFixed(6)
      });
    }

    const primaryRoute = {
      id: 'ROUTE-PRIMARY',
      isPrimary: true,
      description: 'CorridorX Optimal Direct Emergency Path',
      distanceMeters,
      distanceKm: +(distanceMeters / 1000).toFixed(1),
      durationSeconds,
      etaMinutes: Math.max(1, Math.round(durationSeconds / 60)),
      encodedPolyline: null,
      pathPoints
    };

    return res.status(200).json({
      success: true,
      source: 'LOCAL_URBAN_ROUTING_ENGINE',
      route: primaryRoute,
      alternatives: []
    });
  } catch (err) {
    console.error('[Route Compute Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to compute emergency route.' });
  }
};

exports.snapToRoads = async (req, res) => {
  try {
    const { path: pathCoords, interpolate = true } = req.body;
    if (!pathCoords) {
      return res.status(400).json({ success: false, message: 'Path coordinates are required.' });
    }

    const apiKey = process.env.GOOGLE_ROADS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

    if (apiKey && apiKey.trim().length > 10 && !apiKey.includes('YourGoogle')) {
      try {
        const url = `https://roads.googleapis.com/v1/snapToRoads?path=${encodeURIComponent(pathCoords)}&interpolate=${interpolate}&key=${apiKey}`;
        const gResponse = await fetch(url);
        if (gResponse.ok) {
          const gData = await gResponse.json();
          return res.status(200).json({
            success: true,
            source: 'GOOGLE_ROADS_API',
            snappedPoints: gData.snappedPoints || []
          });
        }
      } catch (err) {
        console.warn('[Google Roads API] Call failed:', err.message);
      }
    }

    return res.status(200).json({
      success: true,
      source: 'FALLBACK_RAW',
      snappedPoints: []
    });
  } catch (err) {
    console.error('[Roads Snap Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to snap coordinates to roads.' });
  }
};

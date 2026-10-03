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

exports.computeEmergencyRoute = async (req, res) => {
  try {
    const { origin, destination, intermediates = [] } = req.body;

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
          computeAlternativeRoutes: false,
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
            'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs'
          },
          body: JSON.stringify(bodyPayload)
        });

        if (gResponse.ok) {
          const gData = await gResponse.json();
          if (gData.routes && gData.routes.length > 0) {
            const firstRoute = gData.routes[0];
            const durationSec = parseInt(firstRoute.duration.replace('s', ''), 10) || 300;

            return res.status(200).json({
              success: true,
              source: 'GOOGLE_ROUTES_API',
              route: {
                distanceMeters: firstRoute.distanceMeters,
                durationSeconds: durationSec,
                encodedPolyline: firstRoute.polyline?.encodedPolyline || null
              }
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

    return res.status(200).json({
      success: true,
      source: 'LOCAL_URBAN_ROUTING_ENGINE',
      route: {
        distanceMeters,
        durationSeconds,
        encodedPolyline: null
      }
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

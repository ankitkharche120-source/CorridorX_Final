/**
 * Geoapify Service
 * Handles map style configuration, location autocomplete/geocoding,
 * hospital places search, and driving route calculation.
 * Never hardcodes API keys; reads from VITE_GEOAPIFY_API_KEY.
 */

// In-memory cache for API quota efficiency
const autocompleteCache = new Map();
const placesCache = new Map();
const routesCache = new Map();

export const getGeoapifyApiKey = () => {
  return import.meta.env.VITE_GEOAPIFY_API_KEY || '';
};

export const hasGeoapifyKey = () => {
  const key = getGeoapifyApiKey();
  return Boolean(key && key.trim().length > 8 && !key.includes('YOUR_GEOAPIFY_KEY'));
};

/**
 * Returns a high-performance MapLibre GL style JSON URL
 * Prioritizes high geographic clarity, consumer-grade light navigation basemap.
 */
export const getMapLibreStyleUrl = () => {
  const apiKey = getGeoapifyApiKey();
  if (apiKey && apiKey.trim().length > 8 && !apiKey.includes('YOUR_GEOAPIFY_KEY')) {
    // Geoapify OSM-Bright style: vibrant road hierarchy, buildings, parks, water, readable typography
    return `https://maps.geoapify.com/v1/styles/osm-bright/style.json?apiKey=${apiKey}`;
  }
  // Standard vector high-contrast light navigation style (Carto Voyager)
  return 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';
};

export class GeoapifyError extends Error {
  constructor(type, message, originalError = null) {
    super(message);
    this.name = 'GeoapifyError';
    this.type = type; // 'LOCATION_UNAVAILABLE' | 'HOSPITAL_SEARCH_FAILED' | 'ROUTE_CALCULATION_FAILED'
    this.originalError = originalError;
  }
}

export const geoapifyService = {
  /**
   * Search locations across India using Geoapify Geocoding Autocomplete
   */
  async autocomplete(query) {
    if (!query || !query.trim()) return [];
    const q = query.trim();
    if (autocompleteCache.has(q.toLowerCase())) {
      return autocompleteCache.get(q.toLowerCase());
    }

    const apiKey = getGeoapifyApiKey();
    if (!hasGeoapifyKey()) {
      throw new GeoapifyError('LOCATION_UNAVAILABLE', 'Geoapify API key is missing or not configured in VITE_GEOAPIFY_API_KEY');
    }

    try {
      const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(q)}&filter=countrycode:in&format=json&limit=8&apiKey=${apiKey}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Autocomplete returned HTTP ${res.status}`);
      }
      const data = await res.json();
      const results = (data.results || []).map(item => ({
        name: item.formatted || item.address_line1 || q,
        address: item.formatted || `${item.city || item.county || ''}, ${item.state || ''}`,
        shortTitle: item.name || item.address_line1 || (item.formatted || '').split(',')[0],
        lat: item.lat,
        lng: item.lon,
        city: item.city || '',
        state: item.state || '',
        placeId: item.place_id || `geo-${item.lat}-${item.lon}`
      }));

      autocompleteCache.set(q.toLowerCase(), results);
      return results;
    } catch (err) {
      console.error('[Geoapify] Autocomplete error:', err);
      throw new GeoapifyError('LOCATION_UNAVAILABLE', 'Location search failed on Geoapify', err);
    }
  },

  /**
   * Reverse geocode device GPS coordinates
   */
  async reverseGeocode(lat, lng) {
    const apiKey = getGeoapifyApiKey();
    if (!hasGeoapifyKey()) {
      return {
        lat,
        lng,
        name: `Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        address: `Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        shortTitle: 'Current Location'
      };
    }

    try {
      const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&format=json&apiKey=${apiKey}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Reverse geocode HTTP ${res.status}`);
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const item = data.results[0];
        return {
          lat,
          lng,
          name: item.formatted,
          address: item.formatted,
          shortTitle: item.name || item.address_line1 || item.formatted.split(',')[0],
          city: item.city || '',
          state: item.state || ''
        };
      }
    } catch (err) {
      console.warn('[Geoapify] Reverse geocode failed, using coordinates:', err.message);
    }

    return {
      lat,
      lng,
      name: `Device Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      address: `Device Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      shortTitle: 'Device Location'
    };
  },

  /**
   * Search nearby hospitals around pickupLocation using Geoapify Places API
   */
  async searchNearbyHospitals(lat, lng, radiusMeters = 12000) {
    const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)}`;
    if (placesCache.has(cacheKey)) {
      return placesCache.get(cacheKey);
    }

    const apiKey = getGeoapifyApiKey();
    if (!hasGeoapifyKey()) {
      throw new GeoapifyError('HOSPITAL_SEARCH_FAILED', 'Geoapify API key is missing or not configured in VITE_GEOAPIFY_API_KEY');
    }

    try {
      const url = `https://api.geoapify.com/v2/places?categories=healthcare.hospital&filter=circle:${lng},${lat},${radiusMeters}&bias=proximity:${lng},${lat}&limit=12&apiKey=${apiKey}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Places API returned HTTP ${res.status}`);
      }
      const data = await res.json();
      const features = data.features || [];

      if (features.length === 0) {
        // Broaden search radius to 25km if no hospital found within 12km
        const broadUrl = `https://api.geoapify.com/v2/places?categories=healthcare.hospital,healthcare.clinic&filter=circle:${lng},${lat},25000&bias=proximity:${lng},${lat}&limit=12&apiKey=${apiKey}`;
        const broadRes = await fetch(broadUrl);
        if (broadRes.ok) {
          const broadData = await broadRes.json();
          features.push(...(broadData.features || []));
        }
      }

      if (features.length === 0) {
        throw new GeoapifyError('HOSPITAL_SEARCH_FAILED', 'No hospitals found near this location on Geoapify');
      }

      const hospitals = features.map((feat, index) => {
        const props = feat.properties || {};
        const coords = feat.geometry?.coordinates || [lng, lat];
        const hLng = coords[0];
        const hLat = coords[1];

        // Calculate distance from pickup
        const distMeters = props.distance || Math.round(calculateHaversineMeters(lat, lng, hLat, hLng));
        const distKm = +(distMeters / 1000).toFixed(1);
        // Urban green-wave corridor speed ~42 km/h
        const etaMin = Math.max(2, Math.round((distKm / 42) * 60));

        return {
          id: props.place_id || `hosp-geo-${index}-${hLat}-${hLng}`,
          name: props.name || props.address_line1 || `Hospital Center #${index + 1}`,
          address: props.formatted || props.street || `${props.city || 'Emergency Zone'}, India`,
          shortTitle: props.name || props.address_line1 || 'Emergency Trauma Center',
          latitude: hLat,
          longitude: hLng,
          lat: hLat,
          lng: hLng,
          distanceKm: distKm,
          etaMinutes: etaMin,
          emergencyContact: '+91 112',
          source: 'GEOAPIFY_PLACES_API'
        };
      }).sort((a, b) => a.distanceKm - b.distanceKm);

      placesCache.set(cacheKey, hospitals);
      return hospitals;
    } catch (err) {
      if (err instanceof GeoapifyError) throw err;
      console.error('[Geoapify] Hospital places search error:', err);
      throw new GeoapifyError('HOSPITAL_SEARCH_FAILED', 'Failed to retrieve nearby hospitals from Geoapify', err);
    }
  },

  /**
   * Compute driving route between two points using Geoapify Routing API
   */
  async computeRoute(origin, destination) {
    const oLat = origin.lat ?? origin.latitude;
    const oLng = origin.lng ?? origin.longitude;
    const dLat = destination.lat ?? destination.latitude;
    const dLng = destination.lng ?? destination.longitude;

    if (!oLat || !oLng || !dLat || !dLng) {
      throw new GeoapifyError('ROUTE_CALCULATION_FAILED', 'Valid origin and destination coordinates are required');
    }

    const cacheKey = `${oLat.toFixed(4)},${oLng.toFixed(4)}->${dLat.toFixed(4)},${dLng.toFixed(4)}`;
    if (routesCache.has(cacheKey)) {
      return routesCache.get(cacheKey);
    }

    const apiKey = getGeoapifyApiKey();
    const hasKey = hasGeoapifyKey();

    try {
      let distMeters = 0, distKm = 0, timeSeconds = 0, rawCoords = [];

      if (hasKey) {
        const url = `https://api.geoapify.com/v1/routing?waypoints=${oLat},${oLng}|${dLat},${dLng}&mode=drive&apiKey=${apiKey}`;
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`Routing API returned HTTP ${res.status}`);
        }
        const data = await res.json();
        const firstFeature = data.features?.[0];

        if (!firstFeature) {
          throw new GeoapifyError('ROUTE_CALCULATION_FAILED', 'No route returned by Geoapify Routing API');
        }

        const props = firstFeature.properties || {};
        const geom = firstFeature.geometry || {};
        distMeters = Math.round(props.distance || 0);
        distKm = +(distMeters / 1000).toFixed(1);
        timeSeconds = Math.round(props.time || 0);

        if (geom.type === 'LineString') {
          rawCoords = geom.coordinates || [];
        } else if (geom.type === 'MultiLineString') {
          rawCoords = (geom.coordinates || []).flat(1);
        }
      } else {
        // Fallback to OSRM Public API for accurate road routing
        let res;
        const url1 = `/proxy-osrm1/routed-car/route/v1/driving/${oLng},${oLat};${dLng},${dLat}?overview=full&geometries=geojson`;
        const url2 = `/proxy-osrm2/route/v1/driving/${oLng},${oLat};${dLng},${dLat}?overview=full&geometries=geojson`;
        
        try {
          res = await fetch(url1);
          if (!res.ok) throw new Error('Primary OSRM failed');
        } catch (e) {
          console.warn('Primary OSRM failed, trying secondary...', e);
          res = await fetch(url2);
        }

        if (!res.ok) {
          throw new Error(`OSRM Routing API returned HTTP ${res.status}`);
        }
        const data = await res.json();
        const route = data.routes?.[0];

        if (!route) {
          throw new GeoapifyError('ROUTE_CALCULATION_FAILED', 'No route returned by OSRM Routing API');
        }

        distMeters = Math.round(route.distance || 0);
        distKm = +(distMeters / 1000).toFixed(1);
        timeSeconds = Math.round(route.duration || 0);
        rawCoords = route.geometry?.coordinates || [];
      }

      let pathPoints = rawCoords.map(coord => ({
        lat: +(coord[1]).toFixed(6),
        lng: +(coord[0]).toFixed(6)
      }));

      // Fallback interpolation if geometry too sparse
      if (pathPoints.length < 2) {
        pathPoints = [
          { lat: oLat, lng: oLng },
          { lat: dLat, lng: dLng }
        ];
      }

      // CRITICAL REQUIREMENT: Guarantee origin and destination match bit-for-bit
      pathPoints[0] = { lat: oLat, lng: oLng };
      pathPoints[pathPoints.length - 1] = { lat: dLat, lng: dLng };

      const etaMin = Math.max(2, Math.round((distKm / 42) * 60));

      const routeResult = {
        success: true,
        source: 'GEOAPIFY_ROUTING_API',
        distanceKm: distKm,
        etaMinutes: etaMin,
        durationSeconds: Math.round(timeSeconds * 0.75),
        pathPoints,
        // GeoJSON Feature for MapLibre LineString layer
        geoJson: {
          type: 'Feature',
          properties: { distanceKm: distKm, etaMinutes: etaMin },
          geometry: {
            type: 'LineString',
            coordinates: pathPoints.map(p => [p.lng, p.lat])
          }
        }
      };

      routesCache.set(cacheKey, routeResult);
      return routeResult;
    } catch (err) {
      if (err instanceof GeoapifyError) throw err;
      console.error('[Geoapify] Routing calculation error:', err);
      throw new GeoapifyError('ROUTE_CALCULATION_FAILED', err.message || 'Failed to calculate driving route', err);
    }
  }
};

// Haversine distance calculator
function calculateHaversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default geoapifyService;

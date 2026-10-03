/**
 * Google Geocoding & Autocomplete Service
 * Handles reverse geocoding (coordinates -> address) and India-wide place search.
 * Includes server-side caching and mathematical fallback for offline/demo scenarios.
 */

// Simple in-memory cache to save Google API quota
const geocodeCache = new Map();
const autocompleteCache = new Map();

class GoogleGeocodingService {
  /**
   * Reverse geocode latitude and longitude to a human-readable address.
   * Prioritizes sublocality, locality (city), and state.
   */
  async reverseGeocode(latitude, longitude) {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;

    if (geocodeCache.has(cacheKey)) {
      return geocodeCache.get(cacheKey);
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY;

    if (apiKey && apiKey.trim().length > 10 && !apiKey.includes('YourGoogle')) {
      try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&region=in&language=en`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'OK' && data.results && data.results.length > 0) {
            const firstResult = data.results[0];
            const addressComponents = firstResult.address_components || [];
            
            // Extract locality, sublocality, state
            const sublocality = addressComponents.find(c => c.types.includes('sublocality') || c.types.includes('neighborhood'))?.long_name;
            const locality = addressComponents.find(c => c.types.includes('locality'))?.long_name;
            const state = addressComponents.find(c => c.types.includes('administrative_area_level_1'))?.long_name;
            const postalCode = addressComponents.find(c => c.types.includes('postal_code'))?.long_name;

            const shortTitle = sublocality ? `${sublocality}, ${locality || state}` : (locality ? `${locality}, ${state}` : firstResult.formatted_address.split(',')[0]);

            const geocoded = {
              latitude: lat,
              longitude: lng,
              formattedAddress: firstResult.formatted_address,
              shortTitle,
              placeId: firstResult.place_id,
              locality: locality || '',
              state: state || '',
              postalCode: postalCode || '',
              source: 'GOOGLE_GEOCODING_API'
            };

            geocodeCache.set(cacheKey, geocoded);
            return geocoded;
          }
        }
      } catch (err) {
        console.warn('[Geocoding API] Reverse geocode failed, using spatial approximation:', err.message);
      }
    }

    // High-accuracy live reverse geocoding via OpenStreetMap Nominatim
    try {
      const nomUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
      const nomRes = await fetch(nomUrl, {
        headers: { 'User-Agent': 'CorridorX-EMS-Emergency/1.0' }
      });
      if (nomRes.ok) {
        const nomData = await nomRes.json();
        if (nomData && nomData.display_name) {
          const addr = nomData.address || {};
          const locality = addr.city || addr.town || addr.village || addr.suburb || addr.county || 'India';
          const area = addr.amenity || addr.road || addr.suburb || addr.neighbourhood || locality;
          const state = addr.state || 'India';
          const shortTitle = `${area}, ${locality}`;

          const geocoded = {
            latitude: lat,
            longitude: lng,
            formattedAddress: nomData.display_name,
            shortTitle,
            placeId: `osm-${nomData.osm_type || 'node'}-${nomData.osm_id || Math.floor(Math.random() * 100000)}`,
            locality,
            state,
            postalCode: addr.postcode || '',
            source: 'LIVE_REVERSE_GEOCODE_NOMINATIM'
          };

          geocodeCache.set(cacheKey, geocoded);
          return geocoded;
        }
      }
    } catch (nomErr) {
      console.warn('[Nominatim Reverse Geocode] Request failed:', nomErr.message);
    }

    // High-accuracy fallback approximation based on known major Indian coordinates
    const fallbackAddress = this.approximateIndianAddress(lat, lng);
    const result = {
      latitude: lat,
      longitude: lng,
      formattedAddress: fallbackAddress.formattedAddress,
      shortTitle: fallbackAddress.shortTitle,
      placeId: `fallback-${lat.toFixed(4)}-${lng.toFixed(4)}`,
      locality: fallbackAddress.locality,
      state: fallbackAddress.state,
      source: 'LOCAL_REVERSE_GEOCODE'
    };

    geocodeCache.set(cacheKey, result);
    return result;
  }

  /**
   * India-wide place search / autocomplete using Google Places API (New) with live Nominatim fallback
   */
  async autocomplete(input, userLocation = null) {
    if (!input || input.trim().length < 2) return [];

    const cacheKey = `${input.trim().toLowerCase()}_${userLocation ? `${userLocation.lat},${userLocation.lng}` : 'all'}`;
    if (autocompleteCache.has(cacheKey)) {
      return autocompleteCache.get(cacheKey);
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

    if (apiKey && apiKey.trim().length > 10 && !apiKey.includes('YourGoogle')) {
      try {
        const bodyPayload = {
          input: input.trim(),
          includedRegionCodes: ['in'], // Focus on India
          languageCode: 'en'
        };

        if (userLocation && userLocation.lat && userLocation.lng) {
          bodyPayload.locationBias = {
            circle: {
              center: { latitude: parseFloat(userLocation.lat), longitude: parseFloat(userLocation.lng) },
              radius: 50000.0 // 50km bias around user position
            }
          };
        }

        const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey
          },
          body: JSON.stringify(bodyPayload)
        });

        if (res.ok) {
          const data = await res.json();
          if (data.suggestions && data.suggestions.length > 0) {
            const suggestions = data.suggestions
              .filter(s => s.placePrediction)
              .map(s => {
                const pred = s.placePrediction;
                return {
                  placeId: pred.placeId,
                  title: pred.structuredFormat?.mainText?.text || pred.text?.text,
                  mainText: pred.structuredFormat?.mainText?.text || pred.text?.text,
                  description: pred.structuredFormat?.secondaryText?.text || pred.text?.text,
                  secondaryText: pred.structuredFormat?.secondaryText?.text || '',
                  fullAddress: pred.text?.text || '',
                  formattedAddress: pred.text?.text || '',
                  source: 'GOOGLE_PLACES_AUTOCOMPLETE'
                };
              });

            autocompleteCache.set(cacheKey, suggestions);
            return suggestions;
          }
        }
      } catch (err) {
        console.warn('[Places Autocomplete API] Call failed, using city lookup fallback:', err.message);
      }
    }

    // Live search across India using OpenStreetMap Nominatim
    try {
      const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(input)}&countrycodes=in&limit=8&addressdetails=1`;
      const sRes = await fetch(searchUrl, {
        headers: { 'User-Agent': 'CorridorX-EMS-Emergency/1.0' }
      });
      if (sRes.ok) {
        const items = await sRes.json();
        if (Array.isArray(items) && items.length > 0) {
          const liveResults = items.map(item => {
            const addr = item.address || {};
            const city = addr.city || addr.town || addr.village || addr.county || '';
            const state = addr.state || '';
            const mainText = item.name || item.display_name.split(',')[0];
            const secondaryText = city && state ? `${city}, ${state}` : item.display_name.split(',').slice(1, 3).join(',').trim();

            return {
              placeId: `osm-${item.osm_type || 'node'}-${item.osm_id}`,
              title: mainText,
              mainText,
              description: item.display_name,
              secondaryText,
              fullAddress: item.display_name,
              formattedAddress: item.display_name,
              location: {
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon)
              },
              source: 'LIVE_OSM_SEARCH'
            };
          });

          autocompleteCache.set(cacheKey, liveResults);
          return liveResults;
        }
      }
    } catch (nomSearchErr) {
      console.warn('[Nominatim Search Error]', nomSearchErr.message);
    }

    // Fallback search across popular Indian hubs & landmarks
    const fallbackResults = this.searchFallbackIndianPlaces(input);
    autocompleteCache.set(cacheKey, fallbackResults);
    return fallbackResults;
  }

  /**
   * Fetch exact coordinates for a selected placeId
   */
  async getPlaceDetails(placeId) {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

    if (apiKey && apiKey.trim().length > 10 && !apiKey.includes('YourGoogle') && !placeId.startsWith('fallback-')) {
      try {
        const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}?fields=id,displayName,formattedAddress,location`, {
          headers: {
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'id,displayName,formattedAddress,location'
          }
        });

        if (res.ok) {
          const data = await res.json();
          return {
            placeId: data.id,
            name: data.displayName?.text || '',
            formattedAddress: data.formattedAddress || '',
            latitude: data.location?.latitude,
            longitude: data.location?.longitude,
            source: 'GOOGLE_PLACE_DETAILS'
          };
        }
      } catch (e) {
        console.warn('[Place Details API] Error:', e.message);
      }
    }

    if (placeId && placeId.startsWith('osm-')) {
      for (const list of autocompleteCache.values()) {
        const found = list.find(item => item.placeId === placeId);
        if (found && found.location) {
          return {
            placeId,
            name: found.title || found.mainText,
            formattedAddress: found.fullAddress || found.formattedAddress,
            latitude: found.location.lat,
            longitude: found.location.lng,
            source: 'LIVE_OSM_DETAILS'
          };
        }
      }
    }

    // Check fallback registry
    return this.getFallbackPlaceDetails(placeId);
  }

  approximateIndianAddress(lat, lng) {
    // City center distances
    const cities = [
      { name: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567, area: 'Shivajinagar' },
      { name: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lng: 72.8777, area: 'Bandra-Kurla Complex' },
      { name: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lng: 77.5946, area: 'MG Road' },
      { name: 'New Delhi', state: 'Delhi', lat: 28.6139, lng: 77.2090, area: 'Connaught Place' },
      { name: 'Nagpur', state: 'Maharashtra', lat: 21.1458, lng: 79.0882, area: 'Sitabuldi' },
      { name: 'Hyderabad', state: 'Telangana', lat: 17.3850, lng: 78.4867, area: 'Banjara Hills' },
      { name: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707, area: 'Anna Salai' },
      { name: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639, area: 'Park Street' },
      { name: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873, area: 'MI Road' },
      { name: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lng: 72.5714, area: 'Navrangpura' }
    ];

    let nearest = cities[0];
    let minDist = 9999999;

    cities.forEach(city => {
      const d = Math.sqrt(Math.pow(city.lat - lat, 2) + Math.pow(city.lng - lng, 2));
      if (d < minDist) {
        minDist = d;
        nearest = city;
      }
    });

    if (minDist < 0.6) {
      return {
        formattedAddress: `${nearest.area}, ${nearest.name}, ${nearest.state}, India`,
        shortTitle: `${nearest.area}, ${nearest.name}`,
        locality: nearest.name,
        state: nearest.state
      };
    }

    return {
      formattedAddress: `Sector Marker (${lat.toFixed(4)}, ${lng.toFixed(4)}), ${nearest.state}, India`,
      shortTitle: `Selected Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      locality: nearest.name,
      state: nearest.state
    };
  }

  searchFallbackIndianPlaces(query) {
    const queryLower = query.toLowerCase();
    const commonHubs = [
      { placeId: 'fallback-pune-fc', title: 'FC Road', description: 'Deccan Gymkhana, Pune, Maharashtra', lat: 18.5246, lng: 73.8415 },
      { placeId: 'fallback-pune-kp', title: 'Koregaon Park', description: 'Pune, Maharashtra', lat: 18.5362, lng: 73.8940 },
      { placeId: 'fallback-pune-kothrud', title: 'Kothrud Stand', description: 'Paud Road, Pune, Maharashtra', lat: 18.5074, lng: 73.8065 },
      { placeId: 'fallback-mumbai-andheri', title: 'Andheri West', description: 'Mumbai, Maharashtra', lat: 19.1197, lng: 72.8464 },
      { placeId: 'fallback-mumbai-bkc', title: 'Bandra Kurla Complex (BKC)', description: 'Bandra East, Mumbai, Maharashtra', lat: 19.0657, lng: 72.8687 },
      { placeId: 'fallback-mumbai-marine', title: 'Marine Drive', description: 'South Mumbai, Maharashtra', lat: 18.9432, lng: 72.8230 },
      { placeId: 'fallback-blr-koramangala', title: 'Koramangala 5th Block', description: 'Bengaluru, Karnataka', lat: 12.9352, lng: 77.6245 },
      { placeId: 'fallback-blr-indiranagar', title: 'Indiranagar 100ft Road', description: 'Bengaluru, Karnataka', lat: 12.9784, lng: 77.6408 },
      { placeId: 'fallback-del-cp', title: 'Connaught Place (CP)', description: 'New Delhi, Delhi', lat: 28.6315, lng: 77.2167 },
      { placeId: 'fallback-del-aiims', title: 'AIIMS Ansari Nagar', description: 'Aurobindo Marg, New Delhi', lat: 28.5672, lng: 77.2100 },
      { placeId: 'fallback-nagpur-rly', title: 'Nagpur Railway Station', description: 'Sitabuldi, Nagpur, Maharashtra', lat: 21.1524, lng: 79.0888 },
      { placeId: 'fallback-hyd-hitech', title: 'HITEC City', description: 'Madhapur, Hyderabad, Telangana', lat: 17.4474, lng: 78.3762 }
    ];

    return commonHubs
      .filter(h => h.title.toLowerCase().includes(queryLower) || h.description.toLowerCase().includes(queryLower))
      .map(h => ({
        placeId: h.placeId,
        title: h.title,
        description: h.description,
        fullAddress: `${h.title}, ${h.description}`,
        source: 'FALLBACK_INDIAN_DIRECTORY'
      }));
  }

  getFallbackPlaceDetails(placeId) {
    const list = [
      { placeId: 'fallback-pune-fc', name: 'FC Road', formattedAddress: 'FC Road, Deccan Gymkhana, Pune, Maharashtra', latitude: 18.5246, longitude: 73.8415 },
      { placeId: 'fallback-pune-kp', name: 'Koregaon Park', formattedAddress: 'Koregaon Park, Pune, Maharashtra', latitude: 18.5362, longitude: 73.8940 },
      { placeId: 'fallback-pune-kothrud', name: 'Kothrud Stand', formattedAddress: 'Paud Road, Kothrud, Pune, Maharashtra', latitude: 18.5074, longitude: 73.8065 },
      { placeId: 'fallback-mumbai-andheri', name: 'Andheri West', formattedAddress: 'Andheri West, Mumbai, Maharashtra', latitude: 19.1197, longitude: 72.8464 },
      { placeId: 'fallback-mumbai-bkc', name: 'Bandra Kurla Complex (BKC)', formattedAddress: 'BKC, Bandra East, Mumbai, Maharashtra', latitude: 19.0657, longitude: 72.8687 },
      { placeId: 'fallback-mumbai-marine', name: 'Marine Drive', formattedAddress: 'Marine Drive, Nariman Point, Mumbai, Maharashtra', latitude: 18.9432, longitude: 72.8230 },
      { placeId: 'fallback-blr-koramangala', name: 'Koramangala 5th Block', formattedAddress: 'Koramangala 5th Block, Bengaluru, Karnataka', latitude: 12.9352, longitude: 77.6245 },
      { placeId: 'fallback-blr-indiranagar', name: 'Indiranagar', formattedAddress: '100ft Road, Indiranagar, Bengaluru, Karnataka', latitude: 12.9784, longitude: 77.6408 },
      { placeId: 'fallback-del-cp', name: 'Connaught Place', formattedAddress: 'Connaught Place, New Delhi, Delhi', latitude: 28.6315, longitude: 77.2167 },
      { placeId: 'fallback-del-aiims', name: 'AIIMS New Delhi', formattedAddress: 'Sri Aurobindo Marg, Ansari Nagar, New Delhi', latitude: 28.5672, longitude: 77.2100 },
      { placeId: 'fallback-nagpur-rly', name: 'Nagpur Railway Station', formattedAddress: 'Station Road, Sitabuldi, Nagpur, Maharashtra', latitude: 21.1524, longitude: 79.0888 },
      { placeId: 'fallback-hyd-hitech', name: 'HITEC City', formattedAddress: 'HITEC City, Madhapur, Hyderabad, Telangana', latitude: 17.4474, longitude: 78.3762 }
    ];

    const match = list.find(l => l.placeId === placeId);
    if (match) {
      return { ...match, source: 'FALLBACK_DIRECTORY' };
    }

    return {
      placeId,
      name: 'Custom Emergency Pin',
      formattedAddress: 'Selected Map Location, India',
      latitude: 18.5204,
      longitude: 73.8567,
      source: 'DEFAULT'
    };
  }
}

module.exports = new GoogleGeocodingService();

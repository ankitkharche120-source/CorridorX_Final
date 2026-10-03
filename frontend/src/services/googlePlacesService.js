/**
 * Google Places API (New) Service
 * Searches for real medical facilities and hospitals near the patient.
 *
 * NOTE: Google Places provides geographical & contact details;
 * emergency bed availability and trauma capability are managed by CorridorX.
 */

import { hasValidGoogleMapsKey } from './googleMapsService';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export const googlePlacesService = {
  /**
   * Search nearby hospitals around coordinates using backend proxy
   * to avoid CORS restrictions and protect API quotas.
   *
   * @param {Object} coords - { lat: number, lng: number }
   * @param {number} radiusMeters - Search radius (default 5000m)
   * @returns {Promise<Array>} List of real hospitals
   */
  async searchNearbyHospitals(coords, radiusMeters = 5000) {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/hospitals/nearby-places?lat=${coords.lat}&lng=${coords.lng}&radius=${radiusMeters}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.places)) {
          return data.places;
        }
      }
    } catch (e) {
      console.warn('[Places API] Backend proxy request failed, trying client SDK or registered list...', e);
    }

    // Client-side fallback using Places API (New) if Google SDK loaded in window
    if (window.google && window.google.maps && window.google.maps.importLibrary && hasValidGoogleMapsKey()) {
      try {
        const { Place, SearchNearbyRankPreference } = await window.google.maps.importLibrary('places');
        const request = {
          fields: ['id', 'displayName', 'formattedAddress', 'location', 'nationalPhoneNumber'],
          locationRestriction: {
            center: coords,
            radius: radiusMeters
          },
          includedPrimaryTypes: ['hospital', 'emergency_room'],
          maxResultCount: 8,
          rankPreference: SearchNearbyRankPreference.POPULARITY
        };

        const { places } = await Place.searchNearby(request);
        return places.map(p => ({
          googlePlaceId: p.id,
          name: typeof p.displayName === 'function' ? p.displayName() : p.displayName,
          address: p.formattedAddress,
          latitude: p.location?.lat() || p.location?.lat,
          longitude: p.location?.lng() || p.location?.lng,
          phone: p.nationalPhoneNumber || '+91 20 Emergency Desk'
        }));
      } catch (err) {
        console.warn('[Places API New] Client SDK search failed:', err);
      }
    }

    return [];
  },

  /**
   * Text search for a hospital by query string
   */
  async searchHospitalsByQuery(query, userLocation = null) {
    if (!query || query.trim().length < 2) return [];

    try {
      const locationParam = userLocation ? `&lat=${userLocation.lat}&lng=${userLocation.lng}` : '';
      const response = await fetch(`${BACKEND_URL}/api/hospitals/search?q=${encodeURIComponent(query)}${locationParam}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.results) {
          return data.results;
        }
      }
    } catch (err) {
      console.warn('[Places API] Search by query failed:', err);
    }

    return [];
  }
};

export default googlePlacesService;

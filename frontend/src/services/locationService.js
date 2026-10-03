import { googleGeocodingService } from './googleGeocodingService';

export const locationService = {
  async reverseGeocode(lat, lng) {
    return googleGeocodingService.reverseGeocode(lat, lng);
  },

  async searchPlaces(input, userLoc = null) {
    return googleGeocodingService.autocomplete(input, userLoc);
  },

  async getPlaceDetails(placeId) {
    return googleGeocodingService.getPlaceDetails(placeId);
  },

  getCurrentBrowserPosition(options = { enableHighAccuracy: true, timeout: 15000, maximumAge: 3000 }) {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            heading: pos.coords.heading,
            speed: pos.coords.speed,
            timestamp: pos.timestamp
          });
        },
        (err) => reject(err),
        options
      );
    });
  }
};

export default locationService;

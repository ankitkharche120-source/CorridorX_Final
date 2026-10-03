/**
 * Google Maps Platform Core Service
 * Manages API keys, loader configurations, and custom dark/emergency map styling.
 */

// Internal usage attribution as required by Google Maps Platform guidelines
export const GMP_ATTRIBUTION_ID = 'gmp_git_agentskills_v1';

export const getGoogleMapsApiKey = () => {
  return import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
};

export const hasValidGoogleMapsKey = () => {
  const key = getGoogleMapsApiKey();
  return Boolean(key && key.trim().length > 10 && !key.includes('YourGoogleMapsApiKeyHere'));
};

/**
 * Tactical Dark Mode Styling for Google Maps
 * Optimizes road hierarchy, hides non-emergency clutter, and highlights arterial corridors.
 */
export const tacticalDarkMapStyles = [
  { elementType: "geometry", stylers: [{ color: "#0b0f19" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0b0f19" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#cbd5e1" }]
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#64748b" }]
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#0f172a" }]
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#1e293b" }]
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#0f172a" }]
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#cbd5e1" }]
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#334155" }]
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1e293b" }]
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#1e293b" }]
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#020617" }]
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#38bdf8" }]
  }
];

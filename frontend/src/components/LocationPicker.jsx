import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  Navigation, 
  Search, 
  Edit3, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  Crosshair, 
  X,
  Compass,
  ArrowRight
} from 'lucide-react';
import { useEmergency } from '../context/EmergencyContext';
import { MapContainer as LeafletMap, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';

// Leaflet map click and drag listener component
const MapInteractiveEvents = ({ onLocationSelected, position }) => {
  const map = useMap();

  useEffect(() => {
    if (position?.lat && position?.lng) {
      map.panTo([position.lat, position.lng], { animate: true });
    }
  }, [position, map]);

  useMapEvents({
    click(e) {
      onLocationSelected({
        lat: +e.latlng.lat.toFixed(6),
        lng: +e.latlng.lng.toFixed(6),
        source: 'MAP_PIN'
      });
    }
  });

  return null;
};

// Custom interactive draggable pin icon for Leaflet
const createDraggablePinIcon = () => {
  return L.divIcon({
    className: 'interactive-pickup-pin',
    html: `
      <div style="display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); cursor: grab;">
        <div style="position: absolute; width: 44px; height: 44px; border-radius: 9999px; background: rgba(220, 38, 38, 0.35); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: relative; width: 36px; height: 36px; border-radius: 9999px; background: #dc2626; border: 2.5px solid #ffffff; box-shadow: 0 4px 14px rgba(220, 38, 38, 0.8); display: flex; align-items: center; justify-content: center; color: white;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
        <div style="margin-top: 3px; background: #0f172a; color: #f87171; border: 1.5px solid #ef4444; padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 800; white-space: nowrap; box-shadow: 0 4px 10px rgba(0,0,0,0.8);">
          📍 DRAG OR CLICK MAP
        </div>
      </div>
    `,
    iconSize: [36, 46],
    iconAnchor: [18, 46]
  });
};

export const LocationPicker = ({
  value,
  onChange,
  onConfirm,
  label = "Where is the emergency?"
}) => {
  const { liveLocation } = useEmergency();

  // Active tab: 'GPS' | 'SEARCH' | 'MAP' | 'MANUAL'
  const [activeTab, setActiveTab] = useState('SEARCH');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // Manual input state
  const [manualAddress, setManualAddress] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Selected location details — Starts null unless passed, ensuring no hardcoded Karvenagar/Pune fallback
  const [selectedLocation, setSelectedLocation] = useState(value || null);

  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState(null);
  const [isEditing, setIsEditing] = useState(!value);

  const debounceTimerRef = useRef(null);

  // Sync internal state when external value changes
  useEffect(() => {
    if (value) {
      setSelectedLocation(value);
      setIsEditing(false);
    }
  }, [value]);

  // Reverse geocode a coordinate pair via backend service
  const fetchReverseGeocode = async (lat, lng, sourceLabel = 'REVERSE_GEOCODE') => {
    setIsReverseGeocoding(true);
    try {
      const res = await fetch(`http://localhost:5000/api/location/reverse-geocode?lat=${lat}&lng=${lng}`);
      const data = await res.json();
      if (data.success && data.location) {
        const updated = {
          latitude: lat,
          longitude: lng,
          formattedAddress: data.location.formattedAddress,
          shortTitle: data.location.shortTitle,
          placeId: data.location.placeId,
          source: sourceLabel
        };
        setSelectedLocation(updated);
        if (onChange) onChange(updated);
        return updated;
      }
    } catch (err) {
      console.warn('[LocationPicker] Reverse geocode failed:', err);
    } finally {
      setIsReverseGeocoding(false);
    }

    const fallbackLoc = {
      latitude: lat,
      longitude: lng,
      formattedAddress: `Emergency Pin at ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      shortTitle: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      source: sourceLabel
    };
    setSelectedLocation(fallbackLoc);
    if (onChange) onChange(fallbackLoc);
    return fallbackLoc;
  };

  // Method A: Use Live Browser GPS
  const handleUseCurrentLocation = async () => {
    setIsGpsLoading(true);
    setGpsError(null);

    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      setIsGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const result = await fetchReverseGeocode(latitude, longitude, 'DEVICE_GPS');
        if (result) {
          result.accuracy = accuracy;
          setSelectedLocation(result);
          if (onChange) onChange(result);
          if (onConfirm) onConfirm(result);
        }
        setIsGpsLoading(false);
        setIsEditing(false);
      },
      (err) => {
        setIsGpsLoading(false);
        if (err.code === 1) {
          setGpsError('Browser blocked location. Click the lock icon in the URL bar to allow GPS, or use "Simulate Any Location" below.');
        } else if (err.code === 2) {
          setGpsError('Device GPS signal unavailable. Use search or quick test cities below.');
        } else {
          setGpsError('GPS request timed out. Use search or quick test cities below.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Method A.2: Simulate Random GPS Location (Across Major Indian Metro Centers)
  const handleSimulateRandomGpsLocation = async () => {
    setIsGpsLoading(true);
    setGpsError(null);

    const randomHubs = [
      { name: 'Marine Drive, Mumbai', lat: 18.9438, lng: 72.8234 },
      { name: 'Connaught Place, New Delhi', lat: 28.6315, lng: 77.2167 },
      { name: 'Indiranagar 100ft Rd, Bengaluru', lat: 12.9784, lng: 77.6408 },
      { name: 'Hitec City, Hyderabad', lat: 17.4435, lng: 78.3772 },
      { name: 'FC Road, Shivajinagar, Pune', lat: 18.5284, lng: 73.8415 },
      { name: 'Park Street, Kolkata', lat: 22.5519, lng: 88.3524 },
      { name: 'Anna Nagar, Chennai', lat: 13.0850, lng: 80.2101 },
      { name: 'Dharampeth, Nagpur', lat: 21.1444, lng: 79.0658 },
      { name: 'Ellisbridge, Ahmedabad', lat: 23.0244, lng: 72.5683 }
    ];

    // Pick random and add small jitter (±300m)
    const base = randomHubs[Math.floor(Math.random() * randomHubs.length)];
    const lat = +(base.lat + (Math.random() - 0.5) * 0.008).toFixed(6);
    const lng = +(base.lng + (Math.random() - 0.5) * 0.008).toFixed(6);

    const result = await fetchReverseGeocode(lat, lng, 'SIMULATED_GPS');
    if (result) {
      result.accuracy = Math.floor(8 + Math.random() * 12);
      setSelectedLocation(result);
      if (onChange) onChange(result);
      if (onConfirm) onConfirm(result);
    }
    setIsGpsLoading(false);
    setIsEditing(false);
  };

  // Method B: Autocomplete Search with Debounce
  const handleSearchInputChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    setSearchError(null);

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    if (!val || val.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    debounceTimerRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const userLat = selectedLocation.latitude || 19.0760;
        const userLng = selectedLocation.longitude || 72.8777;
        const res = await fetch(`http://localhost:5000/api/location/autocomplete?input=${encodeURIComponent(val)}&lat=${userLat}&lng=${userLng}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.suggestions)) {
          setSuggestions(data.suggestions);
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        console.error('[LocationPicker] Autocomplete error:', err);
        setSearchError('Unable to connect to location search engine.');
      } finally {
        setIsSearching(false);
      }
    }, 280);
  };

  // Select suggestion from autocomplete
  const handleSelectSuggestion = async (sug) => {
    setSearchQuery('');
    setSuggestions([]);

    const displayTitle = sug.mainText || sug.title || sug.text || 'Selected Location';
    const displayAddress = sug.fullAddress || sug.formattedAddress || sug.description || displayTitle;

    if (sug.location && sug.location.lat && sug.location.lng) {
      const locObj = {
        latitude: sug.location.lat,
        longitude: sug.location.lng,
        formattedAddress: displayAddress,
        shortTitle: displayTitle,
        placeId: sug.placeId,
        source: 'GOOGLE_SEARCH'
      };
      setSelectedLocation(locObj);
      if (onChange) onChange(locObj);
      setIsEditing(false);
      return;
    }

    // If placeId needs full detail lookup
    if (sug.placeId) {
      setIsReverseGeocoding(true);
      try {
        const res = await fetch(`http://localhost:5000/api/location/place-details?placeId=${encodeURIComponent(sug.placeId)}`);
        const data = await res.json();
        if (data.success && data.place) {
          const locObj = {
            latitude: data.place.latitude,
            longitude: data.place.longitude,
            formattedAddress: data.place.formattedAddress,
            shortTitle: data.place.name,
            placeId: sug.placeId,
            source: 'GOOGLE_PLACE_DETAILS'
          };
          setSelectedLocation(locObj);
          if (onChange) onChange(locObj);
          setIsEditing(false);
          return;
        }
      } catch (err) {
        console.warn('Place details fetch failed:', err);
      } finally {
        setIsReverseGeocoding(false);
      }
    }

    // Fallback using suggestion text
    const fallback = {
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude,
      formattedAddress: sug.formattedAddress || sug.text,
      shortTitle: sug.mainText || sug.text,
      placeId: sug.placeId,
      source: 'GOOGLE_SEARCH'
    };
    setSelectedLocation(fallback);
    if (onChange) onChange(fallback);
    setIsEditing(false);
  };

  // Method C: Map Pin Click or Drag
  const handleMapPinMoved = (newCoords) => {
    fetchReverseGeocode(newCoords.lat, newCoords.lng, 'MAP_PIN');
  };

  // Marker drag end handler
  const markerEventHandlers = {
    dragend(e) {
      const marker = e.target;
      const position = marker.getLatLng();
      fetchReverseGeocode(+position.lat.toFixed(6), +position.lng.toFixed(6), 'MAP_PIN_DRAGGED');
    }
  };

  // Method D: Manual Address Entry
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualAddress.trim()) return;

    setIsGeocoding(true);
    try {
      const res = await fetch(`http://localhost:5000/api/location/autocomplete?input=${encodeURIComponent(manualAddress)}`);
      const data = await res.json();
      if (data.success && data.suggestions && data.suggestions.length > 0) {
        await handleSelectSuggestion(data.suggestions[0]);
      } else {
        // Fallback to manual entry with existing center
        const updated = {
          ...selectedLocation,
          formattedAddress: manualAddress,
          shortTitle: manualAddress.split(',')[0],
          source: 'MANUAL_ENTRY'
        };
        setSelectedLocation(updated);
        if (onChange) onChange(updated);
      }
    } catch (err) {
      console.warn('Manual geocode error:', err);
    } finally {
      setIsGeocoding(false);
      setIsEditing(false);
    }
  };

  return (
    <div className="w-full bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl transition-all">
      
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-red-600/20 text-red-500 border border-red-500/30 flex items-center justify-center">
            <MapPin className="w-4 h-4 animate-bounce" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white tracking-wide uppercase">
              {label}
            </h3>
            <p className="text-[11px] text-slate-400">
              India-wide emergency dispatch and traffic corridor targeting
            </p>
          </div>
        </div>

        {selectedLocation && !isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5 text-red-400" />
            <span>Change</span>
          </button>
        )}
      </div>

      {/* Selected Location Confirmation Banner (When not actively editing) */}
      {selectedLocation && !isEditing ? (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 relative overflow-hidden">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold font-mono uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Confirmed Pickup
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-800 text-[10px] font-mono">
                  {selectedLocation.source || 'VERIFIED'}
                </span>
                {selectedLocation.accuracy && (
                  <span className="text-[10px] font-mono text-blue-400">
                    ±{Math.round(selectedLocation.accuracy)}m
                  </span>
                )}
              </div>

              <h4 className="text-base font-extrabold text-white leading-snug">
                {selectedLocation.shortTitle || selectedLocation.formattedAddress}
              </h4>
              
              <p className="text-xs text-slate-400 line-clamp-2">
                {selectedLocation.formattedAddress}
              </p>

              <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono pt-1">
                <span>Lat: {selectedLocation.latitude.toFixed(5)}</span>
                <span>•</span>
                <span>Lng: {selectedLocation.longitude.toFixed(5)}</span>
              </div>
            </div>

            <div className="shrink-0 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition-colors"
              >
                Adjust Location
              </button>
            </div>
          </div>

          {/* Quick confirmation action */}
          {onConfirm && (
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Ready to find nearest ALS ambulances?
              </span>
              <button
                type="button"
                onClick={() => onConfirm(selectedLocation)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs shadow-lg shadow-red-600/30 transition-all hover:scale-105 active:scale-95"
              >
                <span>Confirm & Proceed</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Four Methods Selector */
        <div className="space-y-4">
          
          {/* Method Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800/80">
            
            {/* Tab A: Use Current Location */}
            <button
              type="button"
              onClick={() => { setActiveTab('GPS'); handleUseCurrentLocation(); }}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all ${
                activeTab === 'GPS'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Navigation className={`w-3.5 h-3.5 ${isGpsLoading ? 'animate-spin' : ''}`} />
              <span>Use GPS</span>
            </button>

            {/* Tab B: Search Location */}
            <button
              type="button"
              onClick={() => setActiveTab('SEARCH')}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all ${
                activeTab === 'SEARCH'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search India</span>
            </button>

            {/* Tab C: Pick on Map */}
            <button
              type="button"
              onClick={() => setActiveTab('MAP')}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all ${
                activeTab === 'MAP'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>Pick on Map</span>
            </button>

            {/* Tab D: Enter Address Manually */}
            <button
              type="button"
              onClick={() => setActiveTab('MANUAL')}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all ${
                activeTab === 'MANUAL'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Manual</span>
            </button>

          </div>

          {/* TAB CONTENT: Method A (GPS) */}
          {activeTab === 'GPS' && (
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                <Navigation className={`w-6 h-6 ${isGpsLoading ? 'animate-spin' : ''}`} />
              </div>

              <div>
                <h4 className="text-sm font-bold text-white">
                  {isGpsLoading ? 'Locking High-Accuracy GPS...' : 'Acquire Current Device Coordinates'}
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  CorridorX queries browser Geolocation (high-accuracy mode) to position emergency response vehicles.
                </p>
              </div>

              {gpsError && (
                <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-xs text-red-300 flex items-center justify-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{gpsError}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={isGpsLoading}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-lg shadow-blue-600/30 transition-colors flex items-center justify-center gap-2"
                >
                  <Navigation className={`w-3.5 h-3.5 ${isGpsLoading ? 'animate-spin' : ''}`} />
                  <span>{isGpsLoading ? 'Requesting Position...' : 'Acquire Real Browser GPS'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSimulateRandomGpsLocation}
                  disabled={isGpsLoading}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 transition-colors flex items-center justify-center gap-2"
                  title="Generate a random real Indian location with live reverse geocoding"
                >
                  <Crosshair className="w-3.5 h-3.5" />
                  <span>Simulate Random GPS (Test City)</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB CONTENT: Method B (Search Location in India) */}
          {activeTab === 'SEARCH' && (
            <div className="space-y-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  {isSearching ? (
                    <Loader2 className="w-4 h-4 text-red-400 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  placeholder="Search any place in India (e.g. Andheri Mumbai, Koramangala Bengaluru, AIIMS Delhi, Pune)..."
                  className="w-full pl-10 pr-10 py-3 bg-slate-950 border border-slate-800 focus:border-red-500 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(''); setSuggestions([]); }}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Suggestions Dropdown */}
              {suggestions.length > 0 && (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl divide-y divide-slate-800/80 max-h-60 overflow-y-auto">
                  {suggestions.map((sug, idx) => (
                    <div
                      key={sug.placeId || idx}
                      onClick={() => handleSelectSuggestion(sug)}
                      className="p-3 sm:p-3.5 hover:bg-slate-900/90 cursor-pointer transition-colors flex items-start gap-3"
                    >
                      <MapPin className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">
                          {sug.mainText || sug.title || sug.text}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {sug.secondaryText || sug.description || sug.fullAddress || sug.formattedAddress || 'India'}
                        </p>
                      </div>
                      <span className="text-[10px] text-slate-600 font-mono uppercase shrink-0">
                        SELECT
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Common City Quick Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase mr-1">Quick Cities:</span>
                {[
                  { name: 'Mumbai', query: 'Bandra West, Mumbai' },
                  { name: 'Delhi', query: 'Connaught Place, New Delhi' },
                  { name: 'Bengaluru', query: 'Koramangala, Bengaluru' },
                  { name: 'Pune', query: 'Deccan Gymkhana, Pune' },
                  { name: 'Hyderabad', query: 'Hitec City, Hyderabad' },
                  { name: 'Chennai', query: 'T. Nagar, Chennai' },
                  { name: 'Kolkata', query: 'Park Street, Kolkata' },
                  { name: 'Nagpur', query: 'Dharampeth, Nagpur' }
                ].map((city) => (
                  <button
                    key={city.name}
                    type="button"
                    onClick={() => {
                      setSearchQuery(city.query);
                      handleSearchInputChange({ target: { value: city.query } });
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-[11px] text-slate-300 border border-slate-800 hover:border-slate-700 transition-colors"
                  >
                    {city.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB CONTENT: Method C (Pick on Map & Drag Pin) */}
          {activeTab === 'MAP' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs px-1">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  <Crosshair className="w-3.5 h-3.5 text-red-400" />
                  <strong>Click anywhere on map</strong> or <strong>drag the red pin</strong>
                </span>
                <span className="text-emerald-400 font-mono text-[11px]">
                  {isReverseGeocoding ? 'Reverse-geocoding...' : 'Live GPS Targeting'}
                </span>
              </div>

              {/* Interactive Leaflet Map for Pin Placement */}
              <div className="w-full h-64 rounded-2xl overflow-hidden border border-slate-800 shadow-inner relative">
                {(() => {
                  const mapLat = selectedLocation?.latitude ?? (liveLocation.location?.lat ?? 20.5937);
                  const mapLng = selectedLocation?.longitude ?? (liveLocation.location?.lng ?? 78.9629);
                  const mapZoom = selectedLocation?.latitude ? 14 : (liveLocation.location ? 14 : 5);

                  return (
                    <LeafletMap
                      center={[mapLat, mapLng]}
                      zoom={mapZoom}
                      scrollWheelZoom={true}
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer
                        attribution='&copy; OpenStreetMap'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <MapInteractiveEvents
                        position={selectedLocation ? { lat: selectedLocation.latitude, lng: selectedLocation.longitude } : null}
                        onLocationSelected={handleMapPinMoved}
                      />
                      {selectedLocation && (
                        <Marker
                          position={[selectedLocation.latitude, selectedLocation.longitude]}
                          draggable={true}
                          eventHandlers={markerEventHandlers}
                          icon={createDraggablePinIcon()}
                        />
                      )}
                    </LeafletMap>
                  );
                })()}

                {/* Floating Map Instruction Card */}
                <div className="absolute bottom-2 left-2 right-2 z-[400] bg-slate-900/90 backdrop-blur-md border border-slate-700/80 p-2 rounded-xl text-center shadow-lg pointer-events-none">
                  <p className="text-[11px] text-slate-200 font-bold truncate">
                    {isReverseGeocoding ? (
                      <span className="text-amber-400 animate-pulse">Resolving Indian postal address...</span>
                    ) : (
                      selectedLocation?.formattedAddress || 'Click anywhere on map of India to set emergency pickup point'
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500 font-mono">
                  {selectedLocation ? `${selectedLocation.latitude.toFixed(5)}, ${selectedLocation.longitude.toFixed(5)}` : 'No point chosen yet'}
                </span>
                {selectedLocation && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md transition-colors"
                  >
                    Use This Map Point
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB CONTENT: Method D (Manual Address Entry) */}
          {activeTab === 'MANUAL' && (
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Enter Complete Postal Address / Landmark
                </label>
                <textarea
                  rows={2}
                  required
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                  placeholder="e.g. Flat 402, Sunshine Towers, S.V. Road, Near Shoppers Stop, Andheri West, Mumbai 400058"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-red-500 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isGeocoding || !manualAddress.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs shadow-md transition-colors"
                >
                  {isGeocoding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
                  <span>{isGeocoding ? 'Geocoding Address...' : 'Geocode & Set Location'}</span>
                </button>
              </div>
            </form>
          )}

        </div>
      )}

    </div>
  );
};

export default LocationPicker;

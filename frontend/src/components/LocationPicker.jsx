import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  MapPin, 
  Search, 
  Crosshair, 
  Loader2, 
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { geoapifyService, hasGeoapifyKey } from '../services/geoapifyService';

// Component to handle map clicks and marker updates
const LocationMarker = ({ position, setPosition, onCoordsChange }) => {
  const map = useMap();
  
  // Custom marker icon
  const markerIcon = useMemo(() => {
    return L.divIcon({
      html: `
        <div style="position: relative; width: 36px; height: 36px; background: #dc2626; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 4px 14px rgba(220, 38, 38, 0.8); display: flex; align-items: center; justify-content: center; cursor: grab; transform: translate(-18px, -18px);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
      `,
      className: '',
      iconSize: [0, 0]
    });
  }, []);

  const markerRef = useRef(null);

  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onCoordsChange(e.latlng.lat, e.latlng.lng);
    }
  });

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const latlng = marker.getLatLng();
          setPosition(latlng);
          onCoordsChange(latlng.lat, latlng.lng);
        }
      },
    }),
    [onCoordsChange, setPosition]
  );

  useEffect(() => {
    map.flyTo(position, 14, { duration: 1.5 });
  }, [position, map]);

  return position === null ? null : (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
      icon={markerIcon}
    />
  );
}

export const LocationPicker = ({
  initialLocation,
  value,
  onLocationSelected,
  onChange,
  label = "Select Pickup Point"
}) => {
  const [selectedLocation, setSelectedLocation] = useState(value || initialLocation || {
    lat: 18.5074,
    lng: 73.8065,
    formattedAddress: 'Karvenagar, Pune, Maharashtra, India',
    shortTitle: 'Karvenagar'
  });

  const [position, setPosition] = useState({
    lat: selectedLocation?.lat || selectedLocation?.latitude || 18.5074,
    lng: selectedLocation?.lng || selectedLocation?.longitude || 73.8065
  });

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [searchError, setSearchError] = useState(null);

  const debounceTimerRef = useRef(null);

  // Autocomplete debounced search
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);
      try {
        if (hasGeoapifyKey()) {
          const res = await geoapifyService.autocomplete(query);
          setSuggestions(res);
        } else {
          // Preset Indian cities fallback
          const presets = [
            { name: 'Karvenagar, Pune, Maharashtra', shortTitle: 'Karvenagar, Pune', lat: 18.5074, lng: 73.8065 },
            { name: 'Kothrud, Pune, Maharashtra', shortTitle: 'Kothrud, Pune', lat: 18.5015, lng: 73.8040 },
            { name: 'Shivajinagar, Pune, Maharashtra', shortTitle: 'Shivajinagar, Pune', lat: 18.5314, lng: 73.8446 },
            { name: 'Connaught Place, New Delhi', shortTitle: 'CP, New Delhi', lat: 28.6315, lng: 77.2167 },
            { name: 'Bandra, Mumbai, Maharashtra', shortTitle: 'Bandra, Mumbai', lat: 19.0544, lng: 72.8402 },
            { name: 'Indiranagar, Bengaluru, Karnataka', shortTitle: 'Indiranagar, Bengaluru', lat: 12.9784, lng: 77.6408 }
          ].filter(p => p.name.toLowerCase().includes(query.toLowerCase()));
          setSuggestions(presets);
        }
      } catch (err) {
        setSearchError('Location service unavailable');
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(debounceTimerRef.current);
  }, [query]);

  const selectPlace = (item) => {
    const newLoc = {
      lat: item.lat,
      lng: item.lng,
      latitude: item.lat,
      longitude: item.lng,
      formattedAddress: item.address || item.name,
      name: item.name,
      shortTitle: item.shortTitle || item.name.split(',')[0],
      source: 'GEOAPIFY_SEARCH'
    };
    setSelectedLocation(newLoc);
    setPosition({ lat: item.lat, lng: item.lng });
    setSuggestions([]);
    setQuery('');
    if (onLocationSelected) onLocationSelected(newLoc);
    if (onChange) onChange(newLoc);
  };

  const handleCoordsChange = async (lat, lng) => {
    setIsReverseGeocoding(true);
    try {
      const rev = await geoapifyService.reverseGeocode(lat, lng);
      const newLoc = {
        lat,
        lng,
        latitude: lat,
        longitude: lng,
        formattedAddress: rev.address,
        name: rev.name,
        shortTitle: rev.shortTitle,
        source: 'MAP_DRAG'
      };
      setSelectedLocation(newLoc);
      if (onLocationSelected) onLocationSelected(newLoc);
      if (onChange) onChange(newLoc);
    } catch (err) {
      console.warn('Reverse geocode error:', err);
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  const fetchIpLocation = async () => {
    try {
      const res = await fetch('https://ipapi.co/json/');
      if (!res.ok) throw new Error('IP Location failed');
      const data = await res.json();
      if (data.latitude && data.longitude) {
        const lat = +data.latitude.toFixed(6);
        const lng = +data.longitude.toFixed(6);
        setPosition({ lat, lng });
        handleCoordsChange(lat, lng);
      } else {
        alert('Could not determine location automatically. Please search manually.');
        setIsReverseGeocoding(false);
      }
    } catch (e) {
      alert('Location access denied and fallback failed. Please search manually.');
      setIsReverseGeocoding(false);
    }
  };

  const useCurrentGps = () => {
    setIsReverseGeocoding(true);
    if (!navigator.geolocation) {
      fetchIpLocation();
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = +pos.coords.latitude.toFixed(6);
        const lng = +pos.coords.longitude.toFixed(6);
        setPosition({ lat, lng });
        handleCoordsChange(lat, lng);
      },
      (err) => {
        console.warn('GPS denied or error:', err);
        fetchIpLocation();
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xl space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
          {label}
        </label>
        <button
          type="button"
          onClick={useCurrentGps}
          className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1.5"
        >
          <Crosshair className="w-3.5 h-3.5" />
          <span>Use Current GPS</span>
        </button>
      </div>

      {/* Autocomplete Search Input */}
      <div className="relative z-50">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-600 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search any location in India (e.g. Pune, Bandra, Delhi)..."
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-10 py-3 text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:border-red-500"
          />
          {isSearching && (
            <Loader2 className="w-4 h-4 text-red-400 animate-spin absolute right-3.5 top-3.5" />
          )}
        </div>

        {/* Suggestions Dropdown */}
        {suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-slate-50 border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-800/60 max-h-60 overflow-y-auto">
            {suggestions.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => selectPlace(item)}
                className="w-full text-left p-3 hover:bg-white flex items-start gap-2.5 transition-colors"
              >
                <MapPin className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-slate-900 line-clamp-1">{item.shortTitle || item.name}</div>
                  <div className="text-[11px] text-slate-600 line-clamp-1">{item.address || item.name}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Current Selection Pin Card */}
      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5 truncate">
          <MapPin className="w-4 h-4 text-red-500 shrink-0" />
          <span className="text-slate-700 truncate">
            {isReverseGeocoding ? (
              <span className="text-amber-400 animate-pulse">Resolving address...</span>
            ) : (
              selectedLocation?.formattedAddress || selectedLocation?.name || 'No location selected'
            )}
          </span>
        </div>
        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 shrink-0 ml-2">
          TARGET SET
        </span>
      </div>

      {/* Leaflet Interactive Map */}
      <div className="h-64 rounded-2xl overflow-hidden border border-slate-200 relative z-0">
        <MapContainer 
          center={position} 
          zoom={14} 
          className="w-full h-full"
          scrollWheelZoom={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
          />
          <LocationMarker 
            position={position} 
            setPosition={setPosition} 
            onCoordsChange={handleCoordsChange} 
          />
        </MapContainer>

        <div className="absolute bottom-2 left-2 right-2 bg-slate-50  border border-slate-200 px-3 py-1.5 rounded-xl text-center pointer-events-none z-[400]">
          <p className="text-[11px] text-slate-700 font-medium">
            💡 Click anywhere or drag the red marker to fine-tune pickup spot
          </p>
        </div>
      </div>
    </div>
  );
};

export default LocationPicker;



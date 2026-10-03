import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmergency } from '../context/EmergencyContext';
import { MapContainer } from '../components/MapContainer';
import { geoapifyService, hasGeoapifyKey } from '../services/geoapifyService';
import { 
  ShieldAlert, 
  MapPin, 
  Hospital, 
  Truck, 
  Search, 
  Navigation, 
  CheckCircle2, 
  ArrowRight, 
  Clock, 
  Gauge, 
  Crosshair,
  RotateCcw,
  AlertTriangle,
  Loader2
} from 'lucide-react';

export const CustomerDashboard = () => {
  const navigate = useNavigate();
  const { 
    userName, 
    pickup, 
    setCustomLocation,
    selectedHospital, 
    chooseHospital, 
    nearbyHospitals, 
    selectedAmbulance, 
    availableAmbulances = [],
    assignAmbulance,
    autoAssignNearestAmbulance,
    startPickupJourney,
    startEmergencyJourney, 
    tripStage,
    tripStatus,
    corridorStatus,
    distanceToPickup,
    etaToPickup,
    distanceToHospital,
    etaToHospital,
    distanceRemainingKm,
    etaMinutes,
    resetDemo,
    locationError,
    hospitalError,
    routeError,
    isSearchingHospitals,
    retryHospitalSearch,
    retryRouteCalculation
  } = useEmergency();

  // Search input & autocomplete state
  const [searchInput, setSearchInput] = useState('');
  const [searchFeedback, setSearchFeedback] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [isSearchingGps, setIsSearchingGps] = useState(false);
  const debounceRef = useRef(null);

  // Common Indian cities / landmarks for instant search & offline fallback
  const demoLocations = [
    { name: 'Karvenagar, Pune, Maharashtra', shortTitle: 'Karvenagar, Pune', lat: 18.5074, lng: 73.8065 },
    { name: 'Kothrud, Pune, Maharashtra', shortTitle: 'Kothrud, Pune', lat: 18.5015, lng: 73.8040 },
    { name: 'Shivajinagar, Pune, Maharashtra', shortTitle: 'Shivajinagar, Pune', lat: 18.5314, lng: 73.8446 },
    { name: 'Deccan Gymkhana, Pune, Maharashtra', shortTitle: 'Deccan, Pune', lat: 18.5175, lng: 73.8401 },
    { name: 'Hinjewadi Phase 1, Pune, Maharashtra', shortTitle: 'Hinjewadi, Pune', lat: 18.5913, lng: 73.7389 },
    { name: 'Bandra West, Mumbai, Maharashtra', shortTitle: 'Bandra, Mumbai', lat: 19.0544, lng: 72.8402 },
    { name: 'Connaught Place, New Delhi', shortTitle: 'CP, New Delhi', lat: 28.6315, lng: 77.2167 },
    { name: 'Indiranagar, Bengaluru, Karnataka', shortTitle: 'Indiranagar, Bengaluru', lat: 12.9784, lng: 77.6408 },
    { name: 'T Nagar, Chennai, Tamil Nadu', shortTitle: 'T Nagar, Chennai', lat: 13.0418, lng: 80.2341 },
    { name: 'Hitec City, Hyderabad, Telangana', shortTitle: 'Hitec City, Hyderabad', lat: 17.4435, lng: 78.3772 },
    { name: 'Park Street, Kolkata, West Bengal', shortTitle: 'Park Street, Kolkata', lat: 22.5516, lng: 88.3524 }
  ];

  // Debounced Autocomplete Query
  useEffect(() => {
    const q = searchInput.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setIsSearchingPlaces(true);
      try {
        if (hasGeoapifyKey()) {
          const results = await geoapifyService.autocomplete(q);
          setSuggestions(results);
        } else {
          const matches = demoLocations.filter(loc => 
            loc.name.toLowerCase().includes(q.toLowerCase()) || 
            loc.shortTitle.toLowerCase().includes(q.toLowerCase())
          );
          setSuggestions(matches);
        }
      } catch (err) {
        console.warn('Autocomplete fetch error:', err);
        const matches = demoLocations.filter(loc => 
          loc.name.toLowerCase().includes(q.toLowerCase())
        );
        setSuggestions(matches);
      } finally {
        setIsSearchingPlaces(false);
      }
    }, 320);

    return () => clearTimeout(debounceRef.current);
  }, [searchInput]);

  // Handle suggestion selection
  const handleSelectPlace = async (item) => {
    setSuggestions([]);
    setSearchInput('');
    setSearchFeedback(`Pickup set: ${item.shortTitle || item.name}`);

    await setCustomLocation({
      lat: item.lat,
      lng: item.lng,
      name: item.name,
      formattedAddress: item.address || item.name,
      shortTitle: item.shortTitle || item.name.split(',')[0],
      source: 'GEOAPIFY_SEARCH'
    });
  };

  // Handle search form submission
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    const query = searchInput.trim();
    if (!query) return;

    if (suggestions.length > 0) {
      handleSelectPlace(suggestions[0]);
      return;
    }

    // Direct search
    try {
      setIsSearchingPlaces(true);
      if (hasGeoapifyKey()) {
        const results = await geoapifyService.autocomplete(query);
        if (results && results.length > 0) {
          handleSelectPlace(results[0]);
          return;
        }
      }
      
      const match = demoLocations.find(l => l.name.toLowerCase().includes(query.toLowerCase()));
      if (match) {
        handleSelectPlace(match);
        return;
      }
      setSearchFeedback(`Location "${query}" not found. Try e.g. Karvenagar, Bandra, Connaught Place`);
    } catch (err) {
      setSearchFeedback(`Search error: ${err.message}`);
    } finally {
      setIsSearchingPlaces(false);
    }
  };

  // Handle GPS location: sets YOUR LOCATION = PICKUP POINT exactly
  const handleUseGps = async () => {
    setIsSearchingGps(true);
    setSearchFeedback('');
    if (!navigator.geolocation) {
      setSearchFeedback('Geolocation not supported by this browser.');
      setIsSearchingGps(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = +pos.coords.latitude.toFixed(6);
        const lng = +pos.coords.longitude.toFixed(6);
        let addr = `GPS Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

        try {
          const rev = await geoapifyService.reverseGeocode(lat, lng);
          if (rev && rev.address) {
            addr = rev.address;
          }
        } catch (_) {}

        await setCustomLocation({
          lat,
          lng,
          name: addr,
          formattedAddress: addr,
          shortTitle: addr.split(',')[0],
          source: 'DEVICE_GPS'
        });
        setSearchFeedback(`Pickup location updated to device GPS: ${addr}`);
        setIsSearchingGps(false);
      },
      (err) => {
        console.warn('GPS error:', err);
        setSearchFeedback('GPS permission denied or unavailable. Using default Karvenagar.');
        setIsSearchingGps(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Launch emergency dispatch (Stage 1: Ambulance to Pickup)
  const handleLaunchEmergency = () => {
    startPickupJourney();
    navigate('/customer/emergency');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      
      {/* Header Banner */}
      <div className="bg-white border-b border-slate-200 py-4 px-4 sm:px-6 lg:px-8 shadow-xl">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                Emergency Ambulance Dispatch
              </h1>
            </div>
            <p className="text-slate-600 text-xs mt-0.5">
              CorridorX Dynamic Emergency Mobility Platform • MapLibre & Geoapify
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-300 font-medium">
              Patient: <strong className="text-slate-900">{userName}</strong>
            </span>
            <button
              onClick={resetDemo}
              className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 flex items-center gap-1 font-mono text-[11px]"
              title="Reset Demo to Karvenagar Default"
            >
              <RotateCcw className="w-3 h-3 text-amber-400" />
              <span>RESET DEMO</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-5 space-y-4">

        {/* ERROR BANNERS (Section 22) */}
        {locationError && (
          <div className="bg-red-950/70 border border-red-500 rounded-2xl p-3.5 flex items-center justify-between text-xs shadow-lg">
            <div className="flex items-center gap-2.5 text-red-200">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span><strong>LOCATION SERVICE UNAVAILABLE:</strong> {locationError}</span>
            </div>
            <button
              onClick={() => handleSearch()}
              className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white font-mono font-bold text-[11px] rounded-lg transition-colors shrink-0 ml-2"
            >
              [ RETRY ]
            </button>
          </div>
        )}

        {hospitalError && (
          <div className="bg-red-950/70 border border-red-500 rounded-2xl p-3.5 flex items-center justify-between text-xs shadow-lg">
            <div className="flex items-center gap-2.5 text-red-200">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span><strong>HOSPITAL SEARCH FAILED:</strong> {hospitalError}</span>
            </div>
            <button
              onClick={retryHospitalSearch}
              className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white font-mono font-bold text-[11px] rounded-lg transition-colors shrink-0 ml-2"
            >
              [ RETRY ]
            </button>
          </div>
        )}

        {routeError && (
          <div className="bg-amber-950/70 border border-amber-500 rounded-2xl p-3.5 flex items-center justify-between text-xs shadow-lg">
            <div className="flex items-center gap-2.5 text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span><strong>ROUTE CALCULATION FAILED:</strong> {routeError}</span>
            </div>
            <button
              onClick={retryRouteCalculation}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-slate-900 font-mono font-bold text-[11px] rounded-lg transition-colors shrink-0 ml-2"
            >
              [ RETRY ]
            </button>
          </div>
        )}
        
        {/* Responsive Search Box & Use Current Location */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xl relative">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
            Search Pickup Location
          </label>
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-600 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Search any location in India (e.g. Karvenagar, Bandra, CP Delhi)..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-10 py-3 text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
              {isSearchingPlaces && (
                <Loader2 className="w-4 h-4 text-red-400 animate-spin absolute right-3.5 top-3.5" />
              )}

              {/* Autocomplete Dropdown */}
              {suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-50 border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-800/80 max-h-64 overflow-y-auto">
                  {suggestions.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectPlace(item)}
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
            
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="submit"
                className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs transition-colors"
              >
                Search
              </button>
              <button
                type="button"
                onClick={handleUseGps}
                disabled={isSearchingGps}
                className="px-4 py-3 rounded-2xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Crosshair className={`w-3.5 h-3.5 ${isSearchingGps ? 'animate-spin' : ''}`} />
                <span>Use Current Location</span>
              </button>
            </div>
          </form>

          {/* Current Pickup Display & Status */}
          <div className="mt-3 flex flex-wrap items-center justify-between text-xs gap-2">
            <div className="flex items-center gap-2 text-slate-700">
              <MapPin className="w-4 h-4 text-red-500 shrink-0" />
              <span>Current Pickup: <strong className="text-slate-900">{pickup.name}</strong></span>
            </div>
            {searchFeedback && (
              <span className="text-amber-400 font-mono text-[11px]">
                {searchFeedback}
              </span>
            )}
          </div>
        </div>

        {/* Active Journey Banner if en route */}
        {(tripStatus === 'EN_ROUTE_TO_PICKUP' || tripStatus === 'ARRIVED_AT_PICKUP' || tripStatus === 'PATIENT_ONBOARD' || tripStatus === 'EN_ROUTE_TO_HOSPITAL') && (
          <div className="bg-red-950/40 border border-red-500/80 rounded-3xl p-5 shadow-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {tripStatus === 'EN_ROUTE_TO_PICKUP' && `Ambulance ${selectedAmbulance?.id} En Route To Pickup`}
                  {tripStatus === 'ARRIVED_AT_PICKUP' && `Ambulance ${selectedAmbulance?.id} Reached Pickup!`}
                  {tripStatus === 'PATIENT_ONBOARD' && `Patient Onboard • Preparing Hospital Route`}
                  {tripStatus === 'EN_ROUTE_TO_HOSPITAL' && `Corridor Active • En Route To ${selectedHospital?.name}`}
                </h3>
                <p className="text-xs text-slate-700">
                  {tripStage === 'PICKUP_STAGE' 
                    ? `ETA to pickup: ~${etaToPickup} min (${distanceToPickup} km) • Corridor in standby`
                    : `ETA to hospital: ~${etaToHospital} min (${distanceToHospital} km) • Dynamic green wave active`}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/customer/emergency')}
              className="px-4 py-2 rounded-xl bg-white text-slate-950 font-bold text-xs shadow hover:bg-slate-100 shrink-0"
            >
              View Live Tracker
            </button>
          </div>
        )}

        {/* Main 2-Column Layout: Map (Left) & Hospital + Booking (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Map Column (7 of 12) */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-xl flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-red-500" />
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Emergency Corridor Map
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
                  CORRIDOR ROUTE READY
                </span>
              </div>

              <div className="h-[430px] rounded-2xl overflow-hidden border border-slate-200 relative">
                <MapContainer height="100%" interactive={true} />
              </div>

              {/* Consistent Route Summary */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-red-400" />
                  <span className="text-slate-600">{tripStage === 'PICKUP_STAGE' ? 'ETA to Pickup:' : 'ETA to Hospital:'}</span>
                  <strong className="text-slate-900">~{etaMinutes} min</strong>
                </div>
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-blue-400" />
                  <span className="text-slate-600">Distance:</span>
                  <strong className="text-slate-900">{distanceRemainingKm} km</strong>
                </div>
                <div className="text-slate-600 hidden sm:block truncate max-w-[200px]">
                  {tripStage === 'PICKUP_STAGE' ? `Pickup: ${pickup.name.split(',')[0]}` : `To: ${selectedHospital?.name}`}
                </div>
              </div>
            </div>
          </div>

          {/* Hospital Selection & Ambulance Booking Column (5 of 12) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xl flex flex-col gap-4">
              
              {/* Hospital Section Header */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <Hospital className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    Nearby Hospitals
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-600">
                  {nearbyHospitals.length} hospitals found nearby
                </span>
              </div>

              {/* Hospital Cards List */}
              <div className="space-y-2.5 max-h-[310px] overflow-y-auto pr-1">
                {isSearchingHospitals ? (
                  <div className="py-8 flex flex-col items-center justify-center gap-2 text-emerald-400">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-xs font-mono">Searching nearby hospitals on Geoapify...</span>
                  </div>
                ) : nearbyHospitals.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-600 space-y-2">
                    <p>No hospitals found within search radius.</p>
                    <button
                      onClick={retryHospitalSearch}
                      className="px-3 py-1 bg-red-600/30 hover:bg-red-600/50 text-red-300 border border-red-500/40 rounded-lg font-mono font-bold text-[11px]"
                    >
                      [ RETRY HOSPITAL SEARCH ]
                    </button>
                  </div>
                ) : (
                  nearbyHospitals.map((hosp) => {
                    const isSelected = selectedHospital?.id === hosp.id || selectedHospital?.name === hosp.name;
                    return (
                      <div
                        key={hosp.id}
                        onClick={() => chooseHospital(hosp)}
                        className={`cursor-pointer p-3.5 rounded-2xl border transition-all ${
                          isSelected
                            ? 'bg-emerald-950/40 border-emerald-500  '
                            : 'bg-slate-50 hover:bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                              {hosp.name}
                            </h4>
                            <p className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">
                              {hosp.address}
                            </p>
                          </div>
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] font-mono">
                          <span className="text-emerald-400 font-bold">
                            {hosp.distanceKm} km
                          </span>
                          <span className="text-slate-600">
                            ~{hosp.etaMinutes} min
                          </span>
                          <span className="text-slate-700 font-medium">
                            Emergency Services Available
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Available Ambulances Section (Sections 2, 4, 5 & 23) */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-red-500" />
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Available Ambulances
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={autoAssignNearestAmbulance}
                    className="px-2.5 py-1 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 font-bold text-[10px] transition-colors"
                  >
                    AUTO-ASSIGN NEAREST
                  </button>
                </div>
                <p className="text-[10px] text-slate-600">
                  Demo fleet units stationed near pickup location.
                </p>

                <div className="space-y-2">
                  {availableAmbulances.map(amb => {
                    const isSelected = selectedAmbulance?.id === amb.id;
                    return (
                      <div
                        key={amb.id}
                        onClick={() => assignAmbulance(amb)}
                        className={`cursor-pointer p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-white border-red-500 shadow-md  '
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-black text-slate-900">{amb.id}</span>
                            <span className="text-[11px] font-bold text-slate-800">{amb.type || amb.name}</span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5">
                            {amb.distanceKm} km away • ~{amb.etaMinutes} min to pickup
                          </p>
                          <span className={`inline-block mt-1 text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                            isSelected
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {isSelected ? 'ASSIGNED' : 'AVAILABLE'}
                          </span>
                        </div>

                        <div>
                          {isSelected ? (
                            <span className="px-3 py-1.5 rounded-lg bg-red-600 text-white font-extrabold text-[11px] flex items-center gap-1 shadow">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>SELECTED</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); assignAmbulance(amb); }}
                              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 hover:text-slate-900 font-bold text-[11px] border border-slate-300 transition-colors"
                            >
                              SELECT
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dispatch Action Button: Stage 1 Start */}
              <button
                onClick={handleLaunchEmergency}
                className="w-full py-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <ShieldAlert className="w-5 h-5 animate-pulse" />
                <span>DISPATCH {selectedAmbulance?.id || 'AMBULANCE'} TO PICKUP</span>
                <ArrowRight className="w-4 h-4" />
              </button>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default CustomerDashboard;



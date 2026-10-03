import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmergency } from '../context/EmergencyContext';
import { MapContainer } from '../components/MapContainer';
import { locationService } from '../services/locationService';
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
  RotateCcw
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
    startEmergencyJourney, 
    tripStatus,
    distanceRemainingKm,
    etaMinutes,
    resetDemo
  } = useEmergency();

  // Search input state
  const [searchInput, setSearchInput] = useState('');
  const [searchFeedback, setSearchFeedback] = useState('');
  const [isSearchingGps, setIsSearchingGps] = useState(false);

  // Handle location search: Simple, robust, never breaks
  const handleSearch = (e) => {
    if (e) e.preventDefault();
    const query = searchInput.trim().toLowerCase();
    
    if (!query) return;

    // Supported key cities & Pune areas for the demo
    const demoLocations = [
      { key: 'karvenagar', name: 'Karvenagar, Pune', lat: 18.5074, lng: 73.8065 },
      { key: 'kothrud', name: 'Kothrud Stand, Paud Road, Pune', lat: 18.5015, lng: 73.8040 },
      { key: 'nal stop', name: 'Nal Stop Flyover, Karve Road, Pune', lat: 18.5088, lng: 73.8208 },
      { key: 'shivajinagar', name: 'Shivajinagar, Pune', lat: 18.5314, lng: 73.8446 },
      { key: 'deccan', name: 'Deccan Gymkhana, Pune', lat: 18.5175, lng: 73.8401 },
      { key: 'hinjewadi', name: 'Hinjewadi Phase 1, Pune', lat: 18.5913, lng: 73.7389 },
      { key: 'mumbai', name: 'Bandra, Mumbai', lat: 19.0544, lng: 72.8402 },
      { key: 'delhi', name: 'Connaught Place, New Delhi', lat: 28.6315, lng: 77.2167 },
      { key: 'bengaluru', name: 'Indiranagar, Bengaluru', lat: 12.9784, lng: 77.6408 },
      { key: 'bangalore', name: 'Indiranagar, Bengaluru', lat: 12.9784, lng: 77.6408 },
      { key: 'pune', name: 'Karvenagar, Pune', lat: 18.5074, lng: 73.8065 }
    ];

    const match = demoLocations.find(loc => query.includes(loc.key));

    if (match) {
      setCustomLocation({
        lat: match.lat,
        lng: match.lng,
        name: match.name,
        formattedAddress: match.name,
        shortTitle: match.name.split(',')[0],
        source: 'SEARCH'
      });
      setSearchFeedback(`Location set to ${match.name}`);
    } else {
      setSearchFeedback('Location search unavailable in demo mode');
    }
  };

  // Handle GPS location
  const handleUseGps = async () => {
    setIsSearchingGps(true);
    try {
      const pos = await locationService.getCurrentBrowserPosition();
      await setCustomLocation({
        lat: pos.latitude,
        lng: pos.longitude,
        name: `Current Location (${pos.latitude.toFixed(4)}, ${pos.longitude.toFixed(4)})`,
        formattedAddress: `Live Location`,
        source: 'BROWSER_GPS'
      });
      setSearchFeedback('Location updated using device GPS');
    } catch (err) {
      setSearchFeedback('LOCATION ACCESS DENIED. Use search instead.');
    } finally {
      setIsSearchingGps(false);
    }
  };

  // Launch emergency & proceed to live tracking
  const handleLaunchEmergency = () => {
    startEmergencyJourney();
    navigate('/customer/emergency');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-16">
      
      {/* Header Banner */}
      <div className="bg-slate-900 border-b border-slate-800 py-4 px-4 sm:px-6 lg:px-8 shadow-xl">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <h1 className="text-xl sm:text-2xl font-black text-white">
                Emergency Ambulance Dispatch
              </h1>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">
              CorridorX Dynamic Emergency Mobility Platform
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-medium">
              Patient: <strong className="text-white">{userName}</strong>
            </span>
            <button
              onClick={resetDemo}
              className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1 font-mono text-[11px]"
              title="Reset Demo to Karvenagar Default"
            >
              <RotateCcw className="w-3 h-3 text-amber-400" />
              <span>RESET DEMO</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-5 space-y-5">
        
        {/* Simple Search Box & Use Current Location */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Search Pickup Location
          </label>
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Search pickup location (e.g. Karvenagar, Kothrud, Deccan)..."
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  if (searchFeedback) setSearchFeedback('');
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="submit"
                className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
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
            <div className="flex items-center gap-2 text-slate-300">
              <MapPin className="w-4 h-4 text-red-500 shrink-0" />
              <span>Current Pickup: <strong className="text-white">{pickup.name}</strong></span>
            </div>
            {searchFeedback && (
              <span className="text-amber-400 font-mono text-[11px]">
                {searchFeedback}
              </span>
            )}
          </div>
        </div>

        {/* Active Journey Card if already en route */}
        {tripStatus === 'EN_ROUTE' && (
          <div className="bg-red-950/40 border border-red-500/80 rounded-3xl p-5 shadow-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
              <div>
                <h3 className="text-base font-extrabold text-white">Ambulance En Route</h3>
                <p className="text-xs text-slate-300">Green wave dynamic corridor is currently clearing intersections.</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/customer/emergency')}
              className="px-4 py-2 rounded-xl bg-white text-slate-950 font-bold text-xs shadow hover:bg-slate-100"
            >
              View Live Tracker
            </button>
          </div>
        )}

        {/* Main 2-Column Layout: Map (Left) & Hospital + Booking (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Map Column (7 of 12) */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-red-500" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Emergency Corridor Map
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
                  CORRIDOR ROUTE READY
                </span>
              </div>

              <div className="h-[430px] rounded-2xl overflow-hidden border border-slate-800 relative">
                <MapContainer height="100%" interactive={true} />
              </div>

              {/* Consistent Route Summary */}
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-red-400" />
                  <span className="text-slate-400">ETA:</span>
                  <strong className="text-white">~{etaMinutes} min</strong>
                </div>
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-blue-400" />
                  <span className="text-slate-400">Distance:</span>
                  <strong className="text-white">{distanceRemainingKm} km</strong>
                </div>
                <div className="text-slate-400 hidden sm:block truncate max-w-[200px]">
                  To: {selectedHospital?.name}
                </div>
              </div>
            </div>
          </div>

          {/* Hospital Selection & Ambulance Booking Column (5 of 12) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col gap-4">
              
              {/* Hospital Section Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Hospital className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    Nearby Hospitals
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  {nearbyHospitals.length} hospitals found nearby
                </span>
              </div>

              {/* Hospital Cards List */}
              <div className="space-y-2.5 max-h-[310px] overflow-y-auto pr-1">
                {nearbyHospitals.map((hosp) => {
                  const isSelected = selectedHospital?.id === hosp.id || selectedHospital?.name === hosp.name;
                  return (
                    <div
                      key={hosp.id}
                      onClick={() => chooseHospital(hosp)}
                      className={`cursor-pointer p-3.5 rounded-2xl border transition-all ${
                        isSelected
                          ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-400'
                          : 'bg-slate-950/70 hover:bg-slate-950 border-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-bold text-white line-clamp-1">
                            {hosp.name}
                          </h4>
                          <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                            {hosp.address}
                          </p>
                        </div>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                        <span className="text-emerald-400 font-bold">
                          {hosp.distanceKm} km
                        </span>
                        <span className="text-slate-400">
                          ~{hosp.etaMinutes} min
                        </span>
                        <span className="text-slate-300 font-medium">
                          Emergency Services Available
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Assigned Demo Ambulance Card */}
              {selectedAmbulance && (
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-bold text-white">
                        {selectedAmbulance.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      {selectedAmbulance.id} • AVAILABLE
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Pilot: {selectedAmbulance.driverName} • Nearby Emergency Unit
                  </p>
                </div>
              )}

              {/* Dispatch Action Button */}
              <button
                onClick={handleLaunchEmergency}
                className="w-full py-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-red-600/30 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <ShieldAlert className="w-5 h-5 animate-pulse" />
                <span>BOOK AMBULANCE & ACTIVATE CORRIDOR</span>
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

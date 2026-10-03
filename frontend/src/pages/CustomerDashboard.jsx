import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmergency } from '../context/EmergencyContext';
import { LocationPicker } from '../components/LocationPicker';
import { MapContainer } from '../components/MapContainer';
import { hospitalService } from '../services/hospitalService';
import { 
  ShieldAlert, 
  MapPin, 
  User, 
  Phone, 
  Hospital, 
  Truck, 
  Search, 
  Navigation, 
  CheckCircle2, 
  ArrowRight, 
  Clock, 
  Gauge, 
  Radio, 
  Compass, 
  Crosshair, 
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

export const CustomerDashboard = () => {
  const navigate = useNavigate();
  const { 
    userName, 
    userPhone, 
    emergencyRequest, 
    setEmergencyRequest, 
    setCustomLocation,
    recenterToGps,
    liveLocation,
    selectedHospital,
    chooseHospital,
    nearbyHospitals,
    setNearbyHospitals,
    calculatedRoute,
    availableAmbulances,
    selectedAmbulance,
    chooseAmbulance,
    startEmergencyJourney,
    tripStatus
  } = useEmergency();

  // Demo Profile Inputs (Section 2: Clearly labeled DEMO PROFILE)
  const [profileName, setProfileName] = useState(userName || 'Rahul Sharma');
  const [profilePhone, setProfilePhone] = useState(userPhone || '9999999999');
  const [profileEmergencyType, setProfileEmergencyType] = useState(
    emergencyRequest.emergencyType || 'Chest Pain / Acute Cardiac Emergency'
  );

  // Hospital Search & Radius Controls (Section 10 & 39)
  const [radiusKm, setRadiusKm] = useState(10);
  const [hospitalSearchQuery, setHospitalSearchQuery] = useState('');
  const [isSearchingHospitals, setIsSearchingHospitals] = useState(false);
  const [hospitalSearchMessage, setHospitalSearchMessage] = useState('');

  // Location selector visibility toggle
  const [isChangingLocation, setIsChangingLocation] = useState(!emergencyRequest.pickupCoords);

  const hasSelectedLocation = Boolean(emergencyRequest.pickupCoords?.lat && emergencyRequest.pickupCoords?.lng);

  // Sync profile edits with emergencyRequest
  const handleProfileUpdate = (field, val) => {
    if (field === 'name') setProfileName(val);
    if (field === 'phone') setProfilePhone(val);
    if (field === 'type') setProfileEmergencyType(val);

    setEmergencyRequest(prev => ({
      ...prev,
      patientName: field === 'name' ? val : prev.patientName,
      contactNumber: field === 'phone' ? val : prev.contactNumber,
      emergencyType: field === 'type' ? val : prev.emergencyType
    }));
  };

  // Re-fetch hospitals when radiusKm changes for current location
  useEffect(() => {
    if (hasSelectedLocation) {
      const fetchHospitals = async () => {
        setIsSearchingHospitals(true);
        try {
          const res = await hospitalService.getNearbyHospitals(
            emergencyRequest.pickupCoords.lat,
            emergencyRequest.pickupCoords.lng,
            radiusKm
          );
          setNearbyHospitals(res.hospitals);
          setHospitalSearchMessage(res.message || '');
          if (res.hospitals.length > 0 && !selectedHospital) {
            chooseHospital(res.hospitals[0]);
          }
        } catch (err) {
          console.warn('[CustomerDashboard] Hospital fetch failed:', err);
        } finally {
          setIsSearchingHospitals(false);
        }
      };

      fetchHospitals();
    }
  }, [radiusKm, emergencyRequest.pickupCoords?.lat, emergencyRequest.pickupCoords?.lng]);

  // Handle manual hospital search by text (Section 13)
  const handleManualHospitalSearch = async (e) => {
    if (e) e.preventDefault();
    if (!hospitalSearchQuery.trim()) {
      if (hasSelectedLocation) {
        const res = await hospitalService.getNearbyHospitals(
          emergencyRequest.pickupCoords.lat,
          emergencyRequest.pickupCoords.lng,
          radiusKm
        );
        setNearbyHospitals(res.hospitals);
      }
      return;
    }

    setIsSearchingHospitals(true);
    try {
      const lat = emergencyRequest.pickupCoords?.lat || null;
      const lng = emergencyRequest.pickupCoords?.lng || null;
      const res = await hospitalService.searchHospitalsByQuery(hospitalSearchQuery, lat, lng);
      setNearbyHospitals(res.hospitals);
      if (res.hospitals.length === 0) {
        setHospitalSearchMessage(`No hospitals found matching "${hospitalSearchQuery}".`);
      } else {
        setHospitalSearchMessage('');
      }
    } catch (err) {
      console.warn('Manual hospital search failed:', err);
    } finally {
      setIsSearchingHospitals(false);
    }
  };

  // Location confirmed handler from LocationPicker
  const handleLocationConfirmed = (locationData) => {
    setCustomLocation({
      lat: locationData.latitude,
      lng: locationData.longitude,
      address: locationData.formattedAddress,
      name: locationData.shortTitle,
      source: locationData.source
    });
    setIsChangingLocation(false);
  };

  // Start Emergency Journey & navigate to live tracking
  const handleLaunchEmergency = () => {
    startEmergencyJourney();
    navigate('/customer/emergency');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-16">
      
      {/* Top Banner */}
      <div className="bg-slate-900 border-b border-slate-800 py-6 px-4 sm:px-6 lg:px-8 shadow-xl">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                Pan-India Emergency Response System Online
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
              CorridorX Emergency Dispatch
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
              Real Google Maps • Real Road Network • Real Nearby Hospitals • Location-Aware Demo Fleet
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
              MAP: LIVE
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold">
              HOSPITALS: LIVE
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30 font-bold">
              AMBULANCE: DEMO
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">

        {/* 1. DEMO PROFILE SECTION (Section 2 & 29) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Patient & Attendant Profile
                </h3>
                <p className="text-[11px] text-slate-400">
                  Simulated user credentials for trial testing
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
              DEMO PROFILE • NOT REAL PATIENT RECORDS
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Patient Name</label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => handleProfileUpdate('name', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Contact Phone</label>
              <input
                type="text"
                value={profilePhone}
                onChange={(e) => handleProfileUpdate('phone', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Emergency Condition</label>
              <select
                value={profileEmergencyType}
                onChange={(e) => handleProfileUpdate('type', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-red-500"
              >
                <option value="Chest Pain / Acute Cardiac Emergency">Chest Pain / Acute Cardiac Emergency</option>
                <option value="Road Accident / Polytrauma">Road Accident / Polytrauma</option>
                <option value="Stroke / Paralysis Acute Alert">Stroke / Paralysis Acute Alert</option>
                <option value="Severe Breathing Difficulty / Asthma">Severe Breathing Difficulty / Asthma</option>
                <option value="Pediatric Emergency">Pediatric Emergency</option>
              </select>
            </div>
          </div>
        </div>

        {/* 2. WHERE IS THE EMERGENCY? (Section 3 & 4) */}
        {!hasSelectedLocation || isChangingLocation ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-white tracking-tight">
                  WHERE IS THE EMERGENCY?
                </h2>
                <p className="text-xs text-slate-400">
                  Select your live location, search any location in India, or pick directly on the map.
                </p>
              </div>
              {hasSelectedLocation && (
                <button
                  onClick={() => setIsChangingLocation(false)}
                  className="text-xs px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
              )}
            </div>

            <LocationPicker
              label="EMERGENCY PICKUP LOCATION"
              value={emergencyRequest.pickupCoords ? {
                latitude: emergencyRequest.pickupCoords.lat,
                longitude: emergencyRequest.pickupCoords.lng,
                formattedAddress: emergencyRequest.pickupLocation
              } : null}
              onConfirm={handleLocationConfirmed}
            />
          </div>
        ) : (
          /* Location Confirmation Card */
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-red-600/20 text-red-500 border border-red-500/30 flex items-center justify-center shrink-0">
                <MapPin className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  CONFIRMED EMERGENCY LOCATION
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  {emergencyRequest.pickupLocation}
                </h3>
                <p className="text-xs font-mono text-slate-400 mt-0.5">
                  Coordinates: {emergencyRequest.pickupCoords.lat.toFixed(4)}, {emergencyRequest.pickupCoords.lng.toFixed(4)} • Source: {emergencyRequest.source || 'REAL_MAP'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsChangingLocation(true)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-colors"
            >
              Change Location
            </button>
          </div>
        )}

        {/* 3. REAL MAP, REAL HOSPITALS & ROUTE CALCULATION (Sections 10-16) */}
        {hasSelectedLocation && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* Left Column: Interactive Map with Real Route (7 / 12) */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl flex flex-col gap-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-red-500" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Real Road Corridor Map
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    REAL GOOGLE / OSM ROADS
                  </span>
                </div>

                <div className="h-[420px] rounded-2xl overflow-hidden border border-slate-800 relative">
                  <MapContainer height="100%" interactive={true} />
                </div>

                {/* Real Route Summary Pill */}
                {calculatedRoute && (
                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-red-400" />
                      <span className="text-slate-400">Traffic-Aware ETA:</span>
                      <strong className="text-white">{calculatedRoute.etaMinutes} min</strong>
                    </div>
                    <div className="flex items-center gap-2">
                      <Gauge className="w-4 h-4 text-blue-400" />
                      <span className="text-slate-400">Distance:</span>
                      <strong className="text-white">{calculatedRoute.distanceKm} km</strong>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Real Nearby Hospitals & Selection (5 / 12) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col gap-4">
                
                {/* Header & Radius Control (Section 39) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Hospital className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">
                        Nearby Hospitals
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      {nearbyHospitals.length} Found
                    </span>
                  </div>

                  {/* Radius Filter Pills */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-[11px] text-slate-400 mr-1">Radius:</span>
                    {[5, 10, 25, 50].map((r) => (
                      <button
                        key={r}
                        onClick={() => setRadiusKm(r)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          radiusKm === r
                            ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {r} km
                      </button>
                    ))}
                  </div>
                </div>

                {/* Manual Hospital Search Input (Section 13) */}
                <form onSubmit={handleManualHospitalSearch} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search hospital by name (e.g. AIIMS)..."
                      value={hospitalSearchQuery}
                      onChange={(e) => setHospitalSearchQuery(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors"
                  >
                    Search
                  </button>
                </form>

                {/* Hospital List Results */}
                <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                  {isSearchingHospitals ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      Searching hospitals in this area...
                    </div>
                  ) : nearbyHospitals.length === 0 ? (
                    /* Zero Results State per Section 37 */
                    <div className="py-8 text-center space-y-3">
                      <p className="text-xs text-slate-400">
                        {hospitalSearchMessage || 'No hospitals found within the selected radius.'}
                      </p>
                      <button
                        onClick={() => setRadiusKm(25)}
                        className="px-3 py-1.5 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30 text-xs font-bold"
                      >
                        Expand Search Radius to 25 km
                      </button>
                    </div>
                  ) : (
                    nearbyHospitals.map((hosp) => {
                      const isSelected = selectedHospital?.name === hosp.name || selectedHospital?.id === hosp.id;
                      return (
                        <div
                          key={hosp.id || hosp.googlePlaceId}
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
                              {hosp.distanceKm} km away
                            </span>
                            <span className="text-slate-400">
                              ETA ~{hosp.etaMinutes || Math.max(3, Math.round(hosp.distanceKm * 2))} min
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Assigned Location-Aware Demo Ambulance (Section 17-19) */}
                {selectedAmbulance && (
                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-blue-400" />
                        <span className="text-xs font-bold text-white">
                          {selectedAmbulance.name || 'ALS Mobile ICU Unit'}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        DEMO AMBULANCE
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Located near {emergencyRequest.shortTitle || 'selected pickup area'} • Pilot: {selectedAmbulance.driver_name || selectedAmbulance.driverName || 'Rajesh Shinde'}
                    </p>
                  </div>
                )}

                {/* Large Launch Button */}
                <button
                  onClick={handleLaunchEmergency}
                  disabled={!selectedHospital}
                  className="w-full py-4 rounded-2xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-red-600/30 transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  <ShieldAlert className="w-5 h-5 animate-pulse" />
                  <span>START EMERGENCY & LAUNCH CORRIDOR</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default CustomerDashboard;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmergency } from '../context/EmergencyContext';
import { 
  Hospital, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  Check, 
  ArrowRight, 
  Bed, 
  Phone,
  HelpCircle,
  Search,
  Loader2,
  Navigation2,
  Route,
  Sparkles,
  RefreshCw,
  Compass
} from 'lucide-react';

export const HospitalSelectionPage = () => {
  const navigate = useNavigate();
  const { 
    mockHospitals, 
    selectedHospital, 
    chooseHospital, 
    deferHospitalSelection, 
    startEmergencyJourney,
    selectedAmbulance,
    emergencyRequest 
  } = useEmergency();

  const [hospitals, setHospitals] = useState(mockHospitals);
  const [chosenId, setChosenId] = useState(selectedHospital?.id || mockHospitals[0].id);
  const [radiusKm, setRadiusKm] = useState(15);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [routePreview, setRoutePreview] = useState(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);

  const pickupLat = emergencyRequest.pickupCoords?.latitude || emergencyRequest.pickupCoords?.lat || (emergencyRequest.pickupCoords ? null : 20.5937);
  const pickupLng = emergencyRequest.pickupCoords?.longitude || emergencyRequest.pickupCoords?.lng || (emergencyRequest.pickupCoords ? null : 78.9629);

  // Fetch nearby hospitals relative to emergency pickup coordinates
  const fetchNearbyHospitals = async (selectedRadius = radiusKm) => {
    setIsLoading(true);
    try {
      const radiusMeters = selectedRadius * 1000;
      const res = await fetch(`http://localhost:5000/api/hospitals/nearby-places?lat=${pickupLat}&lng=${pickupLng}&radius=${radiusMeters}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.places) && data.places.length > 0) {
        const mapped = data.places.map((p, idx) => ({
          id: p.id || p.googlePlaceId || `HOSP-${idx + 1}`,
          name: p.name,
          address: p.address,
          latitude: p.latitude,
          longitude: p.longitude,
          distanceKm: p.distanceKm || 3.5,
          etaMinutes: p.etaMinutes || Math.max(3, Math.round((p.distanceKm || 3.5) * 2.2)),
          phone: p.phone || '+91 108 Emergency Desk',
          status: 'Emergency Department Available',
          specialties: p.specialties || ['Emergency Trauma', 'Cardiac Resuscitation'],
          source: p.source || 'VERIFIED_NETWORK'
        }));

        setHospitals(mapped);
        
        // Auto-select first hospital if current chosen isn't in list
        if (!mapped.some(h => h.id === chosenId)) {
          setChosenId(mapped[0].id);
          chooseHospital(mapped[0]);
          calculateRouteToHospital(mapped[0]);
        } else {
          const current = mapped.find(h => h.id === chosenId);
          if (current) calculateRouteToHospital(current);
        }
      } else {
        setHospitals(mockHospitals);
      }
    } catch (err) {
      console.warn('[Hospital Page] Fetch nearby failed:', err);
      setHospitals(mockHospitals);
    } finally {
      setIsLoading(false);
    }
  };

  // Search hospitals by text query across India
  const handleSearchHospitals = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      fetchNearbyHospitals();
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/hospitals/search?q=${encodeURIComponent(searchQuery)}&lat=${pickupLat}&lng=${pickupLng}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.results) && data.results.length > 0) {
        const mapped = data.results.map((p, idx) => ({
          id: p.id || `HOSP-SEARCH-${idx + 1}`,
          name: p.name,
          address: p.address,
          latitude: p.latitude,
          longitude: p.longitude,
          distanceKm: p.distanceKm || 5.0,
          etaMinutes: Math.max(3, Math.round((p.distanceKm || 5.0) * 2.2)),
          phone: p.phone || '+91 108 Emergency Desk',
          status: 'Emergency Department Available',
          specialties: p.specialties || ['Emergency Trauma'],
          source: p.source || 'SEARCH_RESULT'
        }));
        setHospitals(mapped);
        if (mapped.length > 0) {
          setChosenId(mapped[0].id);
          chooseHospital(mapped[0]);
          calculateRouteToHospital(mapped[0]);
        }
      }
    } catch (err) {
      console.warn('Text search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate live route & traffic ETA to selected hospital
  const calculateRouteToHospital = async (targetHosp) => {
    if (!targetHosp?.latitude || !targetHosp?.longitude) return;

    setIsCalculatingRoute(true);
    try {
      const res = await fetch('http://localhost:5000/api/routes/emergency-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: { latitude: pickupLat, longitude: pickupLng },
          destination: { latitude: targetHosp.latitude, longitude: targetHosp.longitude },
          alternatives: true
        })
      });

      const data = await res.json();
      if (data.success && data.route) {
        setRoutePreview(data.route);
      }
    } catch (err) {
      console.warn('Route calculation error:', err);
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  useEffect(() => {
    fetchNearbyHospitals();
  }, [pickupLat, pickupLng, radiusKm]);

  const handleSelect = (hosp) => {
    setChosenId(hosp.id);
    chooseHospital(hosp);
    calculateRouteToHospital(hosp);
  };

  const handleConfirmHospital = () => {
    const hosp = hospitals.find(h => h.id === chosenId) || hospitals[0];
    if (hosp) {
      chooseHospital(hosp);
    }
    startEmergencyJourney();
    navigate('/customer/emergency');
  };

  const handleSelectLater = () => {
    deferHospitalSelection();
    startEmergencyJourney();
    navigate('/customer/emergency');
  };

  const activeHospital = hospitals.find(h => h.id === chosenId) || hospitals[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-6 text-xs text-slate-600">
          <div className="flex items-center gap-2 text-emerald-400">
            <span className="w-5 h-5 rounded-full bg-emerald-600/30 border border-emerald-500 text-emerald-400 font-bold flex items-center justify-center text-[10px]">
              ✓
            </span>
            <span>Emergency Location</span>
          </div>
          <div className="h-0.5 w-12 bg-emerald-500" />
          <div className="flex items-center gap-2 text-emerald-400">
            <span className="w-5 h-5 rounded-full bg-emerald-600/30 border border-emerald-500 text-emerald-400 font-bold flex items-center justify-center text-[10px]">
              ✓
            </span>
            <span>Ambulance ({selectedAmbulance?.id || 'AMB-102'})</span>
          </div>
          <div className="h-0.5 w-12 bg-red-600" />
          <div className="flex items-center gap-2 text-slate-900 font-bold">
            <span className="w-5 h-5 rounded-full bg-red-600 text-white font-bold flex items-center justify-center text-[10px]">
              3
            </span>
            <span>Hospital Destination</span>
          </div>
        </div>

        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              Select Emergency Hospital
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              CorridorX links traffic signals & roadside LED boards towards the target trauma bay.
            </p>
          </div>
          <div className="text-xs text-slate-600 font-mono">
            Origin: <span className="text-slate-800">{pickupLat.toFixed(4)}, {pickupLng.toFixed(4)}</span>
          </div>
        </div>

        {/* Search Bar & Radius Controls */}
        <div className="mb-6 space-y-3 bg-white border border-slate-200 p-4 rounded-2xl shadow-xl">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchHospitals()}
                placeholder="Search specific hospital (e.g. Kokilaben Mumbai, AIIMS Delhi, Ruby Hall, Apollo, Fortis)..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-red-500 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus: focus: transition-colors"
              />
            </div>
            <button
              onClick={() => handleSearchHospitals()}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md transition-colors shrink-0"
            >
              Search
            </button>
          </div>

          {/* Radius Filter Pills */}
          <div className="flex items-center justify-between pt-1 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-bold uppercase text-[10px] mr-1">Radius:</span>
              {[5, 10, 20, 35, 50].map((r) => (
                <button
                  key={r}
                  onClick={() => { setRadiusKm(r); fetchNearbyHospitals(r); }}
                  className={`px-2.5 py-1 rounded-lg font-mono font-bold text-[11px] transition-colors ${
                    radiusKm === r
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  {r} km
                </button>
              ))}
            </div>

            <button
              onClick={() => fetchNearbyHospitals()}
              className="flex items-center gap-1 text-slate-600 hover:text-slate-900 text-[11px]"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Live Route Preview Card */}
        {activeHospital && (
          <div className="mb-6 bg-gradient-to-r from-red-950/40 via-slate-900 to-slate-900 border border-red-500/30 rounded-2xl p-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 text-[10px] font-bold font-mono uppercase tracking-wider flex items-center gap-1">
                    <Route className="w-3 h-3" />
                    Dynamic Corridor Preview
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400">
                    TRAFFIC-AWARE OPTIMAL
                  </span>
                </div>
                <h4 className="text-sm font-extrabold text-slate-900">
                  Corridor to {activeHospital.name}
                </h4>
                <p className="text-xs text-slate-600 line-clamp-1">
                  From: {emergencyRequest.pickupLocation}
                </p>
              </div>

              <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl shrink-0">
                <div>
                  <p className="text-[10px] font-bold text-slate-600 uppercase">Emergency ETA</p>
                  <p className="text-lg font-black font-mono text-red-400">
                    {isCalculatingRoute ? '...' : (routePreview?.etaMinutes || activeHospital.etaMinutes)} MIN
                  </p>
                </div>
                <div className="h-8 w-px bg-slate-100" />
                <div>
                  <p className="text-[10px] font-bold text-slate-600 uppercase">Distance</p>
                  <p className="text-lg font-black font-mono text-slate-900">
                    {isCalculatingRoute ? '...' : (routePreview?.distanceKm || activeHospital.distanceKm)} KM
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Deferred Choice Banner */}
        <div className="mb-6 bg-white border border-amber-500/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-900">
                Not sure which hospital yet?
              </h4>
              <p className="text-xs text-slate-700 mt-0.5">
                You can board the ambulance first and let the emergency paramedics examine the patient before picking the destination.
              </p>
            </div>
          </div>
          <button
            onClick={handleSelectLater}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-extrabold text-xs border border-amber-500/40 transition-colors whitespace-nowrap text-center"
          >
            Decide En Route →
          </button>
        </div>

        {/* Hospitals List */}
        {isLoading ? (
          <div className="py-16 text-center space-y-3 bg-white border border-slate-200 rounded-3xl">
            <Loader2 className="w-8 h-8 text-red-500 animate-spin mx-auto" />
            <p className="text-sm font-bold text-slate-700">Searching emergency trauma centers across India...</p>
            <p className="text-xs text-slate-500">Checking nearest emergency desks & verified trauma networks</p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {hospitals.map((hosp, idx) => {
              const isSelected = hosp.id === chosenId;

              return (
                <div
                  key={hosp.id}
                  onClick={() => handleSelect(hosp)}
                  className={`cursor-pointer rounded-2xl p-4 sm:p-5 border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isSelected
                      ? 'bg-white border-red-500   shadow-xl shadow-sm'
                      : 'bg-white hover:bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Left: Hospital Icon & Details */}
                  <div className="flex items-start sm:items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                      isSelected 
                        ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-slate-900 shadow-sm' 
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      <Hospital className="w-7 h-7" />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-extrabold text-slate-900">
                          {hosp.name}
                        </h3>

                        {idx === 0 && (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            NEAREST TRAUMA BAY
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 mt-1 flex items-center gap-1 line-clamp-1">
                        <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                        <span>{hosp.address}</span>
                      </p>

                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-700">
                        <div className="flex items-center gap-1 text-emerald-400 font-bold">
                          <Bed className="w-3.5 h-3.5" />
                          <span>Emergency Services Available</span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1 text-slate-600">
                          <Phone className="w-3.5 h-3.5" />
                          <span>{hosp.phone}</span>
                        </div>
                      </div>

                      {/* Specialties */}
                      {hosp.specialties && hosp.specialties.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {hosp.specialties.slice(0, 3).map((spec, sIdx) => (
                            <span key={sIdx} className="text-[10px] px-2 py-0.5 rounded bg-slate-50 text-slate-600 border border-slate-200">
                              {spec}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Distance, ETA & Select Button */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200 shrink-0">
                    <div className="text-left sm:text-right">
                      <div className="text-base sm:text-lg font-mono font-black text-emerald-400">
                        {hosp.etaMinutes} MIN ETA
                      </div>
                      <div className="text-xs text-slate-600 font-medium">
                        {hosp.distanceKm} km away
                      </div>
                    </div>

                    <div className="mt-2">
                      {isSelected ? (
                        <span className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-emerald-600 text-white font-extrabold text-xs shadow-md shadow-sm">
                          <Check className="w-3.5 h-3.5" />
                          <span>TARGETED</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleSelect(hosp); }}
                          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 font-bold text-xs border border-slate-300 transition-colors"
                        >
                          SELECT
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-8 pt-4 border-t border-slate-900 flex items-center justify-between">
          <button
            onClick={() => navigate('/customer/ambulances')}
            className="text-xs text-slate-600 hover:text-slate-900 font-semibold transition-colors"
          >
            ← Back to Ambulances
          </button>

          <button
            onClick={handleConfirmHospital}
            className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-sm shadow-xl shadow-sm transition-all hover:scale-105 active:scale-95"
          >
            <span>Activate Corridor & Dispatch</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};

export default HospitalSelectionPage;



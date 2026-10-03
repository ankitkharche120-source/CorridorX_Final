import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmergency } from '../context/EmergencyContext';
import { 
  Truck, 
  Star, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  Check, 
  ArrowRight, 
  Sparkles,
  HeartPulse,
  Radio,
  Loader2,
  RefreshCw
} from 'lucide-react';

export const AvailableAmbulancesPage = () => {
  const navigate = useNavigate();
  const { mockAmbulances, selectedAmbulance, chooseAmbulance, emergencyRequest } = useEmergency();
  
  const [ambulances, setAmbulances] = useState(mockAmbulances);
  const [chosenId, setChosenId] = useState(selectedAmbulance?.id || mockAmbulances[0].id);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiveFleet, setIsLiveFleet] = useState(false);
  const [fleetType, setFleetType] = useState('DEMO_DYNAMIC_FLEET');

  // Fetch ambulances relative to chosen emergency pickup location anywhere in India
  const fetchNearbyAmbulances = async () => {
    setIsLoading(true);
    const lat = emergencyRequest.pickupCoords?.lat || 18.5175;
    const lng = emergencyRequest.pickupCoords?.lng || 73.8401;

    try {
      const res = await fetch(`http://localhost:5000/api/ambulances/nearby?lat=${lat}&lng=${lng}&radius=30`);
      const data = await res.json();
      if (data.success && Array.isArray(data.ambulances) && data.ambulances.length > 0) {
        const mapped = data.ambulances.map((a, i) => ({
          id: a.id,
          name: a.type || 'ALS Advanced Life Support',
          driverName: a.driver_name || a.driverName || 'Corridor Pilot',
          driverRating: a.rating || 4.9,
          vehicleNumber: a.vehicle_number || a.vehicleNumber || 'IND-EMS-102',
          phone: a.phone || '+91 98220 14892',
          agency: a.operator_agency || 'CorridorX Dynamic Rapid Unit',
          distanceKm: a.distanceKm,
          etaMinutes: a.etaMinutes,
          equipment: Array.isArray(a.equipment) ? a.equipment : ['Ventilator', 'Defibrillator', 'Oxygen Cylinder'],
          latitude: a.latitude,
          longitude: a.longitude,
          isDemoFleet: a.isDemoFleet !== undefined ? a.isDemoFleet : true,
          fleetBadge: a.fleetBadge || (a.isDemoFleet ? 'DEMO FLEET • Simulated for Demonstration' : 'REAL FLEET • LIVE GPS CONNECTED')
        }));

        setAmbulances(mapped);
        setIsLiveFleet(Boolean(data.isLiveFleetConnected));
        setFleetType(data.fleetType || 'DEMO_DYNAMIC_FLEET');

        // Retain or set selected ambulance
        if (!mapped.some(m => m.id === chosenId)) {
          setChosenId(mapped[0].id);
          chooseAmbulance(mapped[0]);
        }
      } else {
        setAmbulances(mockAmbulances);
      }
    } catch (err) {
      console.warn('[Ambulance Page] Fetch error, using preset fleet:', err);
      setAmbulances(mockAmbulances);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNearbyAmbulances();
  }, [emergencyRequest.pickupCoords?.lat, emergencyRequest.pickupCoords?.lng]);

  const handleSelect = (amb) => {
    setChosenId(amb.id);
    chooseAmbulance(amb);
  };

  const handleProceed = () => {
    const amb = ambulances.find(a => a.id === chosenId) || ambulances[0];
    if (amb) {
      chooseAmbulance(amb);
    }
    navigate('/customer/hospitals');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        
        {/* Breadcrumb / Step Indicator */}
        <div className="flex items-center justify-between mb-6 text-xs text-slate-400">
          <div className="flex items-center gap-2 text-emerald-400">
            <span className="w-5 h-5 rounded-full bg-emerald-600/30 border border-emerald-500 text-emerald-400 font-bold flex items-center justify-center text-[10px]">
              ✓
            </span>
            <span>Emergency Location</span>
          </div>
          <div className="h-0.5 w-12 bg-red-600" />
          <div className="flex items-center gap-2 text-white font-bold">
            <span className="w-5 h-5 rounded-full bg-red-600 text-white font-bold flex items-center justify-center text-[10px]">
              2
            </span>
            <span>Select Ambulance</span>
          </div>
          <div className="h-0.5 w-12 bg-slate-800" />
          <div className="flex items-center gap-2 text-slate-600">
            <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 font-bold flex items-center justify-center text-[10px]">
              3
            </span>
            <span>Hospital</span>
          </div>
        </div>

        {/* Header & Fleet Badge */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-white">
              Nearby Emergency Ambulances
            </h1>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span>Targeting: <strong className="text-slate-200">{emergencyRequest.pickupLocation}</strong></span>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isLiveFleet ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-xs font-mono text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>REAL FLEET • LIVE GPS CONNECTED</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/40 text-xs font-mono text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>DEMO FLEET • Simulated for Demonstration</span>
              </span>
            )}

            <button
              onClick={fetchNearbyAmbulances}
              className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Refresh Nearby Ambulances"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Loading Spinner */}
        {isLoading ? (
          <div className="py-16 text-center space-y-3 bg-slate-900/40 border border-slate-800 rounded-3xl">
            <Loader2 className="w-8 h-8 text-red-500 animate-spin mx-auto" />
            <p className="text-sm font-bold text-slate-300">Searching emergency vehicles within 30 km radius...</p>
            <p className="text-xs text-slate-500">Checking nearest Advanced Cardiac (ALS) and Basic Life Support (BLS) units</p>
          </div>
        ) : (
          /* Vehicle Selection Cards */
          <div className="space-y-3.5">
            {ambulances.map((amb, idx) => {
              const isSelected = amb.id === chosenId;

              return (
                <div
                  key={amb.id}
                  onClick={() => handleSelect(amb)}
                  className={`cursor-pointer rounded-2xl p-4 sm:p-5 border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isSelected
                      ? 'bg-slate-900 border-red-500 ring-2 ring-red-500/30 shadow-xl shadow-red-500/10'
                      : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Left: Vehicle Avatar & Primary Details */}
                  <div className="flex items-start sm:items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                      isSelected 
                        ? 'bg-gradient-to-br from-red-600 to-rose-700 text-white shadow-red-500/30' 
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      <Truck className="w-7 h-7" />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-white">
                          {amb.id}
                        </span>
                        <h3 className="text-base font-extrabold text-white">
                          {amb.name}
                        </h3>

                        {idx === 0 && (
                          <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            FASTEST ETA
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-400">
                        <span>Vehicle: <strong className="text-slate-200">{amb.vehicleNumber}</strong></span>
                        <span>•</span>
                        <span>Pilot: <strong className="text-slate-200">{amb.driverName}</strong></span>
                        <div className="flex items-center gap-1 text-amber-400 font-bold">
                          <Star className="w-3 h-3 fill-current" />
                          <span>{amb.driverRating}</span>
                        </div>
                      </div>

                      {/* Equipment Tags */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {amb.equipment.slice(0, 4).map((item, eqIdx) => (
                          <span key={eqIdx} className="text-[10px] px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right: Distance, ETA & Selection Button */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800 shrink-0">
                    <div className="text-left sm:text-right">
                      <div className="text-base sm:text-lg font-mono font-black text-red-400">
                        ETA {amb.etaMinutes} min
                      </div>
                      <div className="text-xs text-slate-400 font-medium">
                        {amb.distanceKm} km away
                      </div>
                    </div>

                    <div className="mt-2">
                      {isSelected ? (
                        <span className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-red-600 text-white font-extrabold text-xs shadow-md shadow-red-600/30">
                          <Check className="w-3.5 h-3.5" />
                          <span>SELECTED</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleSelect(amb); }}
                          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs border border-slate-700 transition-colors"
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
            onClick={() => navigate('/customer/request')}
            className="text-xs text-slate-400 hover:text-white font-semibold transition-colors"
          >
            ← Back to Details
          </button>

          <button
            onClick={handleProceed}
            className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-sm shadow-xl shadow-red-600/30 transition-all hover:scale-105 active:scale-95"
          >
            <span>Proceed to Hospital Selection</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};

export default AvailableAmbulancesPage;

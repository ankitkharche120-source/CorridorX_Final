import React, { useState } from 'react';
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
  HeartPulse
} from 'lucide-react';

export const AvailableAmbulancesPage = () => {
  const navigate = useNavigate();
  const { mockAmbulances, selectedAmbulance, chooseAmbulance, emergencyRequest } = useEmergency();
  const [chosenId, setChosenId] = useState(selectedAmbulance?.id || mockAmbulances[0].id);

  const handleSelect = (amb) => {
    setChosenId(amb.id);
    chooseAmbulance(amb);
  };

  const handleProceed = () => {
    const amb = mockAmbulances.find(a => a.id === chosenId);
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
            <span>Emergency Details</span>
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

        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-white">
              Nearby Emergency Ambulances
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Targeting: <strong className="text-slate-200">{emergencyRequest.pickupLocation}</strong>
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{mockAmbulances.length} UNITS READY FOR DISPATCH</span>
          </div>
        </div>

        {/* Ola/Uber Style Vehicle Selection Cards */}
        <div className="space-y-3.5">
          {mockAmbulances.map((amb) => {
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
                      {amb.id === 'AMB-102' && (
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2 py-0.2 rounded-full flex items-center gap-1">
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
                      {amb.equipment.slice(0, 3).map((item, idx) => (
                        <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
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

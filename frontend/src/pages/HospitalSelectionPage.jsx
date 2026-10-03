import React, { useState } from 'react';
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
  HelpCircle
} from 'lucide-react';

export const HospitalSelectionPage = () => {
  const navigate = useNavigate();
  const { 
    mockHospitals, 
    selectedHospital, 
    chooseHospital, 
    deferHospitalSelection, 
    startEmergencyJourney,
    selectedAmbulance 
  } = useEmergency();

  const [chosenId, setChosenId] = useState(selectedHospital?.id || mockHospitals[0].id);

  const handleSelect = (hosp) => {
    setChosenId(hosp.id);
    chooseHospital(hosp);
  };

  const handleConfirmHospital = () => {
    const hosp = mockHospitals.find(h => h.id === chosenId);
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

  return (
    <div className="min-h-screen bg-slate-950 text-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-6 text-xs text-slate-400">
          <div className="flex items-center gap-2 text-emerald-400">
            <span className="w-5 h-5 rounded-full bg-emerald-600/30 border border-emerald-500 text-emerald-400 font-bold flex items-center justify-center text-[10px]">
              ✓
            </span>
            <span>Details</span>
          </div>
          <div className="h-0.5 w-12 bg-emerald-500" />
          <div className="flex items-center gap-2 text-emerald-400">
            <span className="w-5 h-5 rounded-full bg-emerald-600/30 border border-emerald-500 text-emerald-400 font-bold flex items-center justify-center text-[10px]">
              ✓
            </span>
            <span>Ambulance ({selectedAmbulance?.id})</span>
          </div>
          <div className="h-0.5 w-12 bg-red-600" />
          <div className="flex items-center gap-2 text-white font-bold">
            <span className="w-5 h-5 rounded-full bg-red-600 text-white font-bold flex items-center justify-center text-[10px]">
              3
            </span>
            <span>Hospital Destination</span>
          </div>
        </div>

        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-white">
              Select Emergency Hospital
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              CorridorX will configure traffic lights and LED gantry boards towards the selected facility.
            </p>
          </div>
        </div>

        {/* Flexible Option: "Select Hospital Later" Banner (Prominently featured as required) */}
        <div className="mb-6 bg-slate-900 border border-amber-500/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-white">
                Not sure which hospital yet?
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                You can board the ambulance first and let the emergency paramedics examine the patient before picking the destination.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSelectLater}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition-colors shadow-lg shadow-amber-500/20 shrink-0"
          >
            SELECT HOSPITAL LATER
          </button>
        </div>

        {/* Hospital Cards List */}
        <div className="space-y-3.5">
          {mockHospitals.map((hosp) => {
            const isSelected = hosp.id === chosenId;

            return (
              <div
                key={hosp.id}
                onClick={() => handleSelect(hosp)}
                className={`cursor-pointer rounded-2xl p-4 sm:p-5 border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isSelected
                    ? 'bg-slate-900 border-emerald-500 ring-2 ring-emerald-500/30 shadow-xl shadow-emerald-500/10'
                    : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Left: Hospital Icon & Info */}
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                    isSelected
                      ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-emerald-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    <Hospital className="w-7 h-7" />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-extrabold text-white">
                        {hosp.name}
                      </h3>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.2 rounded-full">
                        {hosp.emergencyDepartmentStatus}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{hosp.address}</span>
                    </p>

                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
                      <span className="flex items-center gap-1 text-slate-300 font-semibold">
                        <Bed className="w-3.5 h-3.5 text-blue-400" />
                        <span>{hosp.icuBedsAvailable} ICU Beds Open</span>
                      </span>
                      <span>•</span>
                      <span className="text-slate-400 font-mono">
                        Lead: {hosp.traumaTeamLead}
                      </span>
                    </div>

                    {/* Specialties */}
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {hosp.specialties.map((spec, idx) => (
                        <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Distance, ETA & Select Button */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800 shrink-0">
                  <div className="text-left sm:text-right">
                    <div className="text-base sm:text-lg font-mono font-black text-emerald-400">
                      ETA {hosp.etaMinutes} min
                    </div>
                    <div className="text-xs text-slate-400 font-medium">
                      {hosp.distanceKm} km away
                    </div>
                  </div>

                  <div className="mt-2">
                    {isSelected ? (
                      <span className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-emerald-600 text-white font-extrabold text-xs shadow-md shadow-emerald-600/30">
                        <Check className="w-3.5 h-3.5" />
                        <span>SELECTED</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleSelect(hosp); }}
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

        {/* Bottom CTA Bar */}
        <div className="mt-8 pt-4 border-t border-slate-900 flex items-center justify-between">
          <button
            onClick={() => navigate('/customer/ambulances')}
            className="text-xs text-slate-400 hover:text-white font-semibold transition-colors"
          >
            ← Back to Ambulances
          </button>

          <button
            onClick={handleConfirmHospital}
            className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-sm shadow-xl shadow-red-600/30 transition-all hover:scale-105 active:scale-95"
          >
            <span>Activate Corridor & Start Journey</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};

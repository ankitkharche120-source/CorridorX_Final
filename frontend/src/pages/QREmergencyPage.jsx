import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEmergency } from '../context/EmergencyContext';
import { 
  QrCode, 
  Sparkles, 
  ShieldCheck, 
  MessageSquare, 
  ArrowRight, 
  CheckCircle2, 
  Hospital, 
  User, 
  Phone, 
  AlertCircle,
  Truck
} from 'lucide-react';

export const QREmergencyPage = () => {
  const navigate = useNavigate();
  const { ambulanceId } = useParams();
  const { mockHospitals, createGuestQREmergency, selectedAmbulance } = useEmergency();

  // If ambulanceId is passed in URL, skip directly to step 2 with that unit identified
  const [step, setStep] = useState(ambulanceId ? 2 : 1);
  const activeAmbulanceId = ambulanceId || selectedAmbulance?.id || 'AMB-102';

  const [guestData, setGuestData] = useState({
    name: 'Siddharth Patil (Guest via QR)',
    phone: '+91 98230 44556',
    injury: 'Acute Head Injury / Concussion',
    hospitalId: mockHospitals[0].id,
    ambulanceId: activeAmbulanceId
  });

  useEffect(() => {
    if (ambulanceId) {
      setStep(2);
      setGuestData(prev => ({ ...prev, ambulanceId }));
    }
  }, [ambulanceId]);

  const handleSimulateScan = () => {
    setStep(2);
  };

  const handleQuickSubmit = (e) => {
    e.preventDefault();
    createGuestQREmergency(guestData);
    navigate('/customer/emergency');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 text-xs font-mono mb-3">
            <QrCode className="w-3.5 h-3.5" />
            <span>RAPID ACCESS • ZERO-APP ONBOARDING</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Emergency? <span className="text-red-500">Scan.</span> Request. <span className="text-emerald-400">Go.</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-2 max-w-lg mx-auto">
            Inspired by Metro QR ticketing. Standing near an ambulance? Scan the vehicle's QR decal to instantly create a temporary session without tedious account registration.
          </p>
        </div>

        {/* Step 1: Simulated QR Code & Camera Viewfinder */}
        {step === 1 && (
          <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl text-center space-y-6">
            
            {/* Realistic Ambulance QR Decal Preview */}
            <div className="bg-white text-slate-950 rounded-2xl p-6 max-w-xs mx-auto shadow-2xl border-4 border-slate-200 relative">
              <div className="flex items-center justify-between text-[11px] font-black uppercase text-red-600 border-b border-slate-200 pb-2 mb-3 font-mono">
                <span>CORRIDORX AMBULANCE</span>
                <span>AMB-102</span>
              </div>

              {/* Graphic QR Code SVG */}
              <div className="w-48 h-48 mx-auto bg-slate-950 p-3 rounded-xl flex items-center justify-center text-white relative">
                <svg className="w-full h-full text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm10-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm14 2h4v4h-4v-4zm-4-4h4v2h-4v-2zm2 4h2v2h-2v-2zm-6-2h2v4h-2v-4zm4-2h2v2h-2v-2zm2 2h2v2h-2v-2z" />
                </svg>
                {/* Center logo badge */}
                <div className="absolute inset-0 m-auto w-8 h-8 rounded-md bg-red-600 flex items-center justify-center font-black text-white text-xs border border-white">
                  CX
                </div>
              </div>

              <div className="mt-3 text-[11px] font-bold text-slate-700">
                POINT CAMERA OR TAP TO SIMULATE SCAN
              </div>
            </div>

            {/* WhatsApp Handoff Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 text-xs">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>Direct WhatsApp Handoff Enabled (Automatic session creation)</span>
            </div>

            <div>
              <button
                type="button"
                onClick={handleSimulateScan}
                className="w-full py-4 px-6 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-sm shadow-xl shadow-red-600/30 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Simulate Scanning Ambulance QR Code</span>
              </button>
            </div>

          </div>
        )}

        {/* Step 2: Instant Guest Session & Hospital Selection */}
        {step === 2 && (
          <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase">
                  TEMPORARY EMERGENCY SESSION CREATED
                </span>
              </div>
              <span className="text-xs font-mono text-slate-400">Identified Unit: <strong className="text-white">{activeAmbulanceId}</strong></span>
            </div>

            <form onSubmit={handleQuickSubmit} className="space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Patient / Attendant Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={guestData.name}
                    onChange={(e) => setGuestData({ ...guestData, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-red-500 rounded-xl text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Phone (Auto-synced from WhatsApp)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={guestData.phone}
                    onChange={(e) => setGuestData({ ...guestData, phone: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-red-500 rounded-xl text-sm text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Injury / Emergency Type
                </label>
                <select
                  value={guestData.injury}
                  onChange={(e) => setGuestData({ ...guestData, injury: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-red-500 rounded-xl text-sm text-white"
                >
                  <option value="Acute Head Injury / Concussion">Acute Head Injury / Concussion</option>
                  <option value="Road Accident (Polytrauma)">Road Accident (Polytrauma)</option>
                  <option value="Severe Chest Pain">Severe Chest Pain</option>
                  <option value="Respiratory Distress">Respiratory Distress</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Destination Hospital
                </label>
                <select
                  value={guestData.hospitalId}
                  onChange={(e) => setGuestData({ ...guestData, hospitalId: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-sm text-white"
                >
                  {mockHospitals.map(h => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.distanceKm} km • {h.icuBedsAvailable} ICU Beds)
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full py-4 px-6 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-sm shadow-xl shadow-red-600/30 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  <span>START EMERGENCY JOURNEY & ACTIVATE CORRIDOR</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </form>

          </div>
        )}

      </div>
    </div>
  );
};

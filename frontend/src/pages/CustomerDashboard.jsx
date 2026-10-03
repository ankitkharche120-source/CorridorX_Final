import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useEmergency } from '../context/EmergencyContext';
import { 
  ShieldAlert, 
  MapPin, 
  HeartPulse, 
  ChevronRight, 
  Clock, 
  Truck, 
  Hospital, 
  Radio, 
  Activity,
  AlertTriangle,
  QrCode
} from 'lucide-react';

export const CustomerDashboard = () => {
  const navigate = useNavigate();
  const { tripStatus, selectedAmbulance, etaMinutes, isSimulating } = useEmergency();

  const emergencyCategories = [
    { title: 'Accident / Polytrauma', desc: 'Road traffic collisions, falls, acute injuries', color: 'border-red-500/40 bg-red-950/20 text-red-400' },
    { title: 'Chest Pain / Cardiac', desc: 'Heart attack symptoms, severe tightness', color: 'border-rose-500/40 bg-rose-950/20 text-rose-400' },
    { title: 'Stroke / Neuro', desc: 'Facial drooping, speech loss, paralysis', color: 'border-blue-500/40 bg-blue-950/20 text-blue-400' },
    { title: 'Breathing Difficulty', desc: 'Severe asthma, choking, low SpO2', color: 'border-amber-500/40 bg-amber-950/20 text-amber-400' }
  ];

  const handleQuickRequest = (type) => {
    navigate('/customer/request', { state: { selectedCategory: type } });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-16">
      
      {/* Top Banner (Ola/Uber Minimalist Header) */}
      <div className="bg-slate-900 border-b border-slate-800 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                Emergency Response System Online
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              CorridorX Emergency Assistance
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Pune Metropolitan Fleet: 18 Ambulances on standby • Dynamic Green Wave Active
            </p>
          </div>

          {/* Large SOS Button (Ola / Uber Style Prominent Action) */}
          <Link
            to="/customer/request"
            className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-base shadow-xl shadow-red-600/30 transition-all hover:scale-105 active:scale-95 group"
          >
            <ShieldAlert className="w-6 h-6 animate-pulse" />
            <span>REQUEST AMBULANCE NOW</span>
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        
        {/* Active Journey Tracker Card if an emergency is in progress */}
        {tripStatus === 'EN_ROUTE' && (
          <div className="bg-gradient-to-r from-red-950/70 via-slate-900 to-slate-900 border-2 border-red-500/80 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-red-600 text-white font-mono text-[10px] font-black uppercase tracking-wider animate-pulse">
                    LIVE EN ROUTE
                  </span>
                  <span className="text-xs text-slate-300 font-mono font-bold">
                    ETA: ~{etaMinutes} min remaining
                  </span>
                </div>
                <h3 className="text-xl font-extrabold text-white mt-2">
                  Ambulance {selectedAmbulance?.id} is Moving
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Dynamic corridor is clearing successive traffic signals ahead of the vehicle.
                </p>
              </div>

              <Link
                to="/customer/emergency"
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white text-slate-950 hover:bg-slate-100 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg transition-transform hover:scale-105"
              >
                <Activity className="w-4 h-4 text-red-600" />
                <span>Open Live Journey Map</span>
              </Link>
            </div>
          </div>
        )}

        {/* Quick Triage Buttons */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white">Select Emergency Category</h2>
              <p className="text-xs text-slate-400">Quick dispatch based on clinical severity</p>
            </div>
            <Link to="/customer/request" className="text-xs text-red-400 hover:text-red-300 font-bold">
              View All Options →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {emergencyCategories.map((cat, idx) => (
              <div
                key={idx}
                onClick={() => handleQuickRequest(cat.title)}
                className={`cursor-pointer p-4 rounded-2xl border transition-all hover:scale-[1.02] flex items-center justify-between ${cat.color}`}
              >
                <div>
                  <h4 className="text-sm font-extrabold text-white">{cat.title}</h4>
                  <p className="text-xs text-slate-300 mt-0.5">{cat.desc}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </div>
            ))}
          </div>
        </div>

        {/* Ola/Uber Service Tiers: Types of Ambulances */}
        <div className="bg-slate-900/60 rounded-3xl p-6 border border-slate-800">
          <h3 className="text-base font-bold text-white mb-1">Ambulance Fleet Categories</h3>
          <p className="text-xs text-slate-400 mb-4">Equipped for different medical criticalities in Pune</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                  CRITICAL CARE
                </span>
                <span className="text-xs font-mono text-slate-400">ETA 4 min</span>
              </div>
              <h4 className="text-sm font-bold text-white">ALS Mobile ICU</h4>
              <p className="text-[11px] text-slate-400 mt-1">
                Ventilator, multi-para cardiac monitor, defibrillator & medical doctor.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                  STANDARD RESPONSE
                </span>
                <span className="text-xs font-mono text-slate-400">ETA 7 min</span>
              </div>
              <h4 className="text-sm font-bold text-white">BLS Basic Life Support</h4>
              <p className="text-[11px] text-slate-400 mt-1">
                Continuous oxygen supply, scoop stretcher, vitals kit & trained EMT.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  SPECIALIST
                </span>
                <span className="text-xs font-mono text-slate-400">ETA 9 min</span>
              </div>
              <h4 className="text-sm font-bold text-white">Neonatal & Trauma Unit</h4>
              <p className="text-[11px] text-slate-400 mt-1">
                Transport incubator, spine immobilizers, trauma splints & blood warmers.
              </p>
            </div>

          </div>
        </div>

        {/* QR Access Callout */}
        <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Standing near an ambulance?</h4>
              <p className="text-[11px] text-slate-400">Scan the ambulance's physical QR sticker to book instantly with zero sign-up.</p>
            </div>
          </div>
          <Link
            to="/qr-emergency"
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white border border-slate-700"
          >
            Scan QR
          </Link>
        </div>

      </div>
    </div>
  );
};

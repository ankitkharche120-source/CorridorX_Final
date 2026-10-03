import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmergency } from '../context/EmergencyContext';
import { 
  User, 
  Truck, 
  Hospital,
  Activity,
  ShieldAlert, 
  ArrowRight, 
  CheckCircle2,
  Lock,
  Globe2
} from 'lucide-react';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { 
    loginAsCustomer, 
    loginAsDriver, 
    loginAsHospital, 
    loginAsControlCenter 
  } = useEmergency();

  // Active role tab: 'CUSTOMER' | 'AMBULANCE' | 'HOSPITAL' | 'CONTROL_CENTER'
  const [activeRole, setActiveRole] = useState('CUSTOMER');

  // Customer Demo Profile Inputs
  const [customerName, setCustomerName] = useState('Rahul Sharma');
  const [customerPhone, setCustomerPhone] = useState('9999999999');
  const [emergencyType, setEmergencyType] = useState('Chest Pain / Acute Cardiac Emergency');

  // Driver Inputs
  const [driverUnitId, setDriverUnitId] = useState('AMB-102');

  // Hospital Inputs
  const [hospitalUnitId, setHospitalUnitId] = useState('HOSP-01');

  const handleCustomerLogin = (e) => {
    if (e) e.preventDefault();
    loginAsCustomer(customerName, customerPhone, emergencyType);
    navigate('/customer');
  };

  const handleDriverLogin = (e) => {
    if (e) e.preventDefault();
    loginAsDriver(driverUnitId);
    navigate('/ambulance');
  };

  const handleHospitalLogin = (e) => {
    if (e) e.preventDefault();
    loginAsHospital(hospitalUnitId);
    navigate('/hospital');
  };

  const handleControlCenterLogin = (e) => {
    if (e) e.preventDefault();
    loginAsControlCenter();
    navigate('/control-center');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12 text-white">
      <div className="max-w-3xl w-full space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/70 border border-red-500/40 text-red-400 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span>CORRIDORX • EMERGENCY MOBILITY PLATFORM</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
            CORRIDOR<span className="text-red-500">X</span>
          </h1>
          <p className="text-slate-400 text-sm max-w-lg mx-auto">
            Dynamic Green Wave Emergency Corridor & Rapid Medical Logistics
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-emerald-400 font-mono">
            <Globe2 className="w-3.5 h-3.5" />
            <span>REAL GOOGLE MAPS & ROADS • DEMO AUTHENTICATION</span>
          </div>
        </div>

        {/* Two-Role Selection Bar (Customer vs Driver) */}
        <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 max-w-md mx-auto">
          <button
            type="button"
            onClick={() => setActiveRole('CUSTOMER')}
            className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 ${
              activeRole === 'CUSTOMER'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>CUSTOMER / PATIENT</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveRole('AMBULANCE')}
            className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 ${
              activeRole === 'AMBULANCE'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>AMBULANCE DRIVER</span>
          </button>
        </div>

        {/* Active Role Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl max-w-xl mx-auto space-y-6">
          
          {/* 1. Customer Portal */}
          {activeRole === 'CUSTOMER' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Customer / Emergency Attendant</h3>
                    <p className="text-xs text-slate-400">Request emergency dispatch, select hospital & track real live route</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  DEMO PROFILE
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Patient / Attendant Name</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-400 font-semibold mb-1">Emergency Category</label>
                  <select
                    value={emergencyType}
                    onChange={(e) => setEmergencyType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="Chest Pain / Acute Cardiac Emergency">Chest Pain / Acute Cardiac Emergency</option>
                    <option value="Road Accident / Polytrauma">Road Accident / Polytrauma</option>
                    <option value="Stroke / Paralysis Acute Alert">Stroke / Paralysis Acute Alert</option>
                    <option value="Severe Breathing Difficulty / Asthma">Severe Breathing Difficulty / Asthma</option>
                    <option value="Pediatric Emergency">Pediatric Emergency</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleCustomerLogin}
                  className="w-full py-3.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl shadow-red-600/30 transition-transform hover:scale-[1.01]"
                >
                  <span>ENTER DEMO AS CUSTOMER</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* 2. Ambulance Pilot Portal */}
          {activeRole === 'AMBULANCE' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Ambulance Pilot Cockpit</h3>
                    <p className="text-xs text-slate-400">Receive dispatch telemetry, follow cleared green wave corridor</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  PILOT READY
                </span>
              </div>

              <div className="text-xs space-y-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Ambulance Unit Identifier</label>
                  <select
                    value={driverUnitId}
                    onChange={(e) => setDriverUnitId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="AMB-102">AMB-102 (ALS Cardiac ICU Unit • Pilot: Rajesh Shinde)</option>
                    <option value="AMB-205">AMB-205 (Trauma Rapid Care Unit • Pilot: Amit Deshmukh)</option>
                    <option value="AMB-309">AMB-309 (BLS Medical Response • Pilot: Suresh Patil)</option>
                  </select>
                </div>
                <p className="text-slate-500 text-[11px]">
                  Ambulance pilots can toggle between Browser Live GPS or Area-Aware Demo Location during trials.
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleDriverLogin}
                  className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl shadow-blue-600/30 transition-transform hover:scale-[1.01]"
                >
                  <span>LOGIN AS AMBULANCE DRIVER</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Prototype Credibility Footer */}
        <div className="text-center text-[11px] text-slate-500 space-y-1">
          <p>CorridorX Emergency Mobility Platform • Real GPS & Road Corridors</p>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmergency } from '../context/EmergencyContext';
import { 
  User, 
  Truck, 
  ShieldAlert, 
  ArrowRight, 
  Lock
} from 'lucide-react';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { 
    loginAsCustomer, 
    loginAsDriver 
  } = useEmergency();

  // Active role tab: 'CUSTOMER' | 'AMBULANCE'
  const [activeRole, setActiveRole] = useState('CUSTOMER');

  // Customer Demo Profile Inputs
  const [customerName, setCustomerName] = useState('Rahul Sharma');
  const [customerPhone, setCustomerPhone] = useState('9999999999');
  const [emergencyType, setEmergencyType] = useState('Chest Pain / Acute Cardiac Emergency');

  // Driver Inputs
  const [driverUnitId, setDriverUnitId] = useState('AMB-102');

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

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12 text-white">
      <div className="max-w-2xl w-full space-y-6">
        
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
                    <p className="text-xs text-slate-400">Request emergency dispatch & track corridor route</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  DEMO PROFILE
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Patient Name</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-medium focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold text-xs mb-1">Emergency Condition</label>
                <select
                  value={emergencyType}
                  onChange={(e) => setEmergencyType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                >
                  <option value="Chest Pain / Acute Cardiac Emergency">Chest Pain / Acute Cardiac Emergency</option>
                  <option value="Road Traffic Accident / Polytrauma">Road Traffic Accident / Polytrauma</option>
                  <option value="Severe Stroke / Neurological Deficit">Severe Stroke / Neurological Deficit</option>
                  <option value="Severe Respiratory Distress">Severe Respiratory Distress</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleCustomerLogin}
                  className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm shadow-xl shadow-red-600/30 flex items-center justify-center gap-2 transition-all"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>ENTER AS CUSTOMER (DEMO)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* 2. Ambulance Driver Portal */}
          {activeRole === 'AMBULANCE' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Ambulance Pilot Terminal</h3>
                    <p className="text-xs text-slate-400">Tactical route navigation & signal clearance</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  PILOT TERMINAL
                </span>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold text-xs mb-1">Assigned Ambulance Unit</label>
                <select
                  value={driverUnitId}
                  onChange={(e) => setDriverUnitId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="AMB-102">AMB-102 (ALS Mobile ICU - Rajesh Shinde - Nal Stop)</option>
                  <option value="AMB-205">AMB-205 (Trauma Unit - Amit Deshmukh - Deccan)</option>
                  <option value="AMB-309">AMB-309 (BLS Unit - Suresh Patil - Kothrud Stand)</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleDriverLogin}
                  className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 transition-all"
                >
                  <Truck className="w-4 h-4" />
                  <span>LOGIN AS DRIVER (DEMO)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default LoginPage;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmergency } from '../context/EmergencyContext';
import { 
  User, 
  Truck, 
  QrCode, 
  ArrowRight, 
  ShieldAlert, 
  Phone, 
  KeyRound,
  CheckCircle2,
  Navigation
} from 'lucide-react';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { loginAsCustomer, loginAsDriver } = useEmergency();

  const [activeTab, setActiveTab] = useState('CUSTOMER'); // 'CUSTOMER' | 'AMBULANCE'

  // Consumer Form State
  const [customerName, setCustomerName] = useState('Rahul Sharma');
  const [customerPhone, setCustomerPhone] = useState('+91 98765 43210');

  // Ambulance Driver Form State
  const [driverId, setDriverId] = useState('AMB-102');
  const [driverPin, setDriverPin] = useState('EMS-PUNE-4521');

  const handleCustomerLogin = (e) => {
    e.preventDefault();
    loginAsCustomer(customerName, customerPhone);
    navigate('/customer/request');
  };

  const handleDriverLogin = (e) => {
    e.preventDefault();
    loginAsDriver(driverId);
    navigate('/ambulance');
  };

  return (
    <div className="min-h-[85vh] bg-slate-950 flex flex-col justify-center items-center px-4 py-10">
      <div className="max-w-2xl w-full space-y-6">
        
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/60 border border-red-500/40 text-red-400 text-xs font-mono mb-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>CORRIDORX ACCESS CONTROL</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Select Your <span className="text-red-500">Login Portal</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-md mx-auto">
            CorridorX provides two separate interfaces for Consumers and Ambulance Drivers. Hospitals are pre-registered medical facilities.
          </p>
        </div>

        {/* The 2 Role Selection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Card 1: Consumer Portal */}
          <div
            onClick={() => setActiveTab('CUSTOMER')}
            className={`cursor-pointer rounded-3xl p-5 border transition-all flex flex-col justify-between ${
              activeTab === 'CUSTOMER'
                ? 'bg-slate-900 border-red-500 ring-2 ring-red-500/30 shadow-2xl shadow-red-500/10'
                : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  activeTab === 'CUSTOMER' ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' : 'bg-slate-800 text-slate-400'
                }`}>
                  <User className="w-6 h-6" />
                </div>
                {activeTab === 'CUSTOMER' && (
                  <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-mono font-bold">
                    ACTIVE SELECTION
                  </span>
                )}
              </div>
              <h3 className="text-base font-extrabold text-white">Consumer / Patient Portal</h3>
              <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                For patients and family attendants: Request an ambulance, select hospital, and track your route with green corridor clearance.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-red-400">
              <span>{activeTab === 'CUSTOMER' ? '● Selected for sign in' : 'Click to select'}</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Card 2: Ambulance Driver Portal */}
          <div
            onClick={() => setActiveTab('AMBULANCE')}
            className={`cursor-pointer rounded-3xl p-5 border transition-all flex flex-col justify-between ${
              activeTab === 'AMBULANCE'
                ? 'bg-slate-900 border-blue-500 ring-2 ring-blue-500/30 shadow-2xl shadow-blue-500/10'
                : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  activeTab === 'AMBULANCE' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-slate-800 text-slate-400'
                }`}>
                  <Truck className="w-6 h-6" />
                </div>
                {activeTab === 'AMBULANCE' && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-mono font-bold">
                    ACTIVE SELECTION
                  </span>
                )}
              </div>
              <h3 className="text-base font-extrabold text-white">Ambulance Driver Cockpit</h3>
              <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                For ambulance drivers and EMS crews: Receive incoming emergency dispatch requests, navigate green corridor, and broadcast live GPS.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-blue-400">
              <span>{activeTab === 'AMBULANCE' ? '● Selected for sign in' : 'Click to select'}</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

        </div>

        {/* Dynamic Login Panel depending on chosen tab */}
        {activeTab === 'CUSTOMER' ? (
          /* Consumer Sign In Form */
          <form onSubmit={handleCustomerLogin} className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <User className="w-4 h-4 text-red-500" />
                <span>Sign in as Patient or Attendant</span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono">Demo: Pre-filled</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Patient / Caller Name
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-red-500 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Contact Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-red-500 rounded-xl text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-sm shadow-xl shadow-red-600/30 transition-all flex items-center justify-center gap-2"
            >
              <span>Enter Consumer Interface</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          /* Ambulance Driver Sign In Form */
          <form onSubmit={handleDriverLogin} className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-blue-500" />
                <span>Sign in as Ambulance Pilot</span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono">Demo: Unit 102</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Select Ambulance Unit
              </label>
              <select
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="AMB-102">AMB-102 • ALS Cardiac Unit (Pilot: Rajesh Shinde)</option>
                <option value="AMB-205">AMB-205 • Trauma Unit (Pilot: Amit Deshmukh)</option>
                <option value="AMB-309">AMB-309 • BLS Rapid Unit (Pilot: Suresh Patil)</option>
                <option value="AMB-412">AMB-412 • Mobile ICU (Pilot: Vikas Kadam)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                EMS Pilot Security PIN
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={driverPin}
                  onChange={(e) => setDriverPin(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
            >
              <span>Enter Driver Cockpit Panel</span>
              <Navigation className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Quick QR Access Callout */}
        <div 
          onClick={() => navigate('/qr-emergency')}
          className="cursor-pointer bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 flex items-center justify-between text-xs transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-600/20 text-red-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <span className="text-white font-bold block">Standing next to an ambulance right now?</span>
              <span className="text-slate-400 text-[11px]">Scan vehicle QR decal for instant zero-registration booking</span>
            </div>
          </div>
          <span className="text-red-400 font-bold flex items-center gap-1">
            <span>Scan QR</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>

      </div>
    </div>
  );
};

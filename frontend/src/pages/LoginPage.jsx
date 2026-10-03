import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmergency } from '../context/EmergencyContext';
import { 
  User, 
  Truck, 
  QrCode, 
  ArrowRight, 
  ShieldCheck, 
  Lock,
  Phone,
  KeyRound
} from 'lucide-react';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { switchRole } = useEmergency();
  const [selectedRole, setSelectedRole] = useState('CUSTOMER'); // 'CUSTOMER' or 'AMBULANCE'
  const [phone, setPhone] = useState('+91 98765 43210');
  const [password, setPassword] = useState('corridorx123');

  const handleLogin = (e) => {
    e.preventDefault();
    switchRole(selectedRole);
    if (selectedRole === 'CUSTOMER') {
      navigate('/customer/request');
    } else {
      navigate('/ambulance');
    }
  };

  return (
    <div className="min-h-[82vh] bg-slate-950 flex flex-col justify-center items-center px-4 py-10">
      <div className="max-w-xl w-full space-y-6">
        
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-400 font-mono mb-2">
            <Lock className="w-3.5 h-3.5 text-red-500" />
            <span>PORTAL ACCESS</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Sign In to <span className="text-red-500">CorridorX</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Hospitals are pre-registered medical destinations. Choose your account type to proceed:
          </p>
        </div>

        {/* The 2 Role Selection Cards (Consumer vs Ambulance Driver) */}
        <div className="grid grid-cols-2 gap-3.5">
          
          {/* Option 1: Consumer / Patient */}
          <div
            onClick={() => { setSelectedRole('CUSTOMER'); setPhone('+91 98765 43210'); }}
            className={`cursor-pointer rounded-2xl p-4 sm:p-5 border transition-all flex flex-col justify-between ${
              selectedRole === 'CUSTOMER'
                ? 'bg-slate-900 border-red-500 ring-2 ring-red-500/30 shadow-xl shadow-red-500/10'
                : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800'
            }`}
          >
            <div>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${
                selectedRole === 'CUSTOMER' ? 'bg-red-600 text-white shadow-md shadow-red-600/30' : 'bg-slate-800 text-slate-400'
              }`}>
                <User className="w-6 h-6" />
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-white">Consumer / Patient</h3>
              <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                Request ambulance, pick hospital, track green corridor.
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-slate-800/80 text-[11px] font-bold text-red-400">
              {selectedRole === 'CUSTOMER' ? '● Selected Role' : 'Select'}
            </div>
          </div>

          {/* Option 2: Ambulance Driver */}
          <div
            onClick={() => { setSelectedRole('AMBULANCE'); setPhone('+91 98220 14892'); }}
            className={`cursor-pointer rounded-2xl p-4 sm:p-5 border transition-all flex flex-col justify-between ${
              selectedRole === 'AMBULANCE'
                ? 'bg-slate-900 border-blue-500 ring-2 ring-blue-500/30 shadow-xl shadow-blue-500/10'
                : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800'
            }`}
          >
            <div>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${
                selectedRole === 'AMBULANCE' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'bg-slate-800 text-slate-400'
              }`}>
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-white">Ambulance Pilot</h3>
              <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                Accept trips, navigate pre-cleared corridor signals.
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-slate-800/80 text-[11px] font-bold text-blue-400">
              {selectedRole === 'AMBULANCE' ? '● Selected Role' : 'Select'}
            </div>
          </div>

        </div>

        {/* Clean Login Form */}
        <form onSubmit={handleLogin} className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Mobile Number / Identifier
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-red-500 rounded-xl text-xs sm:text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Password (Demo: corridorx123)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-red-500 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className={`w-full py-3.5 px-4 rounded-xl font-extrabold text-xs sm:text-sm text-white flex items-center justify-center gap-2 shadow-lg transition-all ${
              selectedRole === 'CUSTOMER' ? 'bg-red-600 hover:bg-red-500 shadow-red-600/30' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30'
            }`}
          >
            <span>Continue as {selectedRole === 'CUSTOMER' ? 'Consumer' : 'Ambulance Driver'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Bystander Ambulance QR Scan */}
        <div 
          onClick={() => navigate('/qr-emergency')}
          className="cursor-pointer bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 flex items-center justify-between text-xs transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-600/20 text-red-400">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <span className="text-white font-bold block">Standing near an ambulance?</span>
              <span className="text-slate-400 text-[11px]">Instant QR scan on vehicle — no login needed</span>
            </div>
          </div>
          <span className="text-red-400 font-bold">Scan QR →</span>
        </div>

      </div>
    </div>
  );
};

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useEmergency } from '../context/EmergencyContext';
import { 
  ShieldAlert, 
  Activity, 
  Truck, 
  QrCode, 
  User, 
  PhoneCall
} from 'lucide-react';

export const Navbar = () => {
  const location = useLocation();
  const { currentUserRole, switchRole, isSimulating, etaMinutes } = useEmergency();

  const navLinks = [
    { path: '/customer/request', label: 'Book Ambulance', icon: ShieldAlert },
    { path: '/customer/emergency', label: 'Live Ride & Corridor', icon: Activity, badge: isSimulating ? 'LIVE' : null },
    { path: '/ambulance', label: 'Driver App', icon: Truck },
    { path: '/qr-emergency', label: 'Ambulance QR', icon: QrCode }
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo - Uber/Ola Clean Tech Style */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/30 group-hover:scale-105 transition-transform">
              <span className="font-black text-white text-base tracking-tight">CX</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-white group-hover:text-red-400 transition-colors">
                  CORRIDOR<span className="text-red-500">X</span>
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                  EMERGENCY
                </span>
              </div>
              <p className="text-[10px] text-slate-400 -mt-0.5">Green Wave Ambulance Mobility</p>
            </div>
          </Link>

          {/* Clean Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-slate-800 text-white border border-slate-700'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-red-400' : 'text-slate-400'}`} />
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping absolute -top-0.5 -right-0.5" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Side: Role Toggle (Consumer / Ambulance Driver) & Login */}
          <div className="flex items-center gap-3">
            
            {/* Live Corridor Status Indicator */}
            {isSimulating && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>ETA: {etaMinutes}m • Signals Green</span>
              </div>
            )}

            {/* Quick 2-Role Toggle */}
            <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-xs">
              <button
                onClick={() => switchRole('CUSTOMER')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  currentUserRole === 'CUSTOMER' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Consumer
              </button>
              <button
                onClick={() => switchRole('AMBULANCE')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  currentUserRole === 'AMBULANCE' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Driver
              </button>
            </div>

            {/* Login / Profile button */}
            <Link
              to="/login"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-slate-800 transition-colors"
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign In</span>
            </Link>

          </div>
        </div>
      </div>
    </header>
  );
};

import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEmergency } from '../context/EmergencyContext';
import { 
  ShieldAlert, 
  Activity, 
  Truck, 
  QrCode, 
  User, 
  LogOut,
  Power,
  Radio,
  Clock,
  Sparkles,
  Hospital
} from 'lucide-react';

export const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    currentUserRole, 
    loginAsCustomer, 
    loginAsDriver, 
    logout,
    userName, 
    activeDriver, 
    driverDutyStatus, 
    toggleDriverDuty,
    isSimulating,
    etaMinutes 
  } = useEmergency();

  const isDriver = currentUserRole === 'AMBULANCE';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className={`sticky top-0 z-50 border-b backdrop-blur-md transition-colors ${
      isDriver 
        ? 'bg-slate-950/95 border-blue-900/50 text-white' 
        : 'bg-slate-950/95 border-slate-800 text-white'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Portal Identity */}
          <Link to={isDriver ? '/ambulance' : '/customer/request'} className="flex items-center gap-2.5 group">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-base shadow-lg transition-transform group-hover:scale-105 ${
              isDriver 
                ? 'bg-blue-600 shadow-blue-600/30' 
                : 'bg-red-600 shadow-red-600/30'
            }`}>
              CX
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-white group-hover:text-red-400 transition-colors">
                  CORRIDOR<span className={isDriver ? 'text-blue-500' : 'text-red-500'}>X</span>
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                  isDriver 
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {isDriver ? 'PILOT COCKPIT' : 'CONSUMER APP'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 -mt-0.5">
                {isDriver ? 'Emergency Dispatch & CAD Terminal' : 'Patient Emergency Transport & Green Wave'}
              </p>
            </div>
          </Link>

          {/* Role-Specific Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            {!isDriver ? (
              /* CONSUMER NAVIGATION */
              <>
                <Link
                  to="/customer/request"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    location.pathname === '/customer/request' || location.pathname === '/customer'
                      ? 'bg-red-600/20 text-red-400 border border-red-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Request Ambulance</span>
                </Link>

                <Link
                  to="/customer/emergency"
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    location.pathname === '/customer/emergency'
                      ? 'bg-slate-800 text-white border border-slate-700'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5 text-red-400" />
                  <span>Live Ride Track</span>
                  {isSimulating && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping absolute -top-0.5 -right-0.5" />
                  )}
                </Link>

                <Link
                  to="/qr-emergency"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    location.pathname.startsWith('/qr-emergency')
                      ? 'bg-slate-800 text-white border border-slate-700'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Ambulance QR</span>
                </Link>

                <Link
                  to="/hospital"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    location.pathname === '/hospital'
                      ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Hospital className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Hospital Bay</span>
                </Link>
              </>
            ) : (
              /* DRIVER NAVIGATION */
              <>
                <Link
                  to="/ambulance"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    location.pathname === '/ambulance'
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Dispatch Cockpit</span>
                </Link>

                {/* Duty Toggle for Driver */}
                <button
                  onClick={toggleDriverDuty}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold transition-all ${
                    driverDutyStatus === 'ONLINE'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${
                    driverDutyStatus === 'ONLINE' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'
                  }`} />
                  <span>DUTY: {driverDutyStatus}</span>
                </button>
              </>
            )}
          </nav>

          {/* Right Side: User Profile & Role Switcher / Sign Out */}
          <div className="flex items-center gap-3">
            
            {/* Live Green Wave Pulse */}
            {isSimulating && (
              <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Signals Clear • ETA {etaMinutes}m</span>
              </div>
            )}

            {/* User Pill */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-white ${
                isDriver ? 'bg-blue-600' : 'bg-red-600'
              }`}>
                {isDriver ? <Truck className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
              </div>
              <div className="text-left">
                <div className="font-bold text-white leading-tight">
                  {isDriver ? activeDriver.name : userName}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {isDriver ? `${activeDriver.id} • Pilot` : 'Consumer'}
                </div>
              </div>
            </div>

            {/* Quick Portal Switcher (For judge / testing convenience) */}
            <button
              onClick={() => {
                if (isDriver) {
                  loginAsCustomer('Rahul Sharma', '+91 98765 43210');
                  navigate('/customer/request');
                } else {
                  loginAsDriver('AMB-102');
                  navigate('/ambulance');
                }
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-bold text-slate-300 hover:text-white transition-colors"
              title="Switch between Consumer and Ambulance views"
            >
              Switch to {isDriver ? 'Consumer' : 'Driver'}
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg bg-slate-900 hover:bg-red-950/50 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-500/40 transition-colors"
              title="Sign Out / Switch Account"
            >
              <LogOut className="w-4 h-4" />
            </button>

          </div>
        </div>
      </div>
    </header>
  );
};

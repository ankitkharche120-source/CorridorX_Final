import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEmergency } from '../context/EmergencyContext';
import { useLanguage } from '../context/LanguageContext';
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
  Hospital,
  Sun,
  Moon
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
    etaMinutes,
    isAuthenticated
  } = useEmergency();

  const { language, setLanguage, t } = useLanguage();

  const [isLightMode, setIsLightMode] = useState(() => {
    return localStorage.getItem('corridorx_theme') === 'light';
  });

  useEffect(() => {
    if (isLightMode) {
      document.documentElement.classList.add('light-theme');
      localStorage.setItem('corridorx_theme', 'light');
    } else {
      document.documentElement.classList.remove('light-theme');
      localStorage.setItem('corridorx_theme', 'dark');
    }
  }, [isLightMode]);

  // SECTION 4: DO NOT show authenticated navigation before login or on /login
  if (!isAuthenticated || location.pathname === '/login') {
    return null;
  }

  const isDriver = currentUserRole === 'AMBULANCE';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className={`sticky top-0 z-50 border-b  transition-colors ${
      isDriver 
        ? 'bg-slate-50 border-blue-900/50 text-slate-900' 
        : 'bg-slate-50 border-slate-200 text-slate-900'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Portal Identity */}
          <Link to={isDriver ? '/ambulance' : '/customer/request'} className="flex items-center gap-3 group">
            <img 
              src="/logo.jpg" 
              alt="CorridorX Logo" 
              className="h-10 w-auto object-contain transition-transform group-hover:scale-105 rounded-lg"
            />
            <span className="font-extrabold text-slate-900 text-xl tracking-tight hidden sm:block">
              CORRIDOR<span className="text-red-500">X</span>
            </span>
          </Link>

          {/* Role-Specific Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            {!isDriver ? (
              /* CONSUMER NAVIGATION */
              <>
                <Link
                  to="/customer"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    location.pathname === '/customer' || location.pathname === '/customer/request'
                      ? 'bg-red-600/20 text-red-400 border border-red-500/30'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Emergency Request</span>
                </Link>

                <Link
                  to="/customer/emergency"
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    location.pathname === '/customer/emergency'
                      ? 'bg-slate-100 text-slate-900 border border-slate-300'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5 text-red-400" />
                  <span>Ambulance Live Track</span>
                  {isSimulating && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping absolute -top-0.5 -right-0.5" />
                  )}
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
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>{t('nav.dispatch_cockpit')}</span>
                </Link>

                {/* Duty Toggle for Driver */}
                <button
                  onClick={toggleDriverDuty}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold transition-all ${
                    driverDutyStatus === 'ONLINE'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-slate-100 text-slate-600 border border-slate-300'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${
                    driverDutyStatus === 'ONLINE' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'
                  }`} />
                  <span>{t('nav.duty')}: {driverDutyStatus}</span>
                </button>
              </>
            )}
          </nav>

          {/* Right Side: User Profile & Role Switcher / Theme / Sign Out */}
          <div className="flex items-center gap-3">
            
            {/* Language Selector */}
            <select
              value={language}
              onChange={(e) => {
                const newLang = e.target.value;
                setLanguage(newLang);
                if (newLang === 'en') {
                  document.cookie = `googtrans=/en/en; path=/;`;
                } else {
                  document.cookie = `googtrans=/en/${newLang}; path=/;`;
                }
                window.location.reload();
              }}
              className="bg-white border border-slate-200 text-slate-700 text-[11px] font-bold rounded-lg px-2 py-1 outline-none hover:border-slate-300 transition-colors"
            >
              <option value="en">English</option>
              <option value="hi">हिंदी</option>
              <option value="mr">मराठी</option>
            </select>

            {/* Theme Toggle Button */}
            <button
              onClick={() => setIsLightMode(!isLightMode)}
              className="p-1.5 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Toggle Theme"
            >
              {isLightMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            
            {/* Live Green Wave Pulse */}
            {isSimulating && (
              <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Signals Clear • ETA {etaMinutes}m</span>
              </div>
            )}

            {/* User Pill */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-xl bg-white border border-slate-200 text-xs">
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-slate-900 ${
                isDriver ? 'bg-blue-600' : 'bg-red-600'
              }`}>
                {isDriver ? <Truck className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
              </div>
              <div className="text-left">
                <div className="font-bold text-slate-900 leading-tight">
                  {isDriver ? activeDriver.name : userName}
                </div>
                <div className="text-[10px] text-slate-600 font-mono">
                  {isDriver ? `${activeDriver.id} • Pilot` : 'Consumer'}
                </div>
              </div>
            </div>

            {/* Sign Out Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-red-950/50 text-slate-700 hover:text-red-400 border border-slate-200 hover:border-red-500/40 text-xs font-bold transition-all"
              title="Sign Out to Login Page"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t('nav.sign_out')}</span>
            </button>

          </div>
        </div>
      </div>
    </header>
  );
};



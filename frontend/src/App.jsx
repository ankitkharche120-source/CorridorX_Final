import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { EmergencyProvider } from './context/EmergencyContext';
import { LanguageProvider } from './context/LanguageContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ChatbotHelper } from './components/ChatbotHelper';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { CustomerDashboard } from './pages/CustomerDashboard';
import { EmergencyRequestPage } from './pages/EmergencyRequestPage';
import { AvailableAmbulancesPage } from './pages/AvailableAmbulancesPage';
import { HospitalSelectionPage } from './pages/HospitalSelectionPage';
import { ActiveEmergencyPage } from './pages/ActiveEmergencyPage';
import { AmbulanceOperatorDashboard } from './pages/AmbulanceOperatorDashboard';
import { HospitalDashboardPage } from './pages/HospitalDashboardPage';
import { QREmergencyPage } from './pages/QREmergencyPage';

import { ControlCenterPage } from './pages/ControlCenterPage';
import { useEmergency } from './context/EmergencyContext';

// Protected Route Wrapper ensuring unauthenticated visitors go to /login first
function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, currentUserRole } = useEmergency();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Removing strict role redirection so demo users can freely click between 
  // Customer and Driver dashboards in the same tab to see the shared simulation state!
  return children;
}

// Root Route Redirector
function RootRoute() {
  const { isAuthenticated, currentUserRole } = useEmergency();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (currentUserRole === 'AMBULANCE') return <Navigate to="/ambulance" replace />;
  if (currentUserRole === 'HOSPITAL') return <Navigate to="/hospital" replace />;
  if (currentUserRole === 'CONTROL_CENTER') return <Navigate to="/control-center" replace />;
  return <Navigate to="/customer" replace />;
}

export function App() {
  return (
    <LanguageProvider>
      <EmergencyProvider>
        <Router>
          <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-red-500 selection:text-white">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              {/* Root opens login page first if not authenticated */}
              <Route path="/" element={<RootRoute />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/landing" element={<LandingPage />} />

              {/* Customer Routes (Protected) */}
              <Route path="/customer" element={
                <ProtectedRoute allowedRoles={['CUSTOMER']}>
                  <CustomerDashboard />
                </ProtectedRoute>
              } />
              <Route path="/customer/request" element={
                <ProtectedRoute allowedRoles={['CUSTOMER']}>
                  <EmergencyRequestPage />
                </ProtectedRoute>
              } />
              <Route path="/customer/ambulances" element={
                <ProtectedRoute allowedRoles={['CUSTOMER']}>
                  <AvailableAmbulancesPage />
                </ProtectedRoute>
              } />
              <Route path="/customer/hospitals" element={
                <ProtectedRoute allowedRoles={['CUSTOMER']}>
                  <HospitalSelectionPage />
                </ProtectedRoute>
              } />
              <Route path="/customer/emergency" element={
                <ProtectedRoute allowedRoles={['CUSTOMER']}>
                  <ActiveEmergencyPage />
                </ProtectedRoute>
              } />

              {/* Ambulance Pilot Cockpit (Protected) */}
              <Route path="/ambulance" element={
                <ProtectedRoute allowedRoles={['AMBULANCE']}>
                  <AmbulanceOperatorDashboard />
                </ProtectedRoute>
              } />

              {/* Hospital Trauma Intake (Protected) */}
              <Route path="/hospital" element={
                <ProtectedRoute allowedRoles={['HOSPITAL']}>
                  <HospitalDashboardPage />
                </ProtectedRoute>
              } />

              {/* Control Center Dashboard (Protected) */}
              <Route path="/control-center" element={
                <ProtectedRoute allowedRoles={['CONTROL_CENTER']}>
                  <ControlCenterPage />
                </ProtectedRoute>
              } />

              {/* QR Emergency Access (Public emergency QR scan on ambulance side) */}
              <Route path="/qr-emergency" element={<QREmergencyPage />} />
              <Route path="/qr-emergency/:ambulanceId" element={<QREmergencyPage />} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <ChatbotHelper />
          <Footer />
        </div>
      </Router>
    </EmergencyProvider>
    </LanguageProvider>
  );
}

export default App;



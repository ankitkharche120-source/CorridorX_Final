import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { EmergencyProvider } from './context/EmergencyContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

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

export function App() {
  return (
    <EmergencyProvider>
      <Router>
        <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-red-500 selection:text-white">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/customer" element={<CustomerDashboard />} />
              <Route path="/customer/request" element={<EmergencyRequestPage />} />
              <Route path="/customer/ambulances" element={<AvailableAmbulancesPage />} />
              <Route path="/customer/hospitals" element={<HospitalSelectionPage />} />
              <Route path="/customer/emergency" element={<ActiveEmergencyPage />} />
              <Route path="/ambulance" element={<AmbulanceOperatorDashboard />} />
              <Route path="/hospital" element={<HospitalDashboardPage />} />
              <Route path="/qr-emergency" element={<QREmergencyPage />} />
              <Route path="/qr-emergency/:ambulanceId" element={<QREmergencyPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </EmergencyProvider>
  );
}

export default App;

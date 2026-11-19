import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { I18nProvider } from './i18n/i18nContext';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { Header } from './components/Header';
import { LandingPage } from './pages/LandingPage';
import { DelegatePortal } from './pages/DelegatePortal';
import { AdminWorkbench } from './pages/AdminWorkbench';
import { CSVImporter } from './pages/CSVImporter';
import { LoginPage } from './pages/LoginPage';
import { VolunteerDesk } from './pages/VolunteerDesk';

export const App: React.FC = () => {
  return (
    <I18nProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-surface flex flex-col">
            <Header />
            <main className="flex-1 pb-16">
              <Routes>
                {/* Public Delegate Routes (No login required - FR-AUTH-3) */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/d/:token" element={<DelegatePortal />} />
                <Route path="/login" element={<LoginPage />} />

                {/* Protected Staff / Admin Routes (Supabase Auth - FR-AUTH-1, FR-AUTH-2) */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'district']}>
                      <AdminWorkbench />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/volunteer"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'district', 'volunteer']}>
                      <VolunteerDesk />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/import"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <CSVImporter />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </I18nProvider>
  );
};

export default App;

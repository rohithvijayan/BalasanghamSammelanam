import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { I18nProvider } from './i18n/i18nContext';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { Header } from './components/Header';
import { InstallAppBanner } from './components/InstallAppBanner';

// Route-level code splitting (cuts initial JS download by >70% for mobile delegates)
const LandingPage = lazy(() => import('./pages/LandingPage').then((m) => ({ default: m.LandingPage })));
const DelegatePortal = lazy(() => import('./pages/DelegatePortal').then((m) => ({ default: m.DelegatePortal })));
const AdminWorkbench = lazy(() => import('./pages/AdminWorkbench').then((m) => ({ default: m.AdminWorkbench })));
const CSVImporter = lazy(() => import('./pages/CSVImporter').then((m) => ({ default: m.CSVImporter })));
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const VolunteerDesk = lazy(() => import('./pages/VolunteerDesk').then((m) => ({ default: m.VolunteerDesk })));

export const App: React.FC = () => {
  return (
    <I18nProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-surface flex flex-col">
            <Header />
            <main className="flex-1 pb-16">
              <Suspense
                fallback={
                  <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 gap-3">
                    <div className="w-9 h-9 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                }
              >
                <Routes>
                  {/* Public Delegate Routes (No login required - FR-AUTH-3) */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/d/:token" element={<DelegatePortal />} />
                  <Route path="/stay/:token" element={<DelegatePortal />} />
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
              </Suspense>
            </main>
            <InstallAppBanner />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </I18nProvider>
  );
};

export default App;

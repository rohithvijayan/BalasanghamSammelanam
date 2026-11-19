import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { UserRole } from '../types';
import { ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles = ['admin'],
}) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 gap-3">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs font-bold text-slate-500">ലോഗിൻ പരിശോധിക്കുന്നു...</span>
      </div>
    );
  }

  // Not logged in -> Redirect to /login
  if (!isAuthenticated || !user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // Role check
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-red-200 text-center flex flex-col items-center gap-4 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-malayalam-bold text-slate-900">
          അനുമതിയില്ല (Access Denied)
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          ഈ പേജ് ഉപയോഗിക്കാൻ അഡ്മിൻ അനുമതി ആവശ്യമാണ്. നിങ്ങളുടെ റോൾ: <strong>{user.role}</strong>.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

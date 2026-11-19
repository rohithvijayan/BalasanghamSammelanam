import React from 'react';
import { useI18n } from '../i18n/i18nContext';
import { useAuth } from '../auth/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { Users, Upload, Home, LogOut, Shield, LogIn, UserCheck } from 'lucide-react';

export const Header: React.FC = () => {
  const { language, setLanguage, t } = useI18n();
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-surface-border shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Left: Branding */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-white p-0.5 border border-slate-100 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform overflow-hidden">
            <img src="/images/logo.png" alt="Balasangham Logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              {t('app_name')}
            </span>
            <span className="text-sm font-extrabold text-slate-900 leading-tight">
              {t('app_subtitle')}
            </span>
          </div>
        </Link>

        {/* Center / Navigation Links (Dynamically unlocked based on authenticated role) */}
        {isAuthenticated && user && (
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                location.pathname === '/' ? 'bg-white text-primary shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>ഹോം (Home)</span>
            </Link>

            {/* Admin or District role: Workbench */}
            {(user.role === 'admin' || user.role === 'district') && (
              <Link
                to="/admin"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  location.pathname.startsWith('/admin') ? 'bg-white text-primary shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>
                  {user.role === 'district'
                    ? `${user.district_name || 'ജില്ലാ'} വർക്ക് ബെഞ്ച്`
                    : t('admin_workbench')}
                </span>
              </Link>
            )}

            {/* Volunteer Desk (Unlocked for Volunteer, District, and Admin) */}
            <Link
              to="/volunteer"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                location.pathname.startsWith('/volunteer') ? 'bg-white text-primary shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>വളണ്ടിയർ ഡെസ്ക് (Volunteer)</span>
            </Link>

            {/* Admin only: CSV Data Import */}
            {user.role === 'admin' && (
              <Link
                to="/import"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  location.pathname === '/import' ? 'bg-white text-primary shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{t('import_csv')}</span>
              </Link>
            )}
          </nav>
        )}

        {/* Right: Controls, Login Button / Staff Profile & Language Toggle */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* If NOT logged in: Show prominent Login button */}
          {!isAuthenticated ? (
            <Link
              to="/login"
              className="touch-target px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
            >
              <LogIn className="w-3.5 h-3.5 text-primary-300" />
              <span>ലോഗിൻ (Login)</span>
            </Link>
          ) : (
            /* Staff Profile Pill (Showing User Email & Role) & Logout */
            user && (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="flex items-center gap-2 px-2.5 py-1 sm:px-3 sm:py-1 rounded-xl bg-slate-100/90 border border-slate-200 shadow-2xs">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <div className="flex flex-col text-left">
                    <span
                      title={user.email}
                      className="text-xs font-bold text-slate-900 leading-tight max-w-[130px] sm:max-w-[180px] md:max-w-[220px] truncate"
                    >
                      {user.email}
                    </span>
                    <span className="text-[10px] text-primary font-bold leading-none mt-0.5">
                      {user.role === 'admin'
                        ? 'സംസ്ഥാന അഡ്മിൻ'
                        : user.role === 'district'
                        ? `${user.district_name || 'ജില്ലാ'} കൺവീനർ`
                        : 'വളണ്ടിയർ'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => logout()}
                  title="Logout (ലോഗ് ഔട്ട്)"
                  className="touch-target p-1.5 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors border border-slate-200"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )
          )}

          {/* Bilingual Language Switcher Pill */}
          <div className="inline-flex rounded-full bg-slate-100 p-0.5 border border-slate-200 shadow-inner">
            <button
              onClick={() => setLanguage('ml')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                language === 'ml'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              മലയാളം
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                language === 'en'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              English
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

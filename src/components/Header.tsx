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
      <div className="max-w-7xl mx-auto px-2 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-4 w-full">
        {/* Left: Branding */}
        <Link to="/" className="flex items-center gap-1.5 sm:gap-2.5 group shrink min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-xl bg-white p-0.5 border border-slate-100 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform overflow-hidden shrink-0">
            <img src="/images/logo.png" alt="Balasangham Logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-primary truncate leading-tight">
              {t('app_name')}
            </span>
            <span className="text-[11px] sm:text-sm font-extrabold text-slate-900 leading-tight truncate">
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
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* If NOT logged in: Show prominent Login button */}
          {!isAuthenticated ? (
            <Link
              to="/login"
              className="touch-target px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
            >
              <LogIn className="w-3.5 h-3.5 text-primary-300" />
              <span>
                <span className="sm:hidden">ലോഗിൻ</span>
                <span className="hidden sm:inline">ലോഗിൻ (Login)</span>
              </span>
            </Link>
          ) : (
            /* Staff Profile Pill (Showing User Email & Role) & Logout */
            user && (
              <div className="flex items-center gap-1 sm:gap-1.5">
                <div
                  title={`${user.email}${user.role ? ` (${user.role})` : ''}`}
                  className="flex items-center gap-1.5 px-1.5 py-0.5 sm:px-3 sm:py-1 rounded-xl bg-slate-100/90 border border-slate-200 shadow-2xs max-w-[80px] min-[380px]:max-w-[110px] min-[420px]:max-w-[140px] sm:max-w-[180px] md:max-w-[220px]"
                >
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <div className="flex flex-col text-left min-w-0">
                    <span className="text-[11px] sm:text-xs font-bold text-slate-900 leading-tight truncate block">
                      {user.email}
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-primary font-bold leading-none mt-0.5 truncate hidden sm:block">
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
                  aria-label="Logout"
                  className="p-1 sm:p-1.5 rounded-lg sm:rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors border border-slate-200 shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            )
          )}

          {/* Bilingual Language Switcher Pill */}
          <div className="inline-flex rounded-full bg-slate-100 p-0.5 border border-slate-200 shadow-inner shrink-0">
            <button
              onClick={() => setLanguage('ml')}
              aria-label="മലയാളം"
              title="മലയാളം"
              className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold transition-all ${
                language === 'ml'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="sm:hidden">മല</span>
              <span className="hidden sm:inline">മലയാളം</span>
            </button>
            <button
              onClick={() => setLanguage('en')}
              aria-label="English"
              title="English"
              className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold transition-all ${
                language === 'en'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="sm:hidden">EN</span>
              <span className="hidden sm:inline">English</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

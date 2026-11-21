import React, { useState, useEffect } from 'react';
import { useI18n } from '../i18n/i18nContext';
import { useAuth } from '../auth/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { Users, Upload, Home, LogOut, Shield, LogIn, UserCheck, Menu, X, HelpCircle, User } from 'lucide-react';
import { InteractiveGuideModal } from './InteractiveGuideModal';
import { UserProfileModal } from './UserProfileModal';

export const Header: React.FC = () => {
  const { language, setLanguage, t } = useI18n();
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Close mobile drawer on route navigation
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-surface-border shadow-xs">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-4 lg:gap-6 w-full">
        {/* Left: Branding */}
        <Link to="/" className="flex items-center gap-1.5 sm:gap-2.5 group shrink min-w-0 md:min-w-fit">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white p-0.5 border border-slate-100 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform overflow-hidden shrink-0">
            <img src="/images/logo.webp" alt="Balasangham Logo" width="40" height="40" className="w-full h-full object-contain" />
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

        {/* Center / Desktop Navigation Links (Dynamically unlocked based on authenticated role) */}
        {isAuthenticated && user && (
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/60 shadow-2xs">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-colors ${
                location.pathname === '/' ? 'bg-white text-primary shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>{language === 'ml' ? 'ഹോം' : 'Home'}</span>
            </Link>

            {/* Admin or District role: Workbench */}
            {(user.role === 'admin' || user.role === 'district') && (
              <Link
                to="/admin"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-colors ${
                  location.pathname.startsWith('/admin') ? 'bg-white text-primary shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>
                  {user.role === 'district'
                    ? (language === 'ml' ? `${user.district_name || 'ജില്ലാ'} വർക്ക് ബെഞ്ച്` : `${user.district_name || 'District'} Workbench`)
                    : t('admin_workbench')}
                </span>
              </Link>
            )}

            {/* Volunteer Desk (Unlocked for Volunteer, District, and Admin) */}
            <Link
              to="/volunteer"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-colors ${
                location.pathname.startsWith('/volunteer') ? 'bg-white text-primary shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>{language === 'ml' ? 'വളണ്ടിയർ ഡെസ്ക്' : 'Volunteer Desk'}</span>
            </Link>

            {/* Admin only: CSV Data Import */}
            {user.role === 'admin' && (
              <Link
                to="/import"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-colors ${
                  location.pathname === '/import' ? 'bg-white text-primary shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{language === 'ml' ? 'ഡാറ്റ ഇമ്പോർട്ട്' : 'Import Data'}</span>
              </Link>
            )}
          </nav>
        )}

        {/* Right: Controls, Login Button / Staff Profile & Language Toggle & Hamburger */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* If NOT logged in: Show Login button */}
          {!isAuthenticated ? (
            <Link
              to="/login"
              className="touch-target px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
            >
              <LogIn className="w-3.5 h-3.5 text-primary-300" />
              <span>
                <span className="sm:hidden">{language === 'ml' ? 'ലോഗിൻ' : 'Login'}</span>
                <span className="hidden sm:inline">{language === 'ml' ? 'ലോഗിൻ (Login)' : 'Login'}</span>
              </span>
            </Link>
          ) : (
            /* Staff Profile Pill (Showing User Email & Role) & Desktop Logout */
            user && (
              <div className="flex items-center gap-1 sm:gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(true)}
                  title={`${user.full_name || user.email} (${user.role}) - ${language === 'ml' ? 'പ്രൊഫൈൽ മാറ്റാൻ ക്ലിക്ക് ചെയ്യുക' : 'Click to edit profile'}`}
                  className="flex items-center gap-1.5 px-1.5 py-0.5 sm:px-3 sm:py-1 rounded-xl bg-slate-100/90 hover:bg-slate-200/90 border border-slate-200 shadow-2xs max-w-[75px] min-[380px]:max-w-[105px] min-[420px]:max-w-[140px] sm:max-w-[220px] text-left transition-colors cursor-pointer group"
                >
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <div className="flex flex-col text-left min-w-0">
                    <span className="text-[11px] sm:text-xs font-bold text-slate-900 leading-tight truncate block group-hover:text-primary transition-colors">
                      {user.email}
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-primary font-bold leading-none mt-0.5 truncate hidden sm:block">
                      {user.role === 'admin'
                        ? (language === 'ml' ? 'സംസ്ഥാന അഡ്മിൻ' : 'State Admin')
                        : user.role === 'district'
                        ? (language === 'ml' ? `${user.district_name || 'ജില്ലാ'} കൺവീനർ` : `${user.district_name || 'District'} Convener`)
                        : (language === 'ml' ? 'വളണ്ടിയർ' : 'Volunteer')}
                    </span>
                  </div>
                </button>
                <button
                  onClick={() => logout()}
                  title="Logout"
                  aria-label="Logout"
                  className="hidden sm:flex p-1 sm:p-1.5 rounded-lg sm:rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors border border-slate-200 shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            )
          )}

          {/* How to Use Guide Trigger Button */}
          <button
            type="button"
            onClick={() => setIsGuideOpen(true)}
            title={language === 'ml' ? 'ഉപയോഗ ഗൈഡ് കാണുക (How to Use)' : 'How to Use Guide'}
            aria-label="How to Use Guide"
            className="touch-target px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-[11px] sm:text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-transform active:scale-95 shrink-0"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span className="hidden sm:inline">{language === 'ml' ? 'ഗൈഡ്' : 'Guide'}</span>
          </button>

          {/* Bilingual Language Switcher Pill */}
          <div className="inline-flex rounded-full bg-slate-100 p-0.5 border border-slate-200 shadow-inner shrink-0">
            <button
              onClick={() => setLanguage('ml')}
              aria-label="മലയാളം"
              title="മലയാളം"
              className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold transition-all ${
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
              className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold transition-all ${
                language === 'en'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="sm:hidden">EN</span>
              <span className="hidden sm:inline">English</span>
            </button>
          </div>

          {/* Mobile Hamburger Toggle Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
            className="md:hidden p-1.5 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200 shrink-0 flex items-center justify-center"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-slate-900" />
            ) : (
              <Menu className="w-5 h-5 text-slate-900" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer / Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white/98 backdrop-blur-md px-4 py-3.5 shadow-xl flex flex-col gap-2.5 animate-in slide-in-from-top-2 duration-150">
          {/* User Profile Card inside Mobile Menu */}
          {isAuthenticated && user && (
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 mb-1">
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsProfileModalOpen(true);
                }}
                className="flex items-center gap-2.5 min-w-0 text-left hover:opacity-80 transition-opacity cursor-pointer"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-slate-900 truncate">
                    {user.email}
                  </span>
                  <span className="text-[10px] text-primary font-bold">
                    {user.role === 'admin'
                      ? (language === 'ml' ? 'സംസ്ഥാന അഡ്മിൻ (State Admin)' : 'State Admin')
                      : user.role === 'district'
                      ? (language === 'ml' ? `${user.district_name || 'ജില്ലാ'} കൺവീനർ` : `${user.district_name || 'District'} Convener`)
                      : (language === 'ml' ? 'ഹെൽപ്പ് ഡെസ്ക് വളണ്ടിയർ' : 'Volunteer')}
                  </span>
                </div>
              </button>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  logout();
                }}
                className="px-2.5 py-1.5 rounded-xl text-red-600 bg-red-50 hover:bg-red-100 text-xs font-bold flex items-center gap-1 border border-red-200 transition-colors shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{language === 'ml' ? 'ലോഗ്ഔട്ട്' : 'Logout'}</span>
              </button>
            </div>
          )}

          {/* Navigation Links for Mobile */}
          <div className="flex flex-col gap-1.5">
            {/* Home Portal Link */}
            <Link
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                location.pathname === '/'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <Home className="w-4 h-4 shrink-0" />
                <span>{language === 'ml' ? 'ഹോം (Home Portal)' : 'Home Portal'}</span>
              </div>
              {location.pathname === '/' && (
                <span className="text-[10px] opacity-80 bg-white/20 px-2 py-0.5 rounded-full font-normal">
                  {language === 'ml' ? 'നിലവിൽ ഇവിടെയാണ്' : 'Active'}
                </span>
              )}
            </Link>

            {/* Admin or District Workbench Link */}
            {isAuthenticated && user && (user.role === 'admin' || user.role === 'district') && (
              <Link
                to="/admin"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                  location.pathname.startsWith('/admin')
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 shrink-0" />
                  <span>
                    {user.role === 'district'
                      ? (language === 'ml' ? `${user.district_name || 'ജില്ലാ'} വർക്ക് ബെഞ്ച്` : `${user.district_name || 'District'} Workbench`)
                      : (language === 'ml' ? 'അഡ്മിൻ വർക്ക് ബെഞ്ച്' : 'Admin Workbench')}
                  </span>
                </div>
                {location.pathname.startsWith('/admin') && (
                  <span className="text-[10px] opacity-80 bg-white/20 px-2 py-0.5 rounded-full font-normal">
                    {language === 'ml' ? 'നിലവിൽ ഇവിടെയാണ്' : 'Active'}
                  </span>
                )}
              </Link>
            )}

            {/* Volunteer Help Desk Link */}
            {isAuthenticated && user && (
              <Link
                to="/volunteer"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                  location.pathname.startsWith('/volunteer')
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <UserCheck className="w-4 h-4 shrink-0" />
                  <span>{language === 'ml' ? 'വളണ്ടിയർ ഹെൽപ്പ് ഡെസ്ക്' : 'Volunteer Help Desk'}</span>
                </div>
                {location.pathname.startsWith('/volunteer') && (
                  <span className="text-[10px] opacity-80 bg-white/20 px-2 py-0.5 rounded-full font-normal">
                    {language === 'ml' ? 'നിലവിൽ ഇവിടെയാണ്' : 'Active'}
                  </span>
                )}
              </Link>
            )}

            {/* Import CSV Data Link (Admin Only) */}
            {isAuthenticated && user && user.role === 'admin' && (
              <Link
                to="/import"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                  location.pathname === '/import'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Upload className="w-4 h-4 shrink-0" />
                  <span>{language === 'ml' ? 'ഡാറ്റ ഇമ്പോർട്ട് (Import CSV / Excel)' : 'Import Data (CSV / Excel)'}</span>
                </div>
                {location.pathname === '/import' && (
                  <span className="text-[10px] opacity-80 bg-white/20 px-2 py-0.5 rounded-full font-normal">
                    {language === 'ml' ? 'നിലവിൽ ഇവിടെയാണ്' : 'Active'}
                  </span>
                )}
              </Link>
            )}

            {/* Interactive How to Use Guide Button in Mobile Drawer */}
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsGuideOpen(true);
              }}
              className="p-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold flex items-center gap-2.5 transition-colors text-left shadow-2xs"
            >
              <HelpCircle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>{language === 'ml' ? 'എങ്ങനെ ഉപയോഗിക്കാം (How to Use Guide)' : 'How to Use Guide (Quest)'}</span>
            </button>

            {/* If Not Authenticated, show Login option */}
            {!isAuthenticated && (
              <Link
                to="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors"
              >
                <LogIn className="w-4 h-4 text-primary-300" />
                <span>{language === 'ml' ? 'സ്റ്റാഫ് ലോഗിൻ (Staff Login)' : 'Staff Login'}</span>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Interactive Walkthrough / Guide Modal */}
      <InteractiveGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />

      {/* Staff & Volunteer Profile Modal */}
      <UserProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
    </header>
  );
};

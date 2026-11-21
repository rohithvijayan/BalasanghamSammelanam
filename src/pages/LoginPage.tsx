import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n/i18nContext';
import { Lock, Mail, ArrowRight, AlertCircle, Phone, KeyRound, UserCheck, Shield } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, loginWithVolunteerPhone } = useAuth();
  const { language } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const rawRedirect = searchParams.get('redirect') || '';
  // SECURITY FIX: Prevent Open Redirects by strictly validating relative internal path
  const redirectUrl = (rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') && !rawRedirect.includes(':'))
    ? rawRedirect
    : '';

  // Mode: 'volunteer' for phone + PIN login, 'admin' for official email + password
  const [authMode, setAuthMode] = useState<'volunteer' | 'admin'>('volunteer');

  // Volunteer form state
  const [volunteerPhone, setVolunteerPhone] = useState('');
  const [volunteerPin, setVolunteerPin] = useState('');

  // Admin form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVolunteerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await loginWithVolunteerPhone(volunteerPhone, volunteerPin);
    setLoading(false);

    if (result.success) {
      const target = redirectUrl && redirectUrl !== '/admin' ? redirectUrl : '/volunteer';
      navigate(target, { replace: true });
    } else {
      setError(result.error || (language === 'ml' ? 'ലോഗിൻ പരാജയപ്പെട്ടു' : 'Login failed'));
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      const target = redirectUrl || '/admin';
      navigate(target, { replace: true });
    } else {
      setError(result.error || (language === 'ml' ? 'ലോഗിൻ പരാജയപ്പെട്ടു' : 'Login failed'));
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-lg flex flex-col gap-6 relative overflow-hidden">
        {/* Brand Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-accent to-primary" />

        {/* Heading & Logo */}
        <div className="flex flex-col items-center text-center gap-2 pt-2">
          <div className="w-16 h-16 rounded-2xl bg-white border border-slate-100 p-1 shadow-sm flex items-center justify-center">
            <img src="/images/logo.webp" alt="Balasangham Logo" width="64" height="64" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-xl sm:text-2xl font-malayalam-bold text-slate-900 mt-1">
            {language === 'ml' ? 'പോർട്ടൽ പ്രവേശനം (Portal Login)' : 'Staff & Volunteer Sign In'}
          </h1>
          <p className="text-xs text-slate-500">
            {language === 'ml'
              ? 'ബാലസംഘം സംസ്ഥാന സമ്മേളനം • ഹെൽപ്പ് ഡെസ്ക് & അഡ്മിൻ പാനൽ'
              : 'Balasangham State Conference • Helpdesk & Admin Portal'}
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200/70">
          <button
            type="button"
            onClick={() => {
              setAuthMode('volunteer');
              setError(null);
            }}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
              authMode === 'volunteer'
                ? 'bg-white text-primary shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-4 h-4 shrink-0" />
            <span>{language === 'ml' ? 'വളണ്ടിയർ' : 'Volunteer'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('admin');
              setError(null);
            }}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
              authMode === 'admin'
                ? 'bg-white text-primary shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-4 h-4 shrink-0" />
            <span>{language === 'ml' ? 'അഡ്മിൻ / ഭാരവാഹി' : 'Admin'}</span>
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Volunteer Phone + PIN Form */}
        {authMode === 'volunteer' ? (
          <form onSubmit={handleVolunteerSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">
                {language === 'ml' ? 'രജിസ്റ്റർ ചെയ്ത മൊബൈൽ നമ്പർ (Mobile Number)' : 'Registered Mobile Number'}
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  required
                  value={volunteerPhone}
                  onChange={(e) => setVolunteerPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <span className="text-[11px] text-slate-400">
                {language === 'ml' ? 'അഡ്മിൻ രജിസ്റ്റർ ചെയ്ത 10 അക്ക മൊബൈൽ നമ്പർ' : 'Enter 10-digit mobile number registered by Admin'}
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">
                {language === 'ml' ? 'സമ്മേളന പിൻ (Conference PIN)' : 'Conference PIN'}
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={volunteerPin}
                  onChange={(e) => setVolunteerPin(e.target.value)}
                  placeholder="••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary tracking-widest"
                />
              </div>
              <span className="text-[11px] text-slate-400">
                {language === 'ml' ? 'സംഘാടക സമിതി നൽകിയ കോൺഫറൻസ് പിൻ നൽകുക' : 'Enter the shared PIN given by organizing committee'}
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="touch-target mt-2 w-full py-3 rounded-xl bg-primary hover:bg-primary-600 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <span>{language === 'ml' ? 'വളണ്ടിയർ പോർട്ടൽ തുറക്കുക' : 'Enter Volunteer Portal'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* Admin / Coordinator Email + Password Form */
          <form onSubmit={handleAdminSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">
                {language === 'ml' ? 'ഇമെയിൽ വിലാസം (Email)' : 'Email Address'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@balasangham.in"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">
                {language === 'ml' ? 'പാസ്‌വേഡ് (Password)' : 'Password'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="touch-target mt-2 w-full py-3 rounded-xl bg-primary hover:bg-primary-600 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <span>{language === 'ml' ? 'അഡ്മിൻ ലോഗിൻ (Sign In)' : 'Sign In as Admin'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer note for staff support */}
        <div className="pt-2 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400">
            {language === 'ml'
              ? 'ലോഗിൻ ചെയ്യാൻ ബുദ്ധിമുട്ടുണ്ടെങ്കിൽ സ്വാഗതസംഘം കൺട്രോൾ റൂമുമായി ബന്ധപ്പെടുക.'
              : 'For help with credentials, contact the Reception Committee Control Room.'}
          </p>
        </div>
      </div>
    </div>
  );
};

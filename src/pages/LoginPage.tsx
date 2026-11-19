import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n/i18nContext';
import { Lock, Mail, ArrowRight, AlertCircle, KeyRound, Shield } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const redirectUrl = searchParams.get('redirect') || '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      // Direct user based on their unlocked role
      const saved = localStorage.getItem('sammelanam_staff_session');
      let targetPath = redirectUrl;
      if (saved) {
        try {
          const profile = JSON.parse(saved);
          if (profile.role === 'volunteer' && (redirectUrl === '/admin' || !searchParams.get('redirect'))) {
            targetPath = '/volunteer';
          }
        } catch (e) {
          console.warn(e);
        }
      }
      navigate(targetPath, { replace: true });
    } else {
      setError(result.error || 'ലോഗിൻ പരാജയപ്പെട്ടു');
    }
  };

  const handleFillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-lg flex flex-col gap-6 relative overflow-hidden">
        {/* Brand Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-accent to-primary" />

        {/* Heading & Logo */}
        <div className="flex flex-col items-center text-center gap-2 pt-2">
          <div className="w-16 h-16 rounded-2xl bg-white border border-slate-100 p-1 shadow-sm flex items-center justify-center">
            <img src="/images/logo.png" alt="Balasangham Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-xl sm:text-2xl font-malayalam-bold text-slate-900 mt-1">
            സ്റ്റാഫ് ലോഗിൻ (Staff Sign In)
          </h1>
          <p className="text-xs text-slate-500">
            ബാലസംഘം സംസ്ഥാന സമ്മേളനം • കൺട്രോൾ റൂം & അഡ്മിൻ പാനൽ
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">ഇമെയിൽ വിലാസം (Email)</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@balasangham.in"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">പാസ്‌വേഡ് (Password)</label>
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
                <span>ലോഗിൻ ചെയ്യുക (Sign In)</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Credentials Quick-Fill (3 Roles: Admin, District, Volunteer) */}
        <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <KeyRound className="w-3.5 h-3.5 text-primary" />
            ടെസ്റ്റ് ലോഗിൻ റോൾ തിരഞ്ഞെടുക്കുക (Select Role to Test):
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
            {/* 1. Admin */}
            <button
              type="button"
              onClick={() => handleFillDemo('admin@balasangham.in', 'admin123')}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-primary-50 text-slate-700 hover:text-primary border border-slate-200 text-left transition-all active:scale-98 font-medium flex flex-col justify-between"
            >
              <div>
                <div className="font-bold text-slate-900">1. അഡ്മിൻ (Admin)</div>
                <div className="text-[10px] text-primary font-mono mt-0.5">admin@balasangham.in</div>
              </div>
              <div className="text-[10px] text-slate-500 mt-1 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                മുഴുവൻ അഡ്മിൻ & CSV ഇമ്പോർട്ട്
              </div>
            </button>

            {/* 2. District Coordinator */}
            <button
              type="button"
              onClick={() => handleFillDemo('kannur@balasangham.in', 'kannur123')}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-primary-50 text-slate-700 hover:text-primary border border-slate-200 text-left transition-all active:scale-98 font-medium flex flex-col justify-between"
            >
              <div>
                <div className="font-bold text-slate-900">2. ജില്ലാ കൺവീനർ</div>
                <div className="text-[10px] text-primary font-mono mt-0.5">kannur@balasangham.in</div>
              </div>
              <div className="text-[10px] text-slate-500 mt-1 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                ജില്ലാ തല പ്രതിനിധികൾ & അലോട്ട്മെന്റ്
              </div>
            </button>

            {/* 3. Volunteer */}
            <button
              type="button"
              onClick={() => handleFillDemo('volunteer@balasangham.in', 'volunteer123')}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-primary-50 text-slate-700 hover:text-primary border border-slate-200 text-left transition-all active:scale-98 font-medium flex flex-col justify-between"
            >
              <div>
                <div className="font-bold text-slate-900">3. വളണ്ടിയർ (Volunteer)</div>
                <div className="text-[10px] text-primary font-mono mt-0.5">volunteer@balasangham.in</div>
              </div>
              <div className="text-[10px] text-slate-500 mt-1 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                ഹാജർ സ്വീകരണം & ആതിഥേയ സഹായം
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

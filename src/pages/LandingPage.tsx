import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { HeroBanner } from '../components/HeroBanner';
import { useI18n } from '../i18n/i18nContext';
import { useAuth } from '../auth/AuthContext';
import {
  MessageSquare,
  Home,
  Phone,
  HelpCircle,
  MapPin,
  CheckCircle,
  ArrowRight,
  Shield,
  Search,
  Lock
} from 'lucide-react';
import { helplinesList } from '../lib/mockData';

export const LandingPage: React.FC = () => {
  const { language, t } = useI18n();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [tokenInput, setTokenInput] = useState('');

  const handleSearch = (token: string) => {
    if (token.trim()) {
      navigate(`/d/${encodeURIComponent(token.trim())}`);
    }
  };

  return (
    <div className="w-full flex flex-col">
      {/* 1. Full-Width Hero Section with Search Bar */}
      <HeroBanner showSearch onSearch={handleSearch} />

      {/* 2. Main Page Content Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6 w-full">
        {/* If logged in: Role-Tailored Active Access Banner */}
        {isAuthenticated && user ? (
          <div className="p-4 sm:p-5 rounded-2xl bg-primary-50 border border-primary-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-primary text-white flex items-center justify-center shrink-0 shadow-xs">
                <Shield className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
                    {user.role === 'admin'
                      ? (language === 'ml' ? 'സംസ്ഥാന അഡ്മിൻ ലോഗിൻ സജീവം' : 'State Admin Session Active')
                      : user.role === 'district'
                      ? (language === 'ml' ? `${user.district_name || 'ജില്ലാ'} കോർഡിനേറ്റർ ലോഗിൻ സജീവം` : `${user.district_name || 'District'} Coordinator Active`)
                      : (language === 'ml' ? 'വളണ്ടിയർ ലോഗിൻ സജീവം' : 'Volunteer Session Active')}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    Active
                  </span>
                </div>
                <span className="text-sm sm:text-base font-bold text-slate-900 font-malayalam-bold">
                  {user.full_name}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {user.role === 'volunteer' ? (
                <Link
                  to="/volunteer"
                  className="touch-target w-full sm:w-auto px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm hover:bg-primary-600 transition-colors shrink-0"
                >
                  <span>{language === 'ml' ? 'വളണ്ടിയർ ഡെസ്ക് തുറക്കുക' : 'Open Volunteer Desk'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <Link
                  to="/admin"
                  className="touch-target w-full sm:w-auto px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm hover:bg-primary-600 transition-colors shrink-0"
                >
                  <span>
                    {user.role === 'district'
                      ? (language === 'ml' ? `${user.district_name || 'ജില്ലാ'} വർക്ക് ബെഞ്ച്` : `${user.district_name || 'District'} Workbench`)
                      : (language === 'ml' ? 'അഡ്മിൻ വർക്ക് ബെഞ്ച്' : 'Admin Workbench')}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>
        ) : (
          /* When NOT logged in: Clear Staff & Volunteer Login Card on Landing Page */
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5 text-primary-300" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-sm font-bold text-slate-900 font-malayalam-bold">
                  {language === 'ml' ? 'സംഘാടകരും വളണ്ടിയർമാരുമാണോ? (Staff & Volunteers)' : 'Staff & Volunteers Sign In'}
                </h3>
                <span className="text-xs text-slate-500">
                  {language === 'ml'
                    ? 'അഡ്മിൻ, ജില്ലാ ഭാരവാഹികൾ, ഹെൽപ്പ് ഡെസ്ക് വളണ്ടിയർമാർ എന്നിവർക്ക് ലോഗിൻ ചെയ്യാം.'
                    : 'Log in for State Admin, District Conveners, and Help Desk Volunteers.'}
                </span>
              </div>
            </div>
            <Link
              to="/login"
              className="touch-target w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98 shrink-0"
            >
              <span>{language === 'ml' ? 'ലോഗിൻ ചെയ്യുക (Sign In)' : 'Sign In'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Delegate Guide Card: How to Access Your Stay */}
        <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/80 flex flex-col gap-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 font-malayalam-bold">
                {language === 'ml' ? 'താമസ വിവരങ്ങൾ എങ്ങനെ അറിയാം?' : 'How to Access Your Accommodation Details?'}
              </h2>
              <span className="text-xs text-slate-500">
                {language === 'ml' ? 'സമ്മേളന പ്രതിനിധികൾക്കും രക്ഷിതാക്കൾക്കുമുള്ള നിർദ്ദേശങ്ങൾ' : 'Instructions for Conference Delegates and Parents'}
              </span>
            </div>
          </div>

          {/* 3 Step Guide Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Step 1 */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col gap-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                <MessageSquare className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 font-malayalam-bold">
                {language === 'ml' ? '1. വാട്ട്‌സ്ആപ്പ് ലിങ്ക്' : '1. WhatsApp Link'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {language === 'ml'
                  ? 'രജിസ്റ്റർ ചെയ്ത മൊബൈൽ നമ്പറിലേക്ക് അയച്ച വ്യക്തിഗത ലിങ്ക് വഴി ലോഗിൻ ചെയ്യാതെ തന്നെ നേരിട്ട് വിവരങ്ങൾ കാണാം.'
                  : 'Access your stay portal directly without login via the personalized link sent to your registered mobile number.'}
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col gap-2">
              <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-sm">
                <Home className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 font-malayalam-bold">
                {language === 'ml' ? '2. ആതിഥേയരും വഴിയും' : '2. Host & Route'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {language === 'ml'
                  ? 'താമസസ്ഥലത്തെ ആതിഥേയരെ ഫോണിൽ വിളിക്കാനും, ഗൂഗിൾ മാപ്പ് വഴി താമസകേന്ദ്രത്തിലേക്ക് എത്തിച്ചേരാനും സാധിക്കും.'
                  : 'Directly call your host family and navigate to the accommodation house with one click via Google Maps.'}
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col gap-2">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
                <Phone className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 font-malayalam-bold">
                {language === 'ml' ? '3. സഹായ കേന്ദ്രം' : '3. Help Desk'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {language === 'ml'
                  ? 'ലിങ്ക് ലഭിക്കാത്തവർക്കോ റൂട്ട് സംശയങ്ങൾക്കോ കൺട്രോൾ റൂം ഹെൽപ്പ് ഡെസ്കുമായി നേരിട്ട് ബന്ധപ്പെടാം.'
                  : 'If you lost your link or have any questions on the way, contact our 24/7 Control Room helpline.'}
              </p>
            </div>
          </div>
        </div>

        {/* 24/7 Helplines Section for Arriving Delegates */}
        <div className="bg-white rounded-2xl md:rounded-3xl p-6 shadow-sm border border-slate-200/80 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Phone className="w-4 h-4 fill-current" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 font-malayalam-bold">
                {language === 'ml' ? 'സഹായ ഹെൽപ്പ് ലൈൻ നമ്പറുകൾ (24/7 Helplines)' : 'Emergency Helplines (24/7)'}
              </h3>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              {language === 'ml' ? 'റൗണ്ട് ദ ക്ലോക്ക്' : '24x7 Active'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {helplinesList.map((item, idx) => (
              <a
                key={idx}
                href={`tel:${item.phone}`}
                className="touch-target p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between gap-2 transition-all active:scale-98"
              >
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-800 font-malayalam-bold">
                    {language === 'ml' ? item.title_ml : item.title_en}
                  </span>
                  <span className="text-xs font-mono font-bold text-primary">
                    {item.phone}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
                  {language === 'ml' ? 'വിളിക്കുക' : 'Call'}
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* Official Conference Organizing Committee Footer */}
        <footer className="text-center py-8 flex flex-col items-center gap-3 text-xs text-slate-400 border-t border-slate-200/60 mt-6">
          <div className="flex items-center gap-2 text-slate-700 font-bold font-malayalam-bold">
            <img src="/images/logo.webp" alt="Logo" width="24" height="24" loading="lazy" className="w-6 h-6 object-contain" />
            <span>
              {language === 'ml'
                ? 'ബാലസംഘം സംസ്ഥാന സ്വാഗതസംഘം ഓഫീസ് • നീലേശ്വരം, പാലായി'
                : 'Balasangham State Reception Committee Office • Nileshwaram, Palayi'}
            </span>
          </div>

          {/* Discreet Staff Portal link */}
          {!isAuthenticated ? (
            <Link
              to="/login"
              className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1 mt-1 opacity-70 hover:opacity-100"
            >
              <Lock className="w-3 h-3" />
              <span>{language === 'ml' ? 'സ്റ്റാഫ് പ്രവേശനം (Staff Portal)' : 'Staff Portal'}</span>
            </Link>
          ) : (
            <Link
              to="/admin"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1 mt-1"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{language === 'ml' ? 'അഡ്മിൻ വർക്ക് ബെഞ്ചിലേക്ക് പോവുക' : 'Go to Admin Workbench'}</span>
            </Link>
          )}
        </footer>
      </div>
    </div>
  );
};

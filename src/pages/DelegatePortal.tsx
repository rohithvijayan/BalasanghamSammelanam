import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/supabase';
import { StayPortalData } from '../types';
import { useI18n } from '../i18n/i18nContext';
import { HeroBanner } from '../components/HeroBanner';
import { StayCard } from '../components/StayCard';
import { VolunteerCard } from '../components/VolunteerCard';
import { HelplineSupportCard } from '../components/HelplineSupportCard';
import { AnnouncementsFeed } from '../components/AnnouncementsFeed';
import { CheckCircle2, Clock, AlertCircle, RefreshCw, Home } from 'lucide-react';

export const DelegatePortal: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { language, t } = useI18n();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<StayPortalData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('Just now');

  const loadStayData = async (delegateToken: string) => {
    setLoading(true);
    setError(null);

    // Check localStorage cache first for immediate offline render (FR-PWA-2)
    const cached = localStorage.getItem(`stay_cache_${delegateToken}`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setData(parsed);
      } catch (e) {
        console.warn('Cache parse error', e);
      }
    }

    try {
      const result = await api.getMyStay(delegateToken);
      if (result) {
        setData(result);
        localStorage.setItem(`stay_cache_${delegateToken}`, JSON.stringify(result));
        setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      } else if (!cached) {
        setError(t('error_invalid_token'));
      }
    } catch (err) {
      console.error('Error fetching stay details', err);
      if (!cached) {
        setError(t('error_invalid_token'));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadStayData(token);
    }
  }, [token]);

  if (loading && !data) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 gap-3">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm font-bold text-slate-500">താമസ വിവരങ്ങൾ ലഭ്യമാക്കുന്നു...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-white rounded-3xl border border-red-200 text-center flex flex-col items-center gap-4 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-malayalam-bold text-slate-900">
          {t('error_invalid_token')}
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          നിങ്ങളുടെ രജിസ്ട്രേഷൻ ലിങ്ക് പരിശോധിക്കുകയോ അല്ലെങ്കിൽ ഹെൽപ്പ് ഡെസ്ക് കൺട്രോൾ റൂമുമായി ബന്ധപ്പെടുകയോ ചെയ്യുക.
        </p>
        <Link
          to="/"
          className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold flex items-center gap-2 shadow-sm"
        >
          <Home className="w-3.5 h-3.5" />
          <span>തിരികെ പ്രധാന പേജിലേക്ക് (Home)</span>
        </Link>
      </div>
    );
  }

  const { delegate, house, volunteer, announcements, helplines } = data;
  const isCheckedIn = delegate.status === 'checked_in';

  return (
    <div className="w-full flex flex-col">
      {/* 1. Full-Width Hero Section */}
      <HeroBanner compact />

      {/* 2. Main Delegate Portal Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-5 w-full">
        {/* Delegate Welcome & Profile Card */}
        <div className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-sm border border-slate-200/80 flex flex-col gap-3 relative overflow-hidden -mt-8 md:-mt-12 z-20">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent-yellow to-primary" />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-xl font-black shrink-0 font-malayalam-bold">
                {delegate.full_name.charAt(0)}
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {t('delegate')}
                </span>
                <h2 className="text-xl md:text-2xl text-slate-900 font-malayalam-bold leading-tight">
                  {t('welcome_prefix')}{delegate.full_name}
                </h2>
                <span className="text-xs font-semibold text-slate-500">
                  {language === 'ml' ? delegate.district_ml : delegate.district_en} • Reg #{token?.toUpperCase().slice(-6)}
                </span>
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
                  isCheckedIn
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {isCheckedIn ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{t('checked_in')}</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>{t('pending')}</span>
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Accommodation House Card */}
        <StayCard house={house} />

        {/* 4. Volunteer Support Card */}
        <VolunteerCard volunteer={volunteer} />

        {/* 5. Emergency Helplines & Location Sharing */}
        <HelplineSupportCard token={token || ''} helplines={helplines} />

        {/* 6. Live Announcements Feed */}
        <AnnouncementsFeed announcements={announcements} />

        {/* 7. Offline PWA Status Footer */}
        <div className="p-3.5 rounded-2xl bg-slate-100/80 border border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>{t('offline_ready')} • {t('last_synced')}: {lastUpdated}</span>
          </div>
          <button
            onClick={() => token && loadStayData(token)}
            className="flex items-center gap-1 font-bold text-primary hover:underline"
          >
            <RefreshCw className="w-3 h-3" />
            <span>{t('refresh')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

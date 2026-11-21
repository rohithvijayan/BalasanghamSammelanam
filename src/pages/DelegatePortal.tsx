import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/supabase';
import { browserCache, CACHE_KEYS } from '../lib/browserCache';
import { StayPortalData } from '../types';
import { useI18n } from '../i18n/i18nContext';
import { HeroBanner } from '../components/HeroBanner';
import { StayCard } from '../components/StayCard';
import { VolunteerCard } from '../components/VolunteerCard';
import { HelplineSupportCard } from '../components/HelplineSupportCard';
import { AnnouncementsFeed } from '../components/AnnouncementsFeed';
import { CheckCircle2, Clock, AlertCircle, RefreshCw, Home, Bell, WifiOff } from 'lucide-react';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  sendBrowserNotification,
  checkAndNotifyNewAnnouncements,
} from '../lib/notifications';

export const DelegatePortal: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { language, t } = useI18n();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<StayPortalData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('Just now');
  const [knownAnnouncementIds, setKnownAnnouncementIds] = useState<Set<string>>(() => new Set());
  const [notifPermission, setNotifPermission] = useState(getNotificationPermission());
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (token) loadStayData(token, true, true);
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [token]);

  const loadStayData = async (delegateToken: string, isSilent = false, forceRefresh = false) => {
    if (!isSilent) setLoading(true);
    setError(null);

    // Check browser cache first for immediate offline render (5-hour TTL)
    const cached = browserCache.get<StayPortalData>(CACHE_KEYS.STAY_PORTAL(delegateToken));
    if (cached && !isSilent) {
      setData(cached);
      if (cached.announcements) {
        setKnownAnnouncementIds(new Set(cached.announcements.map((a: any) => a.id)));
      }
    }

    try {
      const result = await api.getMyStay(delegateToken, forceRefresh);
      if (result) {
        setData(result);
        browserCache.set(CACHE_KEYS.STAY_PORTAL(delegateToken), result);
        setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

        if (result.announcements) {
          setKnownAnnouncementIds((prev) =>
            checkAndNotifyNewAnnouncements(result.announcements, prev, language as 'ml' | 'en')
          );
        }
      } else if (!cached && !isSilent) {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          setError(
            language === 'ml'
              ? 'ഇന്റർനെറ്റ് കണക്ഷൻ ലഭ്യമല്ല. ദയവായി നെറ്റ്‌വർക്ക് പരിശോധിച്ച് വീണ്ടും ശ്രമിക്കുക.'
              : 'No internet connection. Please check your network and try again.'
          );
        } else {
          setError(t('error_invalid_token'));
        }
      }
    } catch (err) {
      console.error('Error fetching stay details', err);
      if (!cached && !isSilent) {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          setError(
            language === 'ml'
              ? 'ഇന്റർനെറ്റ് കണക്ഷൻ ലഭ്യമല്ല. ദയവായി നെറ്റ്‌വർക്ക് പരിശോധിച്ച് വീണ്ടും ശ്രമിക്കുക.'
              : 'No internet connection. Please check your network and try again.'
          );
        } else {
          setError(t('error_invalid_token'));
        }
      }
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      // Optimistically renders from local storage if available, then live-refreshes volunteer status and GPS
      loadStayData(token, false, true);

      // Auto-poll every 45s ONLY when tab is active and visible to pick up live volunteer location broadcast
      const interval = setInterval(() => {
        if (document.visibilityState === 'visible') {
          loadStayData(token, true, true);
        }
      }, 45000);

      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          loadStayData(token, true, true);
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        clearInterval(interval);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [token, language]);

  if (loading && !data) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 gap-3">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm font-bold text-slate-500">
          {language === 'ml' ? 'താമസ വിവരങ്ങൾ ലഭ്യമാക്കുന്നു...' : 'Loading stay information...'}
        </span>
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
          {language === 'ml'
            ? 'നിങ്ങളുടെ രജിസ്ട്രേഷൻ ലിങ്ക് പരിശോധിക്കുകയോ അല്ലെങ്കിൽ ഹെൽപ്പ് ഡെസ്ക് കൺട്രോൾ റൂമുമായി ബന്ധപ്പെടുകയോ ചെയ്യുക.'
            : 'Please verify your registration link or contact the help desk control room.'}
        </p>
        <Link
          to="/"
          className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold flex items-center gap-2 shadow-sm"
        >
          <Home className="w-3.5 h-3.5" />
          <span>{language === 'ml' ? 'തിരികെ പ്രധാന പേജിലേക്ക് (Home)' : 'Back to Home'}</span>
        </Link>
      </div>
    );
  }

  const { delegate, house, volunteer, announcements, helplines } = data;
  const isCheckedIn = delegate.status === 'checked_in';
  const effectiveVolunteer = volunteer || house?.volunteer || null;

  return (
    <div className="w-full flex flex-col">
      {/* 1. Full-Width Hero Section */}
      <HeroBanner compact />

      {/* Offline Status Notice Banner */}
      {!isOnline && (
        <div className="bg-amber-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 shadow-sm z-30">
          <WifiOff className="w-3.5 h-3.5 shrink-0 animate-pulse" />
          <span>
            {language === 'ml'
              ? 'ഓഫ്‌ലൈൻ മോഡ്: നെറ്റ്‌വർക്ക് കണക്ഷനില്ല. ഫോണിൽ സേവ് ചെയ്ത വിവരങ്ങൾ കാണിക്കുന്നു.'
              : 'Offline Mode: No network connection. Displaying saved stay details.'}
          </span>
        </div>
      )}

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
        <VolunteerCard volunteer={effectiveVolunteer} />

        {/* 5. Emergency Helplines & Location Sharing */}
        <HelplineSupportCard token={token || ''} helplines={helplines} />

        {/* Browser Push Notification Permission Banner */}
        {isNotificationSupported() && notifPermission !== 'granted' && (
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-amber-900 font-malayalam-bold">
                  {language === 'ml' ? 'സമ്മേളന അറിയിപ്പുകൾ തത്സമയം ലഭിക്കണോ?' : 'Get Live Conference Alerts?'}
                </h4>
                <p className="text-[11px] text-amber-700">
                  {language === 'ml'
                    ? 'ഭക്ഷണസമയം, ബസ് സർവീസ്, വേദി മാറ്റങ്ങൾ എന്നിവ ഫോണിൽ ഉടനടി അറിയാൻ നോട്ടിഫിക്കേഷൻ ഓൺ ചെയ്യുക.'
                    : 'Enable push notifications for meal timings, bus schedules, and urgent updates.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={async () => {
                const res = await requestNotificationPermission();
                setNotifPermission(res);
                if (res === 'granted') {
                  sendBrowserNotification(
                    language === 'ml' ? 'ബാലസംഘം സംസ്ഥാന സമ്മേളനം' : 'Balasangham State Conference',
                    {
                      body: language === 'ml' ? 'അറിയിപ്പുകൾ സജീവമാക്കി!' : 'Live alerts enabled successfully!',
                    }
                  );
                }
              }}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 shadow-xs transition-transform active:scale-95"
            >
              {language === 'ml' ? '🔔 നോട്ടിഫിക്കേഷൻ ഓൺ ചെയ്യുക' : '🔔 Enable Alerts'}
            </button>
          </div>
        )}

        {/* 6. Live Announcements Feed */}
        <AnnouncementsFeed announcements={announcements} />

        {/* 7. Offline PWA Status Footer */}
        <div className="p-3.5 rounded-2xl bg-slate-100/80 border border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>{t('offline_ready')} • {t('last_synced')}: {lastUpdated}</span>
          </div>
          <button
            onClick={() => token && loadStayData(token, false, true)}
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

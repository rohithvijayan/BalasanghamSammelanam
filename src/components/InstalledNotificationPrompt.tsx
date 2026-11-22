import React, { useState, useEffect } from 'react';
import { useI18n } from '../i18n/i18nContext';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  sendBrowserNotification,
} from '../lib/notifications';
import { Bell, X, CheckCircle2 } from 'lucide-react';

const NOTIF_DISMISS_KEY = 'sammelanam_installed_notif_dismissed';

export const InstalledNotificationPrompt: React.FC = () => {
  const { language } = useI18n();
  const [showPrompt, setShowPrompt] = useState(false);
  const [isEnabling, setIsEnabling] = useState(false);

  useEffect(() => {
    // 1. Check if running in standalone PWA mode (installed app)
    const isStandaloneMode =
      typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://'));

    if (!isStandaloneMode) return;

    // 2. Check notification support and permission
    if (!isNotificationSupported()) return;
    const currentPermission = getNotificationPermission();

    // If already granted or explicitly denied, do not show
    if (currentPermission !== 'default') return;

    // 3. Check if user dismissed it recently
    const dismissed = localStorage.getItem(NOTIF_DISMISS_KEY);
    if (dismissed) return;

    // Delay slightly after app launch for smooth UX transition
    const timer = setTimeout(() => {
      setShowPrompt(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleEnable = async () => {
    setIsEnabling(true);
    try {
      const res = await requestNotificationPermission();
      if (res === 'granted') {
        sendBrowserNotification(
          language === 'ml' ? 'ബാലസംഘം സംസ്ഥാന സമ്മേളനം' : 'Balasangham State Conference',
          {
            body:
              language === 'ml'
                ? '🔔 നോട്ടിഫിക്കേഷനുകൾ വിജയകരമായി ഓൺ ചെയ്തു. പ്രധാനപ്പെട്ട അറിയിപ്പുകൾ ഫോണിൽ ലഭിക്കും.'
                : '🔔 Notifications enabled successfully! You will receive live conference alerts.',
          }
        );
      }
    } finally {
      setIsEnabling(false);
      setShowPrompt(false);
      localStorage.setItem(NOTIF_DISMISS_KEY, 'true');
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem(NOTIF_DISMISS_KEY, 'true');
  };

  if (!showPrompt) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="notif-prompt-title"
      className="fixed inset-x-3 bottom-4 z-50 sm:max-w-md sm:mx-auto bg-white rounded-3xl p-4 sm:p-5 border-2 border-primary/20 shadow-2xl flex flex-col gap-3 animate-in slide-in-from-bottom duration-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0 shadow-2xs">
            <Bell className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <h3 id="notif-prompt-title" className="text-sm font-extrabold text-slate-900 leading-tight">
              {language === 'ml'
                ? 'സമ്മേളന അറിയിപ്പുകൾ ലഭിക്കാൻ'
                : 'Receive Live Conference Alerts'}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium leading-snug mt-0.5">
              {language === 'ml'
                ? 'ഭക്ഷണ സമയം, വേദി മാറ്റങ്ങൾ, നിർദ്ദേശങ്ങൾ എന്നിവ ഫോണിൽ ഉടൻ അറിയാം.'
                : 'Instant alerts for meal times, schedule changes, and announcements.'}
            </p>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={handleEnable}
          disabled={isEnabling}
          className="flex-1 py-2.5 px-4 rounded-xl bg-primary hover:bg-primary-600 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-xs transition-transform active:scale-95 disabled:opacity-50"
        >
          <Bell className="w-4 h-4" />
          <span>
            {isEnabling
              ? (language === 'ml' ? 'ഓൺ ചെയ്യുന്നു...' : 'Enabling...')
              : (language === 'ml' ? '🔔 നോട്ടിഫിക്കേഷൻ ഓൺ ചെയ്യുക' : '🔔 Allow Notifications')}
          </span>
        </button>

        <button
          onClick={handleDismiss}
          className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
        >
          {language === 'ml' ? 'പിന്നീട്' : 'Later'}
        </button>
      </div>
    </div>
  );
};

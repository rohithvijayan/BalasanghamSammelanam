import React, { useState, useEffect } from 'react';
import { useI18n } from '../i18n/i18nContext';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { InstallAppGuideModal } from './InstallAppGuideModal';
import { Smartphone, Download, X } from 'lucide-react';

const DISMISS_KEY = 'sammelanam_pwa_banner_dismissed';
const DISMISS_DURATION_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

export const InstallAppBanner: React.FC = () => {
  const { language } = useI18n();
  const {
    canInstall,
    isIOS,
    triggerInstall,
    showGuideModal,
    setShowGuideModal,
  } = usePWAInstall();

  const [isDismissed, setIsDismissed] = useState<boolean>(true);

  useEffect(() => {
    // Check if dismissed recently
    const dismissedTime = localStorage.getItem(DISMISS_KEY);
    if (dismissedTime) {
      const diff = Date.now() - parseInt(dismissedTime, 10);
      if (diff < DISMISS_DURATION_MS) {
        setIsDismissed(true);
        return;
      }
    }
    setIsDismissed(false);
  }, []);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDismissed(true);
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  };

  if (!canInstall || isDismissed) {
    return (
      <InstallAppGuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        isIOS={isIOS}
      />
    );
  }

  return (
    <>
      {/* Floating Bottom Install Banner for Mobile View */}
      <aside
        aria-label="Install Balasangham App"
        className="fixed bottom-3 left-3 right-3 z-40 sm:hidden bg-white/95 backdrop-blur-md rounded-2xl p-3 border border-slate-200/90 shadow-xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-300"
      >
        {/* App Logo & Text */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-white p-0.5 border border-slate-100 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
            <img
              src="/images/logo.webp"
              alt="Balasangham Logo"
              width="40"
              height="40"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-black text-slate-900 leading-tight truncate">
              {language === 'ml' ? 'ബാലസംഘം ആപ്പ്' : 'Balasangham App'}
            </span>
            <span className="text-[10px] text-slate-500 font-medium truncate leading-tight mt-0.5">
              {language === 'ml' ? 'ഹോം സ്ക്രീനിൽ വെക്കാം' : 'Add to home screen'}
            </span>
          </div>
        </div>

        {/* Action Button & Dismiss */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => triggerInstall()}
            className="px-3 py-1.5 rounded-xl bg-primary hover:bg-primary-600 text-white font-extrabold text-xs flex items-center gap-1 shadow-xs transition-transform active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{language === 'ml' ? 'ഇൻസ്റ്റാൾ' : 'Install'}</span>
          </button>

          <button
            onClick={handleDismiss}
            aria-label="Dismiss"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Guide Modal (For iOS Safari or browsers without native prompt) */}
      <InstallAppGuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        isIOS={isIOS}
      />
    </>
  );
};

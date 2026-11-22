import React from 'react';
import { useI18n } from '../i18n/i18nContext';
import { X, Smartphone, Share2, PlusSquare, MoreVertical, CheckCircle2 } from 'lucide-react';

interface InstallAppGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  isIOS: boolean;
}

export const InstallAppGuideModal: React.FC<InstallAppGuideModalProps> = ({
  isOpen,
  onClose,
  isIOS,
}) => {
  const { language } = useI18n();

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="install-guide-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 p-5 sm:p-6 flex flex-col gap-4 animate-in slide-in-from-bottom duration-300"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-2xs">
              <Smartphone className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 id="install-guide-title" className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">
                {language === 'ml' ? 'ഹോം സ്ക്രീനിലേക്ക് ചേർക്കുക' : 'Add to Home Screen'}
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                {language === 'ml'
                  ? 'ആപ്പ് പോലെ ഫോണിൽ വേഗത്തിൽ തുറക്കാം'
                  : 'Fast 1-tap access right from your phone'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Instructions Body */}
        {isIOS ? (
          /* iOS Safari Guide */
          <div className="flex flex-col gap-3 py-1">
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {language === 'ml'
                ? 'ഐഫോണിൽ (iPhone) ആപ്പ് ഇൻസ്റ്റാൾ ചെയ്യാൻ ഈ 2 ലളിതമായ കാര്യങ്ങൾ ചെയ്യുക:'
                : 'To install on iPhone / iPad, follow these 2 simple steps in Safari:'}
            </p>

            {/* Step 1 */}
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="w-6 h-6 rounded-full bg-primary text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                1
              </div>
              <div className="text-xs text-slate-800 leading-snug">
                <p className="font-bold">
                  {language === 'ml' ? 'ഷെയർ (Share) ചിഹ്നം അമർത്തുക:' : 'Tap the Share button:'}
                </p>
                <p className="text-slate-500 text-[11px] mt-0.5 flex items-center gap-1.5">
                  {language === 'ml'
                    ? 'Safari-യുടെ താഴെ കാണുന്ന'
                    : 'At the bottom of Safari, tap'}
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-white border border-slate-300 rounded font-bold text-slate-900">
                    <Share2 className="w-3 h-3 text-sky-600" /> Share
                  </span>
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="w-6 h-6 rounded-full bg-primary text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                2
              </div>
              <div className="text-xs text-slate-800 leading-snug">
                <p className="font-bold">
                  {language === 'ml' ? "'Add to Home Screen' തിരഞ്ഞെടുക്കുക:" : "Tap 'Add to Home Screen':"}
                </p>
                <p className="text-slate-500 text-[11px] mt-0.5 flex items-center gap-1.5 flex-wrap">
                  {language === 'ml'
                    ? 'താഴേക്ക് സ്ക്രോൾ ചെയ്ത്'
                    : 'Scroll down and tap'}
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-white border border-slate-300 rounded font-bold text-slate-900">
                    <PlusSquare className="w-3 h-3 text-slate-700" /> Add to Home Screen
                  </span>
                  {language === 'ml' ? 'അമർത്തി മുകളിൽ Add നൽകുക.' : 'then tap Add.'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Android Chrome / Generic Browser Guide */
          <div className="flex flex-col gap-3 py-1">
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {language === 'ml'
                ? 'നിങ്ങളുടെ ഫോണിൽ ആപ്പായി ചേർക്കാൻ താഴെ പറയുന്ന വഴി ഉപയോഗിക്കാം:'
                : 'To add this app to your Android home screen:'}
            </p>

            {/* Step 1 */}
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="w-6 h-6 rounded-full bg-primary text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                1
              </div>
              <div className="text-xs text-slate-800 leading-snug">
                <p className="font-bold">
                  {language === 'ml' ? 'ബ്രൗസർ മെനു തുറക്കുക:' : 'Open Browser Menu:'}
                </p>
                <p className="text-slate-500 text-[11px] mt-0.5 flex items-center gap-1.5">
                  {language === 'ml'
                    ? 'മുകളിൽ വലതുവശത്തുള്ള മൂന്ന് കുത്തുകൾ അമർത്തുക'
                    : 'Tap the 3 dots at top-right of your browser'}
                  <span className="inline-flex items-center p-0.5 bg-white border border-slate-300 rounded font-bold text-slate-900">
                    <MoreVertical className="w-3.5 h-3.5 text-slate-700" />
                  </span>
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="w-6 h-6 rounded-full bg-primary text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                2
              </div>
              <div className="text-xs text-slate-800 leading-snug">
                <p className="font-bold">
                  {language === 'ml' ? "'Install app' അല്ലെങ്കിൽ 'Add to Home screen' അമർത്തുക:" : "Tap 'Install app' or 'Add to Home screen':"}
                </p>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  {language === 'ml'
                    ? 'ആപ്പ് നിങ്ങളുടെ ഫോണിലെ ആപ്പുകൾക്കൊപ്പം ഉടൻ പ്രത്യക്ഷപ്പെടും!'
                    : 'The app icon will immediately appear on your phone home screen!'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Benefits badge */}
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-emerald-900 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold text-[11px] leading-tight">
            {language === 'ml'
              ? 'ഇന്റർനെറ്റ് കുറവുള്ളപ്പോഴും ഓഫ്‌ലൈനായും വേഗത്തിൽ വിവരങ്ങൾ ലഭ്യമാകും'
              : 'Works offline & opens instantly with 1 tap'}
          </span>
        </div>

        {/* Close / Action Button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors text-center"
        >
          {language === 'ml' ? 'മനസ്സിലായി (Got it)' : 'Got it'}
        </button>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { HelplineItem } from '../types';
import { useI18n } from '../i18n/i18nContext';
import { api } from '../lib/supabase';
import { Phone, MapPin, Check, Headphones } from 'lucide-react';

interface HelplineSupportCardProps {
  token: string;
  helplines?: HelplineItem[];
}

export const HelplineSupportCard: React.FC<HelplineSupportCardProps> = ({ token, helplines = [] }) => {
  const { language, t } = useI18n();
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const [locationSuccessMsg, setLocationSuccessMsg] = useState(false);

  const handleShareLocation = async () => {
    setIsSharingLocation(true);
    try {
      let lat = 12.2531;
      let lng = 75.1292;
      let accuracy = 25;

      if (navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
          });
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
          accuracy = pos.coords.accuracy;
        } catch (geoErr) {
          console.warn('Physical GPS unavailable, using conference Nileshwaram area fallback', geoErr);
        }
      }

      await api.shareLocation(token, lat, lng, accuracy);
      setLocationSuccessMsg(true);
      setTimeout(() => setLocationSuccessMsg(false), 5000);
    } catch (err) {
      console.error('Location share failed', err);
    } finally {
      setIsSharingLocation(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-sm border border-slate-200/80 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Headphones className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {t('safety_heading')}
          </span>
        </div>
        <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
          {language === 'ml' ? '24x7 സജീവം' : '24x7 Active'}
        </span>
      </div>

      {/* Location Shared Feedback Notification */}
      {locationSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-2 text-xs font-bold">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{t('location_shared_msg')}</span>
        </div>
      )}

      {/* 24/7 Helpline Quick-Dial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {helplines.map((item, idx) => (
          <a
            key={idx}
            href={`tel:${item.phone}`}
            className="touch-target p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 flex items-center justify-between gap-3 transition-colors group active:scale-98"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Phone className="w-4 h-4 fill-current" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-slate-800 font-malayalam-bold">
                  {language === 'ml' ? item.title_ml : item.title_en}
                </span>
                <span className="text-xs font-mono font-medium text-slate-500">
                  {item.phone}
                </span>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 shrink-0">
              {language === 'ml' ? 'വിളിക്കുക' : 'Call'}
            </span>
          </a>
        ))}
      </div>

      {/* Temporary Location Sharing (FR-LOC-1) */}
      <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-slate-800 font-malayalam-bold">
            {t('share_location')}
          </span>
          <span className="text-[11px] text-slate-400">
            {t('share_location_subtext')}
          </span>
        </div>

        <button
          onClick={handleShareLocation}
          disabled={isSharingLocation}
          className="touch-target px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shrink-0"
        >
          <MapPin className="w-3.5 h-3.5 text-primary" />
          <span>{isSharingLocation ? (language === 'ml' ? 'ഷെയർ ചെയ്യുന്നു...' : 'Sharing...') : t('share_location')}</span>
        </button>
      </div>
    </div>
  );
};

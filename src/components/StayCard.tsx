import React from 'react';
import { House } from '../types';
import { useI18n } from '../i18n/i18nContext';
import { Phone, MapPin, CheckCircle, Navigation, Droplet, Wind, ShieldCheck } from 'lucide-react';

interface StayCardProps {
  house?: House | null;
}

export const StayCard: React.FC<StayCardProps> = ({ house }) => {
  const { t } = useI18n();

  if (!house) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-amber-200 bg-amber-50/50 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
          <MapPin className="w-4 h-4 text-amber-600" />
          <span>താമസസ്ഥലം അനുവദിച്ചുവരുന്നു</span>
        </div>
        <p className="text-xs text-amber-900/80 leading-relaxed">
          നിങ്ങളുടെ താമസസ്ഥലം അഡ്മിൻ ഡെസ്ക് ക്രമീകരിച്ചു വരികയാണ്. വിശദാംശങ്ങൾ ഉടൻ ഇവിടെ അപ്‌ഡേറ്റ് ചെയ്യപ്പെടും.
        </p>
      </div>
    );
  }

  const mapLink = house.map_url || (house.lat && house.lng ? `https://www.google.com/maps/search/?api=1&query=${house.lat},${house.lng}` : null);

  return (
    <div className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-sm border border-slate-200/80 flex flex-col gap-5 relative overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <MapPin className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {t('stay_info')}
          </span>
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
          <CheckCircle className="w-3 h-3 text-emerald-600" />
          <span>{t('stay_verified')}</span>
        </span>
      </div>

      {/* House Name & Address */}
      <div className="flex flex-col gap-1.5">
        <h3 className="text-xl md:text-2xl text-slate-900 font-malayalam-bold">
          {house.name}
        </h3>
        <p className="text-xs md:text-sm text-slate-600 leading-relaxed flex items-start gap-1.5">
          <span className="shrink-0 mt-0.5 text-slate-400">📍</span>
          <span>{house.address}</span>
        </p>
      </div>

      {/* Host & Room Meta Grid */}
      <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
        <div className="flex flex-col">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            {t('host')}
          </span>
          <span className="text-sm font-bold text-slate-800 truncate mt-0.5">
            {house.host_name}
          </span>
          <span className="text-xs font-medium text-slate-500 truncate">
            {house.host_phone}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            {t('room_no')}
          </span>
          <span className="text-sm font-bold text-slate-800 truncate mt-0.5">
            മുറി 2 (1st Floor)
          </span>
          <span className="text-xs font-medium text-slate-500 truncate">
            {house.capacity} പേർക്ക് സൗകര്യം
          </span>
        </div>
      </div>

      {/* Two Large Tap-Friendly Action Buttons (Minimum 48px height) */}
      <div className="flex flex-col sm:flex-row gap-3 pt-1">
        {/* Direct Call Host Button */}
        <a
          href={`tel:${house.host_phone}`}
          className="flex-1 touch-target px-4 py-3.5 rounded-xl bg-primary hover:bg-primary-600 text-white font-bold text-sm shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 active:scale-98"
        >
          <Phone className="w-4 h-4 fill-current" />
          <span>{t('call_host')}</span>
        </a>

        {/* Google Maps Route Button */}
        {mapLink && (
          <a
            href={mapLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 touch-target px-4 py-3.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 font-bold text-sm transition-all flex items-center justify-center gap-2 active:scale-98"
          >
            <Navigation className="w-4 h-4 text-sky-600" />
            <span>{t('route_map')}</span>
          </a>
        )}
      </div>

      {/* Amenities Pill Badges */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100">
          <Droplet className="w-3.5 h-3.5 text-sky-500" />
          <span>കുടിവെള്ളം (RO)</span>
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100">
          <Wind className="w-3.5 h-3.5 text-teal-500" />
          <span>ഫാൻ & വെന്റിലേഷൻ</span>
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>ഫസ്റ്റ് എയ്ഡ് സൗകര്യം</span>
        </span>
      </div>
    </div>
  );
};

import React from 'react';
import { Volunteer } from '../types';
import { useI18n } from '../i18n/i18nContext';
import { UserCheck, Phone, Navigation, Radio } from 'lucide-react';

interface VolunteerCardProps {
  volunteer?: Volunteer | null;
}

export const VolunteerCard: React.FC<VolunteerCardProps> = ({ volunteer }) => {
  const { language, t } = useI18n();

  if (!volunteer) return null;

  const hasLiveLocation = Boolean(volunteer.active_location);

  return (
    <div className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-5 shadow-sm border border-slate-200/80 flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {t('volunteer_support')}
            </span>
            <h4 className="text-sm md:text-base font-extrabold text-slate-900 font-malayalam-bold break-words">
              {volunteer.name}
            </h4>
            <span className="text-xs text-slate-500 truncate">
              {volunteer.unit || volunteer.phone}
            </span>
          </div>
        </div>

        <a
          href={`tel:${volunteer.phone}`}
          className="touch-target px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shrink-0 shadow-sm transition-transform active:scale-95 w-full sm:w-auto"
        >
          <Phone className="w-3.5 h-3.5 fill-current" />
          <span>{t('call_volunteer')}</span>
        </a>
      </div>

      {/* Live Location Radar Banner (Visible to assigned delegate for 30 minutes) */}
      {hasLiveLocation && volunteer.active_location && (
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-200 animate-in fade-in">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative flex items-center justify-center shrink-0">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping absolute" />
              <span className="w-3 h-3 rounded-full bg-emerald-600" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5 flex-wrap">
                <span className="flex items-center gap-1">
                  <Radio className="w-3.5 h-3.5 text-emerald-700" />
                  <span>
                    {language === 'ml'
                      ? 'വളണ്ടിയറുടെ ലൈവ് ലൊക്കേഷൻ സജീവമാണ്!'
                      : 'Volunteer Live Location Active!'}
                  </span>
                </span>
                <span className="text-[10px] text-emerald-800 font-mono font-bold bg-emerald-200/70 px-1.5 py-0.2 rounded">
                  30 min
                </span>
              </span>
              <span className="text-[11px] text-emerald-800 break-words mt-0.5">
                {language === 'ml'
                  ? 'സ്റ്റേഷൻ / സ്റ്റോപ്പിലുള്ള വളണ്ടിയറെ കണ്ടെത്താൻ മാപ്പ് തുറക്കുക.'
                  : 'Follow live route to meet your squad leader at the station.'}
              </span>
            </div>
          </div>

          <a
            href={`https://maps.google.com/?q=${volunteer.active_location.lat},${volunteer.active_location.lng}`}
            target="_blank"
            rel="noreferrer"
            className="touch-target px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs shrink-0 transition-transform active:scale-95 w-full sm:w-auto"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>{language === 'ml' ? 'മാപ്പിൽ വഴി കാണുക' : 'Open in Google Maps'}</span>
          </a>
        </div>
      )}
    </div>
  );
};

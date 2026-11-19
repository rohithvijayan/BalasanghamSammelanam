import React from 'react';
import { Volunteer } from '../types';
import { useI18n } from '../i18n/i18nContext';
import { UserCheck, Phone } from 'lucide-react';

interface VolunteerCardProps {
  volunteer?: Volunteer | null;
}

export const VolunteerCard: React.FC<VolunteerCardProps> = ({ volunteer }) => {
  const { t } = useI18n();

  if (!volunteer) return null;

  return (
    <div className="bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-slate-200/80 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <UserCheck className="w-5 h-5" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {t('volunteer_support')}
          </span>
          <h4 className="text-sm md:text-base font-extrabold text-slate-900 truncate font-malayalam-bold">
            {volunteer.name}
          </h4>
          <span className="text-xs text-slate-500 truncate">
            {volunteer.unit || volunteer.phone}
          </span>
        </div>
      </div>

      <a
        href={`tel:${volunteer.phone}`}
        className="touch-target px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-600 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-sm transition-transform active:scale-95"
      >
        <Phone className="w-3.5 h-3.5 fill-current" />
        <span>{t('call_volunteer')}</span>
      </a>
    </div>
  );
};

import React from 'react';
import { Announcement } from '../types';
import { useI18n } from '../i18n/i18nContext';
import { Bell, Pin } from 'lucide-react';

interface AnnouncementsFeedProps {
  announcements: Announcement[];
}

export const AnnouncementsFeed: React.FC<AnnouncementsFeedProps> = ({ announcements }) => {
  const { language, t } = useI18n();

  if (!announcements || announcements.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-sm border border-slate-200/80 flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Bell className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {t('announcements')}
          </span>
        </div>
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
      </div>

      <div className="flex flex-col gap-3">
        {announcements.map((ann) => {
          const title = language === 'ml' ? ann.title_ml : ann.title_en;
          const body = language === 'ml' ? ann.body_ml : ann.body_en;

          return (
            <div
              key={ann.id}
              className={`p-4 rounded-xl flex flex-col gap-1.5 transition-all ${
                ann.pinned
                  ? 'bg-primary-50/70 border border-primary-200/80'
                  : 'bg-slate-50 border border-slate-100'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 font-malayalam-bold">
                  {ann.pinned && <Pin className="w-3.5 h-3.5 text-primary rotate-45 shrink-0" />}
                  {title}
                </span>
                <span className="text-[10px] text-slate-400 shrink-0">
                  {new Date(ann.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {body}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

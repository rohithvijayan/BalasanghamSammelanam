import React, { useState } from 'react';
import { Announcement } from '../types';
import { initialDistricts } from '../lib/mockData';
import { useI18n } from '../i18n/i18nContext';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  sendBrowserNotification
} from '../lib/notifications';
import {
  X,
  Bell,
  Pin,
  Trash2,
  Send,
  CheckCircle,
  AlertCircle,
  Volume2,
  Globe
} from 'lucide-react';

interface ManageAnnouncementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  announcements: Announcement[];
  onCreateAnnouncement: (ann: {
    title_en: string;
    title_ml: string;
    body_en: string;
    body_ml: string;
    pinned: boolean;
    target_district_id: number | null;
  }) => Promise<void>;
  onDeleteAnnouncement: (id: string) => Promise<void>;
  defaultDistrictId?: number | null;
}

export const ManageAnnouncementsModal: React.FC<ManageAnnouncementsModalProps> = ({
  isOpen,
  onClose,
  announcements,
  onCreateAnnouncement,
  onDeleteAnnouncement,
  defaultDistrictId = null,
}) => {
  const { language } = useI18n();

  const [titleMl, setTitleMl] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [bodyMl, setBodyMl] = useState('');
  const [bodyEn, setBodyEn] = useState('');
  const [pinned, setPinned] = useState(false);
  const [targetDistrictId, setTargetDistrictId] = useState<string>(
    defaultDistrictId ? defaultDistrictId.toString() : 'all'
  );
  const [sendPush, setSendPush] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [notifPermission, setNotifPermission] = useState(getNotificationPermission());

  if (!isOpen) return null;

  const handleEnablePush = async () => {
    const res = await requestNotificationPermission();
    setNotifPermission(res);
    if (res === 'granted') {
      sendBrowserNotification('ബാലസംഘം അറിയിപ്പുകൾ', {
        body: 'തത്സമയ അറിയിപ്പുകൾ വിജയകരമായി ഓൺ ചെയ്തു.',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleMl.trim() || !titleEn.trim() || !bodyMl.trim() || !bodyEn.trim()) {
      setStatusMessage({
        type: 'error',
        text: language === 'ml'
          ? 'ദയവായി ശീർഷകവും വിവരണവും മലയാളത്തിലും ഇംഗ്ലീഷിലും നൽകുക.'
          : 'Please provide titles and messages in both Malayalam and English.',
      });
      return;
    }

    try {
      setSubmitting(true);
      setStatusMessage(null);

      const districtIdNum = targetDistrictId === 'all' ? null : parseInt(targetDistrictId, 10);

      // SECURITY FIX: Limit title and body lengths
      await onCreateAnnouncement({
        title_ml: titleMl.trim().slice(0, 150),
        title_en: titleEn.trim().slice(0, 150),
        body_ml: bodyMl.trim().slice(0, 2000),
        body_en: bodyEn.trim().slice(0, 2000),
        pinned,
        target_district_id: districtIdNum,
      });

      // Send local browser notification if enabled
      if (sendPush && notifPermission === 'granted') {
        await sendBrowserNotification(`📢 ${language === 'ml' ? titleMl : titleEn}`, {
          body: language === 'ml' ? bodyMl : bodyEn,
        });
      }

      setStatusMessage({
        type: 'success',
        text: language === 'ml'
          ? 'അറിയിപ്പ് വിജയകരമായി പ്രസിദ്ധീകരിച്ചു!'
          : 'Announcement published successfully!',
      });

      // Reset form fields
      setTitleMl('');
      setTitleEn('');
      setBodyMl('');
      setBodyEn('');
      setPinned(false);
    } catch (err: any) {
      console.error('Failed to create announcement', err);
      setStatusMessage({
        type: 'error',
        text: err?.message || (language === 'ml' ? 'അറിയിപ്പ് സേവ് ചെയ്യാൻ കഴിഞ്ഞില്ല.' : 'Failed to publish announcement.'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmMsg = language === 'ml'
      ? 'ഈ അറിയിപ്പ് ഡിലീറ്റ് ചെയ്യണമെന്ന് ഉറപ്പാണോ?'
      : 'Are you sure you want to delete this announcement?';
    if (!window.confirm(confirmMsg)) return;

    try {
      setDeletingId(id);
      await onDeleteAnnouncement(id);
      setStatusMessage({
        type: 'success',
        text: language === 'ml' ? 'അറിയിപ്പ് നീക്കം ചെയ്തു.' : 'Announcement deleted.',
      });
    } catch (err: any) {
      console.error('Failed to delete announcement', err);
      setStatusMessage({
        type: 'error',
        text: err?.message || (language === 'ml' ? 'ഡിലീറ്റ് ചെയ്യാൻ കഴിഞ്ഞില്ല.' : 'Failed to delete announcement.'),
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 md:p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-white shadow-sm">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold font-malayalam-bold">
                {language === 'ml' ? 'സമ്മേളന അറിയിപ്പുകൾ നൽകുക' : 'Conference Announcements'}
              </h2>
              <p className="text-xs text-slate-300">
                {language === 'ml'
                  ? 'പ്രതിനിധികൾക്കും വളണ്ടിയർമാർക്കും തത്സമയ അറിയിപ്പുകളും പുഷ് നോട്ടിഫിക്കേഷനും അയക്കുക'
                  : 'Broadcast live announcements and browser push notifications to attendees'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 md:p-6 overflow-y-auto flex flex-col gap-6">
          {/* Notification Permission Banner */}
          {isNotificationSupported() && (
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <Volume2 className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <span className="font-bold text-amber-900">
                    {language === 'ml' ? 'വെബ് പുഷ് നോട്ടിഫിക്കേഷൻ സ്റ്റാറ്റസ്: ' : 'Browser Push Notifications: '}
                  </span>
                  <span className={notifPermission === 'granted' ? 'text-emerald-700 font-bold' : 'text-amber-800'}>
                    {notifPermission === 'granted'
                      ? (language === 'ml' ? 'സജീവമാണ് (Active)' : 'Active & Enabled')
                      : notifPermission === 'denied'
                      ? (language === 'ml' ? 'ബ്ലോക്ക് ചെയ്തു (Blocked in browser settings)' : 'Blocked in browser')
                      : (language === 'ml' ? 'ഓൺ ചെയ്തിട്ടില്ല' : 'Not yet enabled')}
                  </span>
                </div>
              </div>
              {notifPermission !== 'granted' && notifPermission !== 'denied' && (
                <button
                  type="button"
                  onClick={handleEnablePush}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 shadow-xs"
                >
                  {language === 'ml' ? 'നോട്ടിഫിക്കേഷൻ ഓൺ ചെയ്യുക' : 'Enable Notifications'}
                </button>
              )}
            </div>
          )}

          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Create Announcement Form */}
          <form onSubmit={handleSubmit} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 font-malayalam-bold">
                <Send className="w-3.5 h-3.5 text-primary" />
                {language === 'ml' ? 'പുതിയ അറിയിപ്പ് നൽകുക' : 'Create New Announcement'}
              </span>
              <span className="text-[11px] text-slate-400">
                {language === 'ml' ? '* രണ്ട് ഭാഷകളിലും നൽകണം' : '* Both languages required'}
              </span>
            </div>

            {/* Titles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700 font-malayalam-bold">
                  {language === 'ml' ? 'ശീർഷകം (മലയാളം) *' : 'Title (Malayalam) *'}
                </label>
                <input
                  type="text"
                  required
                  value={titleMl}
                  onChange={(e) => setTitleMl(e.target.value)}
                  placeholder="ഉദാ: സാംസ്കാരിക സമ്മേളനം 5:30-ന്"
                  className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary shadow-2xs font-malayalam"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">
                  {language === 'ml' ? 'ശീർഷകം (English) *' : 'Title (English) *'}
                </label>
                <input
                  type="text"
                  required
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  placeholder="e.g. Cultural Conference at 5:30 PM"
                  className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary shadow-2xs"
                />
              </div>
            </div>

            {/* Bodies */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700 font-malayalam-bold">
                  {language === 'ml' ? 'വിവരണം (മലയാളം) *' : 'Message / Details (Malayalam) *'}
                </label>
                <textarea
                  rows={3}
                  required
                  value={bodyMl}
                  onChange={(e) => setBodyMl(e.target.value)}
                  placeholder="പ്രതിനിധികൾക്കായി മുഴുവൻ അറിയിപ്പും ഇവിടെ രേഖപ്പെടുത്തുക..."
                  className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary shadow-2xs font-malayalam resize-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">
                  {language === 'ml' ? 'വിവരണം (English) *' : 'Message / Details (English) *'}
                </label>
                <textarea
                  rows={3}
                  required
                  value={bodyEn}
                  onChange={(e) => setBodyEn(e.target.value)}
                  placeholder="Type the full message details for delegates and volunteers..."
                  className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary shadow-2xs resize-none"
                />
              </div>
            </div>

            {/* Target District & Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center pt-1">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-slate-500" />
                  {language === 'ml' ? 'ലക്ഷ്യമിടുന്ന ജില്ല' : 'Target District'}
                </label>
                <select
                  value={targetDistrictId}
                  onChange={(e) => setTargetDistrictId(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary shadow-2xs"
                >
                  <option value="all">
                    {language === 'ml' ? '🌐 എല്ലാ ജില്ലകളും (All Districts)' : '🌐 All Districts'}
                  </option>
                  {initialDistricts.map((d) => (
                    <option key={d.id} value={d.id.toString()}>
                      {language === 'ml' ? d.name_ml : d.name_en}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer mt-5 md:mt-4">
                <input
                  type="checkbox"
                  checked={pinned}
                  onChange={(e) => setPinned(e.target.checked)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary"
                />
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  <Pin className="w-3.5 h-3.5 text-primary rotate-45" />
                  {language === 'ml' ? 'മുകളിൽ പിൻ ചെയ്യുക' : 'Pin to top'}
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer mt-5 md:mt-4">
                <input
                  type="checkbox"
                  checked={sendPush}
                  onChange={(e) => setSendPush(e.target.checked)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary"
                />
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  <Bell className="w-3.5 h-3.5 text-amber-600" />
                  {language === 'ml' ? 'പുഷ് നോട്ടിഫിക്കേഷൻ അയക്കുക' : 'Send Push Notification'}
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-2 border-t border-slate-200">
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-600 disabled:bg-slate-300 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-transform active:scale-95"
              >
                {submitting ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>
                  {submitting
                    ? (language === 'ml' ? 'പ്രസിദ്ധീകരിക്കുന്നു...' : 'Publishing...')
                    : (language === 'ml' ? 'അറിയിപ്പ് പ്രസിദ്ധീകരിക്കുക' : 'Publish Announcement')}
                </span>
              </button>
            </div>
          </form>

          {/* Active Announcements List */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                {language === 'ml' ? `നിലവിലെ അറിയിപ്പുകൾ (${announcements.length})` : `Active Announcements (${announcements.length})`}
              </span>
              <span className="text-[11px] text-slate-400">
                {language === 'ml' ? 'ഡെലിഗേറ്റ് പോർട്ടലിൽ തത്സമയം ദൃശ്യമാകും' : 'Live on Delegate & Volunteer Portals'}
              </span>
            </div>

            {announcements.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-500 flex flex-col items-center gap-2">
                <Bell className="w-8 h-8 text-slate-300" />
                <span className="text-xs font-bold">
                  {language === 'ml'
                    ? 'നിലവിൽ അറിയിപ്പുകൾ ഒന്നുമില്ല.'
                    : 'No announcements active.'}
                </span>
                <span className="text-[11px] text-slate-400 max-w-sm">
                  {language === 'ml'
                    ? 'മുകളിലെ ഫോം ഉപയോഗിച്ച് പുതിയ അറിയിപ്പുകൾ നൽകാം. ഡെലിഗേറ്റുകൾക്ക് ഇത് തത്സമയം കാണാനാകും.'
                    : 'Use the form above to post announcements. Attendees will see them instantly.'}
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {announcements.map((ann) => {
                  const targetDist = ann.target_district_id
                    ? initialDistricts.find((d) => d.id === ann.target_district_id)
                    : null;
                  const isDeleting = deletingId === ann.id;

                  return (
                    <div
                      key={ann.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-3 ${
                        ann.pinned
                          ? 'bg-primary-50/50 border-primary-200'
                          : 'bg-white border-slate-200 shadow-2xs'
                      }`}
                    >
                      <div className="flex flex-col gap-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {ann.pinned && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-100 text-primary-800 text-[10px] font-bold">
                              <Pin className="w-3 h-3 rotate-45" />
                              {language === 'ml' ? 'പിൻ ചെയ്തത്' : 'Pinned'}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-medium">
                            {targetDist
                              ? `📍 ${language === 'ml' ? targetDist.name_ml : targetDist.name_en}`
                              : `🌐 ${language === 'ml' ? 'എല്ലാ ജില്ലകളും' : 'All Districts'}`}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(ann.created_at).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        {/* Titles & Bodies in both languages */}
                        <div className="flex flex-col gap-0.5 mt-1">
                          <h4 className="text-xs font-bold text-slate-900 font-malayalam-bold">
                            {ann.title_ml}
                          </h4>
                          <p className="text-xs text-slate-600 font-malayalam leading-relaxed">
                            {ann.body_ml}
                          </p>
                        </div>
                        <div className="flex flex-col gap-0.5 pt-1 border-t border-slate-100 text-slate-500">
                          <span className="text-[11px] font-semibold text-slate-700">
                            {ann.title_en}
                          </span>
                          <span className="text-[11px] text-slate-500 leading-relaxed">
                            {ann.body_en}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDelete(ann.id)}
                        disabled={isDeleting}
                        title={language === 'ml' ? 'അറിയിപ്പ് നീക്കം ചെയ്യുക' : 'Delete announcement'}
                        className="self-end sm:self-start p-2 rounded-xl border border-slate-200 bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors shrink-0 flex items-center gap-1 text-xs font-semibold"
                      >
                        {isDeleting ? (
                          <span className="inline-block w-3.5 h-3.5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                        <span className="text-[11px]">{language === 'ml' ? 'ഡിലീറ്റ്' : 'Delete'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold shadow-xs transition-colors"
          >
            {language === 'ml' ? 'പൂർത്തിയായി (Close)' : 'Done (Close)'}
          </button>
        </div>
      </div>
    </div>
  );
};

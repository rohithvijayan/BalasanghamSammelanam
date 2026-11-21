import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n/i18nContext';
import {
  X,
  User,
  Phone,
  MapPin,
  CheckCircle,
  AlertCircle,
  Shield,
  Save,
  Mail,
  BadgeCheck,
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  onUpdated,
}) => {
  const { user, updateProfile } = useAuth();
  const { language } = useI18n();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [unit, setUnit] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setPhone(user.phone || '');
      setUnit(user.unit || '');
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setStatusMessage({
        type: 'error',
        text: language === 'ml' ? 'ദയവായി നിങ്ങളുടെ പേര് നൽകുക.' : 'Please enter your name.',
      });
      return;
    }

    try {
      setSubmitting(true);
      setStatusMessage(null);

      const res = await updateProfile({
        full_name: fullName.trim(),
        phone: phone.trim() || undefined,
        unit: unit.trim() || undefined,
      });

      if (!res.success) {
        throw new Error(res.error || 'Failed to update profile');
      }

      setStatusMessage({
        type: 'success',
        text: language === 'ml' ? 'പ്രൊഫൈൽ വിജയകരമായി അപ്‌ഡേറ്റ് ചെയ്തു!' : 'Profile updated successfully!',
      });

      if (onUpdated) {
        onUpdated();
      }

      setTimeout(() => {
        setStatusMessage(null);
        onClose();
      }, 1500);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || (language === 'ml' ? 'അപ്‌ഡേറ്റ് ചെയ്യാൻ സാധിച്ചില്ല.' : 'Failed to update profile.'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleLabel = () => {
    if (user.role === 'admin') {
      return language === 'ml' ? 'സംസ്ഥാന അഡ്മിൻ (State Admin)' : 'State Admin';
    }
    if (user.role === 'district') {
      return language === 'ml'
        ? `${user.district_name || 'ജില്ലാ'} കൺവീനർ`
        : `${user.district_name || 'District'} Convener`;
    }
    return language === 'ml' ? 'വളണ്ടിയർ (Volunteer)' : 'Volunteer';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-primary-50/50 via-white to-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-sm">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 font-malayalam-bold">
                {language === 'ml' ? 'പ്രൊഫൈൽ വിവരങ്ങൾ' : 'My Profile & Details'}
              </h2>
              <p className="text-xs text-slate-500">
                {language === 'ml'
                  ? 'നിങ്ങളുടെ പേരും ഫോൺ നമ്പറും അപ്‌ഡേറ്റ് ചെയ്യുക'
                  : 'Update your volunteer name and contact details'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div
            className={`px-4 py-2.5 mx-5 mt-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          {/* Read-only account info */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {user.email}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-100 text-primary-800 border border-primary-200 flex items-center gap-1">
                <BadgeCheck className="w-3 h-3 text-primary" />
                {getRoleLabel()}
              </span>
            </div>
          </div>

          {/* Editable fields */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {language === 'ml' ? 'പൂർണ്ണ നാമം (Full Name) *' : 'Full Name *'}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Arun Kumar"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {language === 'ml' ? 'ഫോൺ നമ്പർ (Phone Number)' : 'Contact Phone'}
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 9400112233"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary transition-all"
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              {language === 'ml'
                ? 'ഡെലിഗേറ്റുകൾക്ക് നിങ്ങളെ നേരിട്ട് ബന്ധപ്പെടാൻ ഈ നമ്പർ ഉപയോഗിക്കും.'
                : 'Used by conference delegates to reach you for assistance.'}
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {language === 'ml' ? 'യൂണിറ്റ് / പ്രദേശം (Unit / Area)' : 'Unit / Area'}
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder={language === 'ml' ? 'ഉദാ: നീലേശ്വരം / Nileshwaram' : 'e.g. Nileshwaram'}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary transition-all"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-600 transition-colors"
            >
              {language === 'ml' ? 'റദ്ദാക്കുക' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-transform active:scale-95 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>
                {submitting
                  ? (language === 'ml' ? 'സേവ് ചെയ്യുന്നു...' : 'Saving...')
                  : (language === 'ml' ? 'വിവരങ്ങൾ സേവ് ചെയ്യുക' : 'Save Changes')}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

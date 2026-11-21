import React, { useState } from 'react';
import { Volunteer } from '../types';
import { useI18n } from '../i18n/i18nContext';
import {
  X,
  Users,
  UserPlus,
  Trash2,
  Phone,
  MapPin,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  Search,
  Edit2,
  Check,
} from 'lucide-react';

interface ManageVolunteersModalProps {
  isOpen: boolean;
  onClose: () => void;
  volunteers: Volunteer[];
  onCreateVolunteer: (vol: Omit<Volunteer, 'id'>) => Promise<void>;
  onDeleteVolunteer: (idOrName: string) => Promise<void>;
  onUpdateVolunteer?: (vol: Partial<Volunteer> & { id: string }) => Promise<void>;
}

export const ManageVolunteersModal: React.FC<ManageVolunteersModalProps> = ({
  isOpen,
  onClose,
  volunteers,
  onCreateVolunteer,
  onDeleteVolunteer,
  onUpdateVolunteer,
}) => {
  const { language } = useI18n();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [unit, setUnit] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editUnit, setEditUnit] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setStatusMessage({
        type: 'error',
        text: language === 'ml'
          ? 'ദയവായി വളണ്ടിയറുടെ പേരും ഫോൺ നമ്പറും നൽകുക.'
          : 'Please enter volunteer name and phone number.',
      });
      return;
    }

    // Format phone to clean +91 if needed
    let cleanPhone = phone.trim();
    if (!cleanPhone.startsWith('+')) {
      const digits = cleanPhone.replace(/\D/g, '');
      if (digits.length === 10) {
        cleanPhone = `+91${digits}`;
      }
    }

    try {
      setSubmitting(true);
      setStatusMessage(null);

      await onCreateVolunteer({
        name: name.trim(),
        phone: cleanPhone,
        unit: unit.trim() || undefined,
      });

      setName('');
      setPhone('');
      setUnit('');

      setStatusMessage({
        type: 'success',
        text: language === 'ml'
          ? 'വളണ്ടിയറെ വിജയകരമായി ചേർത്തു!'
          : 'Volunteer registered successfully!',
      });

      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || (language === 'ml' ? 'വളണ്ടിയറെ ചേർക്കാൻ സാധിച്ചില്ല.' : 'Failed to add volunteer.'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEdit = (vol: Volunteer) => {
    setEditingId(vol.id || vol.name);
    setEditName(vol.name);
    setEditPhone(vol.phone);
    setEditUnit(vol.unit || '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditPhone('');
    setEditUnit('');
  };

  const handleSaveEdit = async (vol: Volunteer) => {
    if (!editName.trim() || !editPhone.trim()) {
      setStatusMessage({
        type: 'error',
        text: language === 'ml'
          ? 'ദയവായി വളണ്ടിയറുടെ പേരും ഫോൺ നമ്പറും നൽകുക.'
          : 'Please enter volunteer name and phone number.',
      });
      return;
    }

    const volId = vol.id || vol.name;
    if (!onUpdateVolunteer) {
      handleCancelEdit();
      return;
    }

    try {
      setSavingEdit(true);
      await onUpdateVolunteer({
        id: volId,
        name: editName.trim(),
        phone: editPhone.trim(),
        unit: editUnit.trim() || undefined,
      });

      setStatusMessage({
        type: 'success',
        text: language === 'ml' ? 'വിവരങ്ങൾ വിജയകരമായി അപ്‌ഡേറ്റ് ചെയ്തു.' : 'Volunteer updated successfully.',
      });
      setTimeout(() => setStatusMessage(null), 3000);
      handleCancelEdit();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || (language === 'ml' ? 'അപ്‌ഡേറ്റ് ചെയ്യാൻ സാധിച്ചില്ല.' : 'Failed to update volunteer.'),
      });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (vol: Volunteer) => {
    const identifier = vol.id || vol.name;
    const confirmText = language === 'ml'
      ? `"${vol.name}" എന്ന വളണ്ടിയറെ നീക്കം ചെയ്യണമെന്ന് ഉറപ്പാണോ?`
      : `Are you sure you want to remove volunteer "${vol.name}"?`;

    if (!window.confirm(confirmText)) return;

    try {
      setDeletingId(identifier);
      await onDeleteVolunteer(identifier);
      setStatusMessage({
        type: 'success',
        text: language === 'ml' ? 'വളണ്ടിയറെ നീക്കം ചെയ്തു.' : 'Volunteer removed.',
      });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || (language === 'ml' ? 'നീക്കം ചെയ്യാൻ സാധിച്ചില്ല.' : 'Failed to delete volunteer.'),
      });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredVolunteers = volunteers.filter((v) => {
    if (!searchTerm.trim()) return true;
    const s = searchTerm.toLowerCase().trim();
    return (
      v.name.toLowerCase().includes(s) ||
      v.phone.toLowerCase().includes(s) ||
      (v.unit && v.unit.toLowerCase().includes(s))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/50 via-white to-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 font-malayalam-bold">
                {language === 'ml' ? 'വളണ്ടിയർ മാനേജ്‌മെന്റ്' : 'Manage Volunteers'}
              </h2>
              <p className="text-xs text-slate-500">
                {language === 'ml'
                  ? 'വളണ്ടിയർമാരെ ചേർക്കുക, വിവരങ്ങൾ പരിശോധിക്കുക, ഡ്രോപ്ഡൗൺ ലിസ്റ്റ് നിയന്ത്രിക്കുക'
                  : 'Add volunteers, inspect list, and manage assignment dropdowns'}
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

        {/* Status Toast */}
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

        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
          {/* Create Volunteer Form */}
          <form
            onSubmit={handleSubmit}
            className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col gap-3.5"
          >
            <div className="flex items-center gap-2 text-slate-800 font-bold text-xs sm:text-sm font-malayalam-bold">
              <UserPlus className="w-4 h-4 text-emerald-600" />
              <span>{language === 'ml' ? 'പുതിയ വളണ്ടിയറെ ചേർക്കുക' : 'Register New Volunteer'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  {language === 'ml' ? 'പേര് (Name) *' : 'Full Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={language === 'ml' ? 'ഉദാ: അരുൺ കുമാർ' : 'e.g. Arun Kumar'}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  {language === 'ml' ? 'ഫോൺ നമ്പർ (Phone) *' : 'Phone Number *'}
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9400112233"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  {language === 'ml' ? 'യൂണിറ്റ് / പ്രദേശം (Unit)' : 'Unit / Area'}
                </label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder={language === 'ml' ? 'നീലേശ്വരം / Nileshwaram' : 'Nileshwaram'}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>
                  {submitting
                    ? (language === 'ml' ? 'ചേർക്കുന്നു...' : 'Adding...')
                    : (language === 'ml' ? 'വളണ്ടിയറെ ചേർക്കുക' : 'Add Volunteer')}
                </span>
              </button>
            </div>
          </form>

          {/* Existing Volunteers List */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-xs sm:text-sm font-malayalam-bold">
                <Users className="w-4 h-4 text-slate-500" />
                <span>
                  {language === 'ml' ? 'നിലവിലുള്ള വളണ്ടിയർമാർ' : 'Registered Volunteers'} ({volunteers.length})
                </span>
              </div>

              {/* Search filter */}
              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={language === 'ml' ? 'തിരയുക (പേര്/ഫോൺ)...' : 'Search name, phone, unit...'}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            {filteredVolunteers.length === 0 ? (
              <div className="text-center py-8 px-4 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <p className="text-xs text-slate-500 font-medium">
                  {searchTerm
                    ? (language === 'ml' ? 'പൊരുത്തപ്പെടുന്ന വളണ്ടിയർമാരെ കണ്ടെത്തിയില്ല.' : 'No matching volunteers found.')
                    : (language === 'ml' ? 'വളണ്ടിയർമാർ ആരും ചേർക്കപ്പെട്ടിട്ടില്ല.' : 'No volunteers registered yet.')}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filteredVolunteers.map((vol, idx) => {
                  const identifier = vol.id || vol.name;
                  const isDeleting = deletingId === identifier;
                  const isEditing = editingId === identifier;

                  if (isEditing) {
                    return (
                      <div
                        key={identifier || idx}
                        className="p-3.5 rounded-xl bg-emerald-50/70 border-2 border-emerald-400 shadow-sm flex flex-col gap-2.5 transition-all col-span-1 sm:col-span-2"
                      >
                        <div className="flex items-center justify-between border-b border-emerald-200 pb-1.5">
                          <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5 font-malayalam-bold">
                            <Edit2 className="w-3.5 h-3.5 text-emerald-700" />
                            {language === 'ml' ? 'വിവരങ്ങൾ മാറ്റുക (Edit Volunteer)' : 'Edit Volunteer Details'}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                              {language === 'ml' ? 'പേര് (Name)' : 'Name'}
                            </label>
                            <input
                              type="text"
                              required
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-emerald-300 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                              {language === 'ml' ? 'ഫോൺ നമ്പർ' : 'Phone'}
                            </label>
                            <input
                              type="tel"
                              required
                              value={editPhone}
                              onChange={(e) => setEditPhone(e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-emerald-300 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                              {language === 'ml' ? 'യൂണിറ്റ് / പ്രദേശം' : 'Unit'}
                            </label>
                            <input
                              type="text"
                              value={editUnit}
                              onChange={(e) => setEditUnit(e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-emerald-300 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            disabled={savingEdit}
                            className="px-3 py-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-600 transition-colors"
                          >
                            {language === 'ml' ? 'റദ്ദാക്കുക' : 'Cancel'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(vol)}
                            disabled={savingEdit}
                            className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs transition-colors disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{savingEdit ? (language === 'ml' ? 'സേവ് ചെയ്യുന്നു...' : 'Saving...') : (language === 'ml' ? 'സേവ് ചെയ്യുക' : 'Save')}</span>
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={identifier || idx}
                      className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between gap-3 hover:border-emerald-300 transition-all"
                    >
                      <div className="min-w-0 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center shrink-0 text-xs">
                          {vol.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {vol.name}
                            </span>
                            {vol.unit && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 truncate max-w-[100px]">
                                {vol.unit}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono mt-0.5">
                            <Phone className="w-2.5 h-2.5 text-slate-400" />
                            <span>{vol.phone}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(vol)}
                          disabled={isDeleting || savingEdit}
                          title={language === 'ml' ? 'വിവരങ്ങൾ മാറ്റുക' : 'Edit Volunteer'}
                          className="w-7 h-7 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-700 flex items-center justify-center transition-colors disabled:opacity-50"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(vol)}
                          disabled={isDeleting}
                          title={language === 'ml' ? 'നീക്കം ചെയ്യുക' : 'Delete'}
                          className="w-7 h-7 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 flex items-center justify-center transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {language === 'ml'
                ? 'ഡ്രോപ്ഡൗണുകളിൽ ഈ ലിസ്റ്റ് സ്വയം അപ്ഡേറ്റ് ആകുന്നതാണ്.'
                : 'Assignments and dropdowns update automatically from this list.'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 shadow-2xs"
          >
            {language === 'ml' ? 'പൂർത്തിയായി (Done)' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

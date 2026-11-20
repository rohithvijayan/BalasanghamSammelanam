import React, { useState, useEffect } from 'react';
import { Delegate, Volunteer } from '../types';
import { initialDistricts, defaultVolunteers } from '../lib/mockData';
import { useI18n } from '../i18n/i18nContext';
import { X, Check, User, Phone, MapPin, Shield, UserCheck } from 'lucide-react';

interface EditDelegateModalProps {
  delegate: Delegate | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: Delegate) => Promise<void> | void;
}

export const EditDelegateModal: React.FC<EditDelegateModalProps> = ({
  delegate,
  isOpen,
  onClose,
  onSave,
}) => {
  const { language } = useI18n();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [districtId, setDistrictId] = useState(2);
  const [gender, setGender] = useState<'boy' | 'girl'>('boy');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [volunteerName, setVolunteerName] = useState('');
  const [volunteerPhone, setVolunteerPhone] = useState('');
  const [volunteerUnit, setVolunteerUnit] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (delegate) {
      setFullName(delegate.full_name || '');
      setPhone(delegate.phone || '');
      setDistrictId(delegate.district_id || 2);
      setGender(delegate.gender === 'girl' ? 'girl' : 'boy');
      setEmergencyName(delegate.emergency_name || '');
      setEmergencyPhone(delegate.emergency_phone || '');
      setNotes(delegate.notes || '');
      if (delegate.volunteer) {
        setVolunteerName(delegate.volunteer.name || '');
        setVolunteerPhone(delegate.volunteer.phone || '');
        setVolunteerUnit(delegate.volunteer.unit || '');
      } else {
        setVolunteerName('');
        setVolunteerPhone('');
        setVolunteerUnit('');
      }
    }
  }, [delegate]);

  if (!isOpen || !delegate) return null;

  const handleSelectDefaultVolunteer = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) {
      setVolunteerName('');
      setVolunteerPhone('');
      setVolunteerUnit('');
      return;
    }
    const found = defaultVolunteers.find((v) => v.name === val);
    if (found) {
      setVolunteerName(found.name);
      setVolunteerPhone(found.phone);
      setVolunteerUnit(found.unit || '');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    setIsSaving(true);
    const dist = initialDistricts.find((d) => d.id === Number(districtId));

    const updated: Delegate = {
      ...delegate,
      full_name: fullName.trim(),
      phone: phone.trim(),
      district_id: Number(districtId),
      district_en: dist ? dist.name_en : delegate.district_en,
      district_ml: dist ? dist.name_ml : delegate.district_ml,
      gender,
      emergency_name: emergencyName.trim(),
      emergency_phone: emergencyPhone.trim(),
      notes: notes.trim(),
      volunteer: volunteerName.trim()
        ? {
            name: volunteerName.trim(),
            phone: volunteerPhone.trim(),
            unit: volunteerUnit.trim(),
          }
        : null,
    };

    try {
      await onSave(updated);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 font-malayalam-bold">
                {language === 'ml' ? 'പ്രതിനിധി വിവരങ്ങൾ തിരുത്തുക' : 'Edit Delegate Details'}
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">
                {delegate.token}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 max-h-[75vh] overflow-y-auto">
          {/* Full Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">
              {language === 'ml' ? 'പൂർണ്ണ പേര് (Full Name) *' : 'Full Name *'}
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Arjun K."
              className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Phone & Gender Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">
                {language === 'ml' ? 'മൊബൈൽ നമ്പർ' : 'Phone Number'}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98470 00000"
                className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">
                {language === 'ml' ? 'ലിംഗം (Gender)' : 'Gender'}
              </label>
              <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setGender('boy')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    gender === 'boy' ? 'bg-sky-500 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  {language === 'ml' ? 'ആൺകുട്ടി' : 'Boy'}
                </button>
                <button
                  type="button"
                  onClick={() => setGender('girl')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    gender === 'girl' ? 'bg-pink-500 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  {language === 'ml' ? 'പെൺകുട്ടി' : 'Girl'}
                </button>
              </div>
            </div>
          </div>

          {/* District Select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">
              {language === 'ml' ? 'ജില്ല (District)' : 'District'}
            </label>
            <select
              value={districtId}
              onChange={(e) => setDistrictId(Number(e.target.value))}
              className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {initialDistricts.map((d) => (
                <option key={d.id} value={d.id}>
                  {language === 'ml' ? d.name_ml : d.name_en}
                </option>
              ))}
            </select>
          </div>

          {/* Guardian Emergency Contact */}
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex flex-col gap-3">
            <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-amber-700" />
              {language === 'ml' ? 'രക്ഷാകർത്താവിന്റെ വിവരങ്ങൾ' : 'Guardian Emergency Details'}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-slate-600">
                  {language === 'ml' ? 'രക്ഷാകർത്താവിന്റെ പേര്' : 'Guardian Name'}
                </label>
                <input
                  type="text"
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  placeholder="e.g. Suresh K."
                  className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-slate-600">
                  {language === 'ml' ? 'ഫോൺ നമ്പർ' : 'Guardian Phone'}
                </label>
                <input
                  type="tel"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  placeholder="+91 94460 00000"
                  className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Assigned Volunteer In-Charge */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 flex flex-col gap-3">
            <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-indigo-700" />
              {language === 'ml' ? 'ചുമതലയുള്ള വളണ്ടിയർ (Volunteer In-Charge)' : 'Assigned Volunteer In-Charge'}
            </span>

            {/* Quick Pick from default volunteers */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-slate-600">
                {language === 'ml' ? 'വളണ്ടിയറെ തിരഞ്ഞെടുക്കുക' : 'Choose Registered Volunteer'}
              </label>
              <select
                value={defaultVolunteers.some((v) => v.name === volunteerName) ? volunteerName : ''}
                onChange={handleSelectDefaultVolunteer}
                className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">{language === 'ml' ? '-- വളണ്ടിയർ ഇല്ല / സ്വയം ടൈപ്പ് ചെയ്യുക --' : '-- No Volunteer / Custom Volunteer --'}</option>
                {defaultVolunteers.map((vol) => (
                  <option key={vol.name} value={vol.name}>
                    {vol.name} ({vol.phone}) - {vol.unit}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-slate-600">
                  {language === 'ml' ? 'വളണ്ടിയറുടെ പേര്' : 'Volunteer Name'}
                </label>
                <input
                  type="text"
                  value={volunteerName}
                  onChange={(e) => setVolunteerName(e.target.value)}
                  placeholder="e.g. Reshma P."
                  className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-slate-600">
                  {language === 'ml' ? 'വളണ്ടിയറുടെ ഫോൺ' : 'Volunteer Phone'}
                </label>
                <input
                  type="tel"
                  value={volunteerPhone}
                  onChange={(e) => setVolunteerPhone(e.target.value)}
                  placeholder="+91 98460 00000"
                  className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Special Notes / Unit */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">
              {language === 'ml' ? 'യൂണിറ്റ് / പ്രത്യേക കുറിപ്പുകൾ' : 'Unit / Notes'}
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Nileshwaram West Unit, Vegetarian"
              className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              {language === 'ml' ? 'റദ്ദാക്കുക (Cancel)' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSaving || !fullName.trim()}
              className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-transform active:scale-95 disabled:opacity-50"
            >
              {isSaving ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              <span>{language === 'ml' ? 'സേവ് ചെയ്യുക' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

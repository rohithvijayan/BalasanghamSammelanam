import React, { useState, useEffect } from 'react';
import { House, Volunteer } from '../types';
import { useI18n } from '../i18n/i18nContext';
import { X, Check, Home, Phone, MapPin, Users, UserCheck } from 'lucide-react';

interface EditHouseModalProps {
  house: House | null; // null means adding a new house
  volunteers?: Volunteer[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (saved: House) => Promise<void> | void;
}

export const EditHouseModal: React.FC<EditHouseModalProps> = ({
  house,
  volunteers = [],
  isOpen,
  onClose,
  onSave,
}) => {
  const { language } = useI18n();

  const isNew = !house;

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [hostName, setHostName] = useState('');
  const [hostPhone, setHostPhone] = useState('');
  const [capacity, setCapacity] = useState(4);
  const [genderRestriction, setGenderRestriction] = useState<'any' | 'boys' | 'girls'>('any');
  const [volunteerId, setVolunteerId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (house) {
      setName(house.name || '');
      setAddress(house.address || '');
      setHostName(house.host_name || '');
      setHostPhone(house.host_phone || '');
      setCapacity(house.capacity || 4);
      setGenderRestriction((house.gender_restriction as any) || 'any');
      setVolunteerId(house.volunteer_id || house.volunteer?.id || '');
    } else {
      setName('');
      setAddress('');
      setHostName('');
      setHostPhone('');
      setCapacity(4);
      setGenderRestriction('any');
      setVolunteerId('');
    }
  }, [house, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    const selectedVol = volunteers.find((v) => v.id === volunteerId) || null;
    const savedHouse: House = {
      id: house ? house.id : 'h-' + Date.now(),
      name: name.trim(),
      address: address.trim(),
      host_name: hostName.trim() || 'Host',
      host_phone: hostPhone.trim(),
      capacity: Number(capacity) || 4,
      gender_restriction: genderRestriction,
      volunteer_id: volunteerId || null,
      volunteer: selectedVol,
    };

    try {
      await onSave(savedHouse);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Home className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 font-malayalam-bold">
                {isNew
                  ? (language === 'ml' ? 'പുതിയ ആതിഥേയ വീട് ചേർക്കുക' : 'Add New Host House')
                  : (language === 'ml' ? 'വീടിന്റെ വിവരങ്ങൾ തിരുത്തുക' : 'Edit House Details')}
              </h3>
              {!isNew && (
                <span className="text-[11px] text-slate-500 font-mono">
                  {house.id}
                </span>
              )}
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
          {/* House Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">
              {language === 'ml' ? 'വീടിന്റെ പേര് (House Name) *' : 'House Name *'}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Souparnika House"
              className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Address / Ward */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">
              {language === 'ml' ? 'മേൽവിലാസം / വാർഡ് (Address)' : 'Address / Ward'}
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ward 4, Nileshwaram Municipality"
              className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Host Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">
                {language === 'ml' ? 'ആതിഥേയന്റെ പേര് (Host Name)' : 'Host Name'}
              </label>
              <input
                type="text"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                placeholder="e.g. K. Raghavan"
                className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">
                {language === 'ml' ? 'ഫോൺ നമ്പർ (Phone)' : 'Host Phone'}
              </label>
              <input
                type="tel"
                value={hostPhone}
                onChange={(e) => setHostPhone(e.target.value)}
                placeholder="+91 94471 23456"
                className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Capacity & Gender Restriction */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">
                {language === 'ml' ? 'കപ്പാസിറ്റി / കിടക്കകൾ (Capacity) *' : 'Capacity / Beds *'}
              </label>
              <input
                type="number"
                min="1"
                max="100"
                required
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">
                {language === 'ml' ? 'താമസ അനുമതി' : 'Gender Restriction'}
              </label>
              <select
                value={genderRestriction}
                onChange={(e) => setGenderRestriction(e.target.value as any)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="any">{language === 'ml' ? 'ആൺ / പെൺ (Any)' : 'Any (No Restriction)'}</option>
                <option value="boys">{language === 'ml' ? 'ആൺകുട്ടികൾ മാത്രം (Boys Only)' : 'Boys Only'}</option>
                <option value="girls">{language === 'ml' ? 'പെൺകുട്ടികൾ മാത്രം (Girls Only)' : 'Girls Only'}</option>
              </select>
            </div>
          </div>

          {/* Volunteer In-Charge */}
          <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200">
            <label className="text-xs font-bold text-emerald-950 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>{language === 'ml' ? 'വളണ്ടിയർ ഇൻ-ചാർജ്ജ് (Volunteer In-Charge)' : 'Volunteer In-Charge'}</span>
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold">
                {language === 'ml' ? 'കുട്ടികൾ സ്വമേധയാ കണക്റ്റാവും' : 'Auto-assigned to occupants'}
              </span>
            </label>
            <select
              value={volunteerId}
              onChange={(e) => setVolunteerId(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl bg-white border border-emerald-300 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">{language === 'ml' ? '-- വളണ്ടിയറെ നിശ്ചയിച്ചിട്ടില്ല (None) --' : '-- No Volunteer Assigned --'}</option>
              {volunteers.map((v) => (
                <option key={v.id || v.name} value={v.id || ''}>
                  {v.name} ({v.phone || v.unit || 'Volunteer'})
                </option>
              ))}
            </select>
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
              disabled={isSaving || !name.trim()}
              className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-transform active:scale-95 disabled:opacity-50"
            >
              {isSaving ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              <span>
                {isNew
                  ? (language === 'ml' ? 'വീട് ചേർക്കുക' : 'Create House')
                  : (language === 'ml' ? 'സേവ് ചെയ്യുക' : 'Save Changes')}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

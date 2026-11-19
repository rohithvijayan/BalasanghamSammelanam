import React, { useState, useEffect } from 'react';
import { mockStore, initialDistricts } from '../lib/mockData';
import { Delegate, House } from '../types';
import { api } from '../lib/supabase';
import { useI18n } from '../i18n/i18nContext';
import { useAuth } from '../auth/AuthContext';
import {
  Users,
  Home,
  CheckCircle,
  Clock,
  ShieldAlert,
  Search,
  Filter,
  ArrowRight,
  X,
  Phone,
  UserCheck,
  AlertTriangle
} from 'lucide-react';

export const AdminWorkbench: React.FC = () => {
  const { language, t } = useI18n();
  const { user } = useAuth();

  const isDistrictCoordinator = user?.role === 'district';
  const userDistrictId = user?.district_id ? user.district_id.toString() : null;

  const [delegates, setDelegates] = useState<Delegate[]>(() => mockStore.getDelegates());
  const [houses, setHouses] = useState<House[]>(() => mockStore.getHouses());
  const [selectedDistrict, setSelectedDistrict] = useState<string>(() => {
    if (user?.role === 'district' && user.district_id) {
      return user.district_id.toString();
    }
    return 'all';
  });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [genderFilter, setGenderFilter] = useState<'all' | 'boy' | 'girl'>('all');
  const [selectedDelegateIds, setSelectedDelegateIds] = useState<string[]>([]);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [delData, houseData] = await Promise.all([
        api.getDelegates(),
        api.getHouses(),
      ]);
      setDelegates(delData);
      setHouses(houseData);
    } catch (e) {
      console.warn('Failed to load data in workbench', e);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = mockStore.subscribe(() => {
      loadData();
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // If district coordinator, force filter to their district
  const effectiveDistrict = isDistrictCoordinator && userDistrictId ? userDistrictId : selectedDistrict;

  // Filter unassigned delegates
  const unassignedDelegates = delegates.filter((d) => {
    const isUnassigned = !d.house_id;
    const matchesDistrict = effectiveDistrict === 'all' || d.district_id.toString() === effectiveDistrict;
    const matchesGender = genderFilter === 'all' || d.gender === genderFilter;
    const matchesSearch =
      searchQuery === '' ||
      d.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.phone && d.phone.includes(searchQuery));
    return isUnassigned && matchesDistrict && matchesGender && matchesSearch;
  });

  // Calculate metrics (scoped to district if district coordinator)
  const scopedDelegates = delegates.filter(
    (d) => effectiveDistrict === 'all' || d.district_id.toString() === effectiveDistrict
  );
  const totalCount = scopedDelegates.length;
  const accommodatedCount = scopedDelegates.filter((d) => d.house_id).length;
  const checkedInCount = scopedDelegates.filter((d) => d.status === 'checked_in').length;
  const pendingCount = totalCount - checkedInCount;

  // Toggle delegate selection for bulk assignment
  const toggleSelectDelegate = (id: string) => {
    setSelectedDelegateIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Assign delegate(s) to house
  const handleAssignToHouse = (house: House) => {
    if (selectedDelegateIds.length === 0) {
      alert('ദയവായി ആദ്യം അലോട്ട് ചെയ്യേണ്ട പ്രതിനിധികളെ തിരഞ്ഞെടുക്കുക.');
      return;
    }

    const currentOccupants = delegates.filter((d) => d.house_id === house.id).length;
    const newTotal = currentOccupants + selectedDelegateIds.length;

    // Soft over-capacity warning (FR-ASN-3)
    if (newTotal > house.capacity) {
      const confirmOverride = window.confirm(
        `മുന്നറിയിപ്പ്: ഈ വീടിന്റെ കപ്പാസിറ്റി ${house.capacity} ആണ്. ഇപ്പോൾ ${newTotal} പേരാകും. തുടരണോ?`
      );
      if (!confirmOverride) return;
    }

    mockStore.bulkAssign(selectedDelegateIds, house.id);
    setSelectedDelegateIds([]);
    setWarningMessage(`വിജയകരമായി ${house.name}-ലേക്ക് അലോട്ട് ചെയ്തു!`);
    setTimeout(() => setWarningMessage(null), 4000);
  };

  const handleUnassign = (delegateId: string) => {
    mockStore.assignHouse(delegateId, null);
  };

  const handleToggleCheckin = (delegateId: string, currentStatus: Delegate['status']) => {
    const nextStatus = currentStatus === 'checked_in' ? 'pending' : 'checked_in';
    mockStore.updateStatus(delegateId, nextStatus);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
      {/* Top Header & District Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl md:rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">
              {isDistrictCoordinator
                ? `${user?.district_name || 'ജില്ലാ'} കോർഡിനേഷൻ പാനൽ`
                : 'സംസ്ഥാന അഡ്മിൻ വർക്ക് ബെഞ്ച്'}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200">
              {user?.role === 'admin' ? 'State Admin' : 'District Level'}
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-malayalam-bold text-slate-900 leading-tight mt-0.5">
            {isDistrictCoordinator
              ? `${user?.district_name || 'ജില്ലാ'} പ്രതിനിധികളും താമസ അലോട്ട്മെന്റും`
              : 'താമസ അലോട്ട്മെന്റ് & കൺട്രോൾ പാനൽ'}
          </h1>
          <span className="text-xs text-slate-500">
            8-ാമത് ബാലസംഘം സംസ്ഥാന സമ്മേളനം • നീലേശ്വരം, പാലായി
          </span>
        </div>

        {/* District Filter: Lock for district coordinators, dropdown for state admins */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-600 shrink-0">
            {t('all_districts')}:
          </label>
          {isDistrictCoordinator ? (
            <div className="px-4 py-2 rounded-xl bg-primary-50 text-primary-800 text-xs font-bold border border-primary-200 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <span>{user?.district_name || 'ജില്ല'} (ലോക്ക് ചെയ്തത്)</span>
            </div>
          ) : (
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
            >
              <option value="all">എല്ലാ ജില്ലകളും (All Districts)</option>
              {initialDistricts.map((dist) => (
                <option key={dist.id} value={dist.id.toString()}>
                  {language === 'ml' ? dist.name_ml : dist.name_en}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col">
          <span className="text-xs font-semibold text-slate-400">{t('total_delegates')}</span>
          <span className="text-2xl font-black text-slate-900 mt-1">{totalCount}</span>
          <span className="text-[11px] text-slate-500">14 ജില്ലകൾ</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col">
          <span className="text-xs font-semibold text-slate-400">{t('accommodated')}</span>
          <span className="text-2xl font-black text-primary mt-1">{accommodatedCount}</span>
          <span className="text-[11px] text-emerald-600 font-bold">
            {Math.round((accommodatedCount / (totalCount || 1)) * 100)}% പൂർത്തിയായി
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col">
          <span className="text-xs font-semibold text-slate-400">{t('checked_in')}</span>
          <span className="text-2xl font-black text-emerald-600 mt-1">{checkedInCount}</span>
          <span className="text-[11px] text-slate-500">ഹാജർ നില</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col">
          <span className="text-xs font-semibold text-slate-400">{t('pending_arrival')}</span>
          <span className="text-2xl font-black text-amber-600 mt-1">{pendingCount}</span>
          <span className="text-[11px] text-slate-500">വഴിയിലാണ്</span>
        </div>
      </div>

      {/* Toast Feedback */}
      {warningMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{warningMessage}</span>
        </div>
      )}

      {/* Main Two-Pane Assignment Workspace (FR-ASN-1 & FR-ASN-2) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Pane: Unassigned Delegates Queue (lg:col-span-5) */}
        <div className="lg:col-span-5 bg-white rounded-2xl md:rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-slate-900 font-malayalam-bold">
                {t('unassigned_queue')} ({unassignedDelegates.length})
              </h2>
            </div>
            {selectedDelegateIds.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-primary-100 text-primary-800 text-[11px] font-bold">
                {selectedDelegateIds.length} പേരെ തിരഞ്ഞെടുത്തു
              </span>
            )}
          </div>

          {/* Search & Gender Filter */}
          <div className="flex flex-col gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="പേരോ ഫോണോ തിരയുക..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setGenderFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  genderFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                എല്ലാം
              </button>
              <button
                onClick={() => setGenderFilter('boy')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  genderFilter === 'boy' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                ആൺകുട്ടികൾ
              </button>
              <button
                onClick={() => setGenderFilter('girl')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  genderFilter === 'girl' ? 'bg-pink-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                പെൺകുട്ടികൾ
              </button>
            </div>
          </div>

          {/* List of Unassigned Delegates */}
          <div className="flex flex-col gap-2.5 max-h-[520px] overflow-y-auto pr-1">
            {unassignedDelegates.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 font-medium">
                എല്ലാ പ്രതിനിധികൾക്കും താമസസ്ഥലം അനുവദിച്ചു!
              </div>
            ) : (
              unassignedDelegates.map((del) => {
                const isSelected = selectedDelegateIds.includes(del.id);
                return (
                  <div
                    key={del.id}
                    onClick={() => toggleSelectDelegate(del.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-primary-50 border-primary-300 shadow-xs'
                        : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // handled by parent div
                        className="w-4 h-4 rounded text-primary focus:ring-primary shrink-0"
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-slate-900 truncate font-malayalam-bold">
                          {del.full_name}
                        </span>
                        <span className="text-[11px] text-slate-500 truncate">
                          {language === 'ml' ? del.district_ml : del.district_en} • {del.phone || 'ഫോൺ ഇല്ല'}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase shrink-0 ${
                        del.gender === 'girl'
                          ? 'bg-pink-100 text-pink-700'
                          : 'bg-sky-100 text-sky-700'
                      }`}
                    >
                      {del.gender === 'girl' ? 'പെൺകുട്ടി' : 'ആൺകുട്ടി'}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Houses & Capacity (lg:col-span-7) */}
        <div className="lg:col-span-7 bg-white rounded-2xl md:rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Home className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-slate-900 font-malayalam-bold">
                {t('houses_capacity')} ({houses.length})
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              {accommodatedCount} പേർക്ക് അനുവദിച്ചു
            </span>
          </div>

          {/* Houses List */}
          <div className="flex flex-col gap-4 max-h-[580px] overflow-y-auto pr-1">
            {houses.map((house) => {
              const currentOccupants = delegates.filter((d) => d.house_id === house.id);
              const count = currentOccupants.length;
              const isFull = count >= house.capacity;
              const fillPercent = Math.min(100, Math.round((count / house.capacity) * 100));

              return (
                <div
                  key={house.id}
                  className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 flex flex-col gap-3.5"
                >
                  {/* House Title & Meta */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm md:text-base font-bold text-slate-900 font-malayalam-bold truncate">
                          {house.name}
                        </h3>
                        {house.gender_restriction && house.gender_restriction !== 'any' && (
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase shrink-0 ${
                              house.gender_restriction === 'girls'
                                ? 'bg-pink-100 text-pink-700'
                                : 'bg-sky-100 text-sky-700'
                            }`}
                          >
                            {house.gender_restriction === 'girls' ? 'Girls Only' : 'Boys Only'}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 truncate mt-0.5">
                        {house.address} • ആതിഥേയൻ: {house.host_name} ({house.host_phone})
                      </span>
                    </div>

                    {/* Assign Action Button */}
                    <button
                      onClick={() => handleAssignToHouse(house)}
                      disabled={selectedDelegateIds.length === 0}
                      className="touch-target px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-600 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold shrink-0 shadow-xs transition-transform active:scale-95 flex items-center gap-1.5"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>{t('assign_here')}</span>
                    </button>
                  </div>

                  {/* Capacity Bar */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-600">
                        കപ്പാസിറ്റി: {count} / {house.capacity} പേർ
                      </span>
                      <span className={isFull ? 'text-amber-600' : 'text-emerald-600'}>
                        {isFull ? t('capacity_full') : `${house.capacity - count} ${t('slots_free')}`}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isFull ? 'bg-amber-500' : 'bg-primary'
                        }`}
                        style={{ width: `${fillPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Occupants list */}
                  {currentOccupants.length > 0 && (
                    <div className="pt-2 border-t border-slate-200/60 flex flex-col gap-1.5">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        ഇവിടെ താമസിക്കുന്നവർ ({currentOccupants.length}):
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {currentOccupants.map((occ) => (
                          <div
                            key={occ.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-800 shadow-2xs"
                          >
                            <button
                              onClick={() => handleToggleCheckin(occ.id, occ.status)}
                              title="Toggle check-in status"
                              className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                                occ.status === 'checked_in'
                                  ? 'bg-emerald-500 border-emerald-600 text-white'
                                  : 'bg-white border-slate-300'
                              }`}
                            >
                              {occ.status === 'checked_in' && '✓'}
                            </button>
                            <span className="font-bold font-malayalam-bold">{occ.full_name}</span>
                            <span className="text-[10px] text-slate-400">
                              ({occ.district_ml || occ.district_en})
                            </span>
                            <button
                              onClick={() => handleUnassign(occ.id)}
                              title="Unassign"
                              className="text-slate-400 hover:text-red-600 p-0.5 rounded transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

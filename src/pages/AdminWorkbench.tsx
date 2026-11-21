import React, { useState, useEffect } from 'react';
import { mockStore, initialDistricts } from '../lib/mockData';
import { Delegate, House, Volunteer, Announcement } from '../types';
import { api } from '../lib/supabase';
import { useI18n } from '../i18n/i18nContext';
import { useAuth } from '../auth/AuthContext';
import { EditDelegateModal } from '../components/EditDelegateModal';
import { EditHouseModal } from '../components/EditHouseModal';
import { ManageAnnouncementsModal } from '../components/ManageAnnouncementsModal';
import { ManageVolunteersModal } from '../components/ManageVolunteersModal';
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
  AlertTriangle,
  Edit2,
  Plus,
  Bell,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react';

export const AdminWorkbench: React.FC = () => {
  const { language, t } = useI18n();
  const { user } = useAuth();

  const isDistrictCoordinator = user?.role === 'district';
  const userDistrictId = user?.district_id ? user.district_id.toString() : null;

  const [delegates, setDelegates] = useState<Delegate[]>(() => mockStore.getDelegates());
  const [houses, setHouses] = useState<House[]>(() => mockStore.getHouses());
  const [volunteers, setVolunteers] = useState<Volunteer[]>(() => mockStore.getVolunteers());
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => mockStore.getAnnouncements());
  const [isAnnouncementsModalOpen, setIsAnnouncementsModalOpen] = useState<boolean>(false);
  const [isVolunteersModalOpen, setIsVolunteersModalOpen] = useState<boolean>(false);
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

  const [unassignedPage, setUnassignedPage] = useState<number>(1);
  const unassignedPageSize = 25;

  const [editingDelegate, setEditingDelegate] = useState<Delegate | null>(null);
  const [editingHouse, setEditingHouse] = useState<House | null>(null);
  const [isAddingHouse, setIsAddingHouse] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadData(true);
    } finally {
      setIsRefreshing(false);
    }
  };

  const loadData = async (forceRefresh = false) => {
    try {
      const [delData, houseData, annData, volData] = await Promise.all([
        api.getDelegates(forceRefresh),
        api.getHouses(forceRefresh),
        api.getAnnouncements(undefined, forceRefresh),
        api.getVolunteers(forceRefresh),
      ]);
      setDelegates(delData);
      setHouses(houseData);
      setAnnouncements(annData);
      setVolunteers(volData);
    } catch (e) {
      console.warn('Failed to load data in workbench', e);
    }
  };

  const handleCreateAnnouncement = async (annData: {
    title_en: string;
    title_ml: string;
    body_en: string;
    body_ml: string;
    pinned: boolean;
    target_district_id: number | null;
  }) => {
    const created = await api.createAnnouncement(annData);
    setAnnouncements((prev) => [created, ...prev.filter((a) => a.id !== created.id)]);
    setWarningMessage(language === 'ml' ? 'അറിയിപ്പ് വിജയകരമായി പ്രസിദ്ധീകരിച്ചു!' : 'Announcement published!');
    setTimeout(() => setWarningMessage(null), 3500);
  };

  const handleDeleteAnnouncement = async (id: string) => {
    await api.deleteAnnouncement(id);
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
  };

  useEffect(() => {
    loadData();

    // Visibility-aware auto-sync every 60s (zero bandwidth when tab is backgrounded)
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadData(false);
      }
    }, 60000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // CRITICAL FIX: Only update React state from local memory. NEVER call network loadData() here to eliminate recursive loops.
    const unsubscribe = mockStore.subscribe(() => {
      setDelegates(mockStore.getDelegates());
      setHouses(mockStore.getHouses());
      setAnnouncements(mockStore.getAnnouncements());
    });

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
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

  const totalUnassignedPages = Math.max(1, Math.ceil(unassignedDelegates.length / unassignedPageSize));
  const safeUnassignedPage = Math.min(Math.max(1, unassignedPage), totalUnassignedPages);
  const pagedUnassignedDelegates = unassignedDelegates.slice(
    (safeUnassignedPage - 1) * unassignedPageSize,
    safeUnassignedPage * unassignedPageSize
  );

  useEffect(() => {
    setUnassignedPage(1);
  }, [searchQuery, genderFilter, selectedDistrict]);

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
      alert(language === 'ml' ? 'ദയവായി ആദ്യം അലോട്ട് ചെയ്യേണ്ട പ്രതിനിധികളെ തിരഞ്ഞെടുക്കുക.' : 'Please select delegates to allot first.');
      return;
    }

    const currentOccupants = delegates.filter((d) => d.house_id === house.id).length;
    const newTotal = currentOccupants + selectedDelegateIds.length;

    // Soft over-capacity warning (FR-ASN-3)
    if (newTotal > house.capacity) {
      const confirmOverride = window.confirm(
        language === 'ml'
          ? `മുന്നറിയിപ്പ്: ഈ വീടിന്റെ കപ്പാസിറ്റി ${house.capacity} ആണ്. ഇപ്പോൾ ${newTotal} പേരാകും. തുടരണോ?`
          : `Warning: This house capacity is ${house.capacity}. Total will become ${newTotal}. Do you wish to continue?`
      );
      if (!confirmOverride) return;
    }

    mockStore.bulkAssign(selectedDelegateIds, house.id);
    setSelectedDelegateIds([]);
    setWarningMessage(language === 'ml' ? `വിജയകരമായി ${house.name}-ലേക്ക് അലോട്ട് ചെയ്തു!` : `Successfully allotted to ${house.name}!`);
    setTimeout(() => setWarningMessage(null), 4000);
  };

  const handleUnassign = (delegateId: string) => {
    mockStore.assignHouse(delegateId, null);
  };

  const handleToggleCheckin = (delegateId: string, currentStatus: Delegate['status']) => {
    const nextStatus = currentStatus === 'checked_in' ? 'pending' : 'checked_in';
    mockStore.updateStatus(delegateId, nextStatus);
  };

  const handleSaveDelegate = async (updated: Delegate) => {
    await api.updateDelegate(updated);
    setWarningMessage(
      language === 'ml'
        ? `${updated.full_name} വിവരങ്ങൾ വിജയകരമായി സേവ് ചെയ്തു!`
        : `Successfully updated ${updated.full_name}!`
    );
    setTimeout(() => setWarningMessage(null), 3000);
    await loadData();
  };

  const handleBulkAssignVolunteer = async (volunteer: Volunteer | null) => {
    if (selectedDelegateIds.length === 0) return;
    await api.bulkAssignVolunteer(selectedDelegateIds, volunteer);
    const count = selectedDelegateIds.length;
    setSelectedDelegateIds([]);
    setWarningMessage(
      language === 'ml'
        ? `${count} പ്രതിനിധികൾക്ക് ${volunteer ? volunteer.name : 'വളണ്ടിയറെ'} ചുമതലപ്പെടുത്തി!`
        : `Assigned ${count} delegates to ${volunteer ? volunteer.name : 'volunteer'}!`
    );
    setTimeout(() => setWarningMessage(null), 3000);
    await loadData();
  };

  const handleSaveHouse = async (houseData: House) => {
    if (editingHouse) {
      await api.updateHouse(houseData);
      setWarningMessage(
        language === 'ml'
          ? `${houseData.name} വിവരങ്ങൾ വിജയകരമായി സേവ് ചെയ്തു!`
          : `Successfully updated ${houseData.name}!`
      );
    } else {
      await api.addHouse(houseData);
      setWarningMessage(
        language === 'ml'
          ? `${houseData.name} വിജയകരമായി ചേർത്തു!`
          : `Successfully added ${houseData.name}!`
      );
    }
    setTimeout(() => setWarningMessage(null), 3000);
    await loadData();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
      {/* Top Header & District Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl md:rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">
              {isDistrictCoordinator
                ? (language === 'ml' ? `${user?.district_name || 'ജില്ലാ'} കോർഡിനേഷൻ പാനൽ` : `${user?.district_name || 'District'} Coordination Panel`)
                : (language === 'ml' ? 'സംസ്ഥാന അഡ്മിൻ വർക്ക് ബെഞ്ച്' : 'State Admin Workbench')}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200">
              {user?.role === 'admin'
                ? (language === 'ml' ? 'സംസ്ഥാന അഡ്മിൻ' : 'State Admin')
                : (language === 'ml' ? 'ജില്ലാ തലം' : 'District Level')}
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-malayalam-bold text-slate-900 leading-tight mt-0.5">
            {isDistrictCoordinator
              ? (language === 'ml' ? `${user?.district_name || 'ജില്ലാ'} പ്രതിനിധികളും താമസ അലോട്ട്മെന്റും` : `${user?.district_name || 'District'} Delegates & Housing Allotment`)
              : (language === 'ml' ? 'താമസ അലോട്ട്മെന്റ് & കൺട്രോൾ പാനൽ' : 'Housing Allotment & Control Panel')}
          </h1>
          <span className="text-xs text-slate-500">
            {language === 'ml' ? '8-ാമത് ബാലസംഘം സംസ്ഥാന സമ്മേളനം • നീലേശ്വരം, പാലായി' : '8th Balasangham State Conference • Nileshwaram, Palayi'}
          </span>
        </div>

        {/* Action Controls: Volunteers Button, Announcements Button & District Filter */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsVolunteersModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-transform active:scale-95 cursor-pointer"
            title={language === 'ml' ? 'വളണ്ടിയർമാരെ ചേർക്കുക / കൈകാര്യം ചെയ്യുക' : 'Manage Volunteers'}
          >
            <Users className="w-4 h-4" />
            <span>
              {language === 'ml'
                ? `വളണ്ടിയർമാർ (${volunteers.length})`
                : `Volunteers (${volunteers.length})`}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setIsAnnouncementsModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-transform active:scale-95 cursor-pointer"
            title={language === 'ml' ? 'സമ്മേളന അറിയിപ്പുകൾ നൽകുക / കൈകാര്യം ചെയ്യുക' : 'Manage Conference Announcements'}
          >
            <Bell className="w-4 h-4" />
            <span>
              {language === 'ml'
                ? `അറിയിപ്പുകൾ (${announcements.length})`
                : `Announcements (${announcements.length})`}
            </span>
          </button>

          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 border border-slate-200 shadow-2xs transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
            title={language === 'ml' ? 'ക്ലൗഡിൽ നിന്ന് ഡാറ്റ പുതുക്കുക' : 'Refresh data from Supabase'}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{language === 'ml' ? 'പുതുക്കുക' : 'Refresh'}</span>
          </button>

          {/* District Filter: Lock for district coordinators, dropdown for state admins */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-600 shrink-0">
              {t('all_districts')}:
            </label>
            {isDistrictCoordinator ? (
              <div className="px-4 py-2 rounded-xl bg-primary-50 text-primary-800 text-xs font-bold border border-primary-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                <span>{user?.district_name || (language === 'ml' ? 'ജില്ല' : 'District')} ({language === 'ml' ? 'ലോക്ക് ചെയ്തത്' : 'Locked'})</span>
              </div>
            ) : (
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
              >
                <option value="all">{language === 'ml' ? 'എല്ലാ ജില്ലകളും (All Districts)' : 'All Districts'}</option>
                {initialDistricts.map((dist) => (
                  <option key={dist.id} value={dist.id.toString()}>
                    {language === 'ml' ? dist.name_ml : dist.name_en}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col">
          <span className="text-xs font-semibold text-slate-400">{t('total_delegates')}</span>
          <span className="text-2xl font-black text-slate-900 mt-1">{totalCount}</span>
          <span className="text-[11px] text-slate-500">{language === 'ml' ? '14 ജില്ലകൾ' : '14 Districts'}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col">
          <span className="text-xs font-semibold text-slate-400">{t('accommodated')}</span>
          <span className="text-2xl font-black text-primary mt-1">{accommodatedCount}</span>
          <span className="text-[11px] text-emerald-600 font-bold">
            {Math.round((accommodatedCount / (totalCount || 1)) * 100)}% {language === 'ml' ? 'പൂർത്തിയായി' : 'Completed'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col">
          <span className="text-xs font-semibold text-slate-400">{t('checked_in')}</span>
          <span className="text-2xl font-black text-emerald-600 mt-1">{checkedInCount}</span>
          <span className="text-[11px] text-slate-500">{language === 'ml' ? 'ഹാജർ നില' : 'Attendance Status'}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col">
          <span className="text-xs font-semibold text-slate-400">{t('pending_arrival')}</span>
          <span className="text-2xl font-black text-amber-600 mt-1">{pendingCount}</span>
          <span className="text-[11px] text-slate-500">{language === 'ml' ? 'വഴിയിലാണ്' : 'En Route'}</span>
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
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <span className="px-2.5 py-0.5 rounded-full bg-primary-100 text-primary-800 text-[11px] font-bold">
                  {selectedDelegateIds.length} {language === 'ml' ? 'തിരഞ്ഞെടുത്തു' : 'selected'}
                </span>
                <select
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val) return;
                    const found = volunteers.find((v) => v.name === val);
                    handleBulkAssignVolunteer(found || null);
                    e.target.value = '';
                  }}
                  className="px-2 py-0.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 text-[11px] font-bold focus:outline-none cursor-pointer"
                >
                  <option value="">{language === 'ml' ? '+ വളണ്ടിയറെ നൽകുക' : '+ Assign Volunteer'}</option>
                  {volunteers.map((vol) => (
                    <option key={vol.id || vol.name} value={vol.name}>
                      {vol.name} {vol.unit ? `(${vol.unit})` : ''}
                    </option>
                  ))}
                </select>
              </div>
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
                placeholder={language === 'ml' ? 'പേരോ ഫോണോ തിരയുക...' : 'Search name or phone...'}
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
                {language === 'ml' ? 'എല്ലാം' : 'All'}
              </button>
              <button
                onClick={() => setGenderFilter('boy')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  genderFilter === 'boy' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {language === 'ml' ? 'ആൺകുട്ടികൾ' : 'Boys'}
              </button>
              <button
                onClick={() => setGenderFilter('girl')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  genderFilter === 'girl' ? 'bg-pink-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {language === 'ml' ? 'പെൺകുട്ടികൾ' : 'Girls'}
              </button>
            </div>
          </div>

          {/* List of Unassigned Delegates */}
          <div className="flex flex-col gap-2.5 max-h-[520px] overflow-y-auto pr-1">
            {unassignedDelegates.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 font-medium">
                {language === 'ml' ? 'എല്ലാ പ്രതിനിധികൾക്കും താമസസ്ഥലം അനുവദിച്ചു!' : 'All delegates have been accommodated!'}
              </div>
            ) : (
              pagedUnassignedDelegates.map((del) => {
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
                        <span className="text-[11px] text-slate-500 truncate flex items-center gap-1.5 flex-wrap">
                          <span>{language === 'ml' ? del.district_ml : del.district_en} • {del.phone || (language === 'ml' ? 'ഫോൺ ഇല്ല' : 'No phone')}</span>
                          {del.volunteer && (
                            <span className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded font-medium flex items-center gap-1">
                              <span>👤 {del.volunteer.name}</span>
                              {del.volunteer.active_location && (
                                <a
                                  href={`https://maps.google.com/?q=${del.volunteer.active_location.lat},${del.volunteer.active_location.lng}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  title="Volunteer Live GPS Active (30 min)"
                                  className="text-[9px] text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-1 rounded flex items-center gap-0.5 font-bold"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping"></span>
                                  <span>Live GPS</span>
                                </a>
                              )}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingDelegate(del);
                        }}
                        title={language === 'ml' ? 'വിവരങ്ങൾ തിരുത്തുക' : 'Edit Delegate'}
                        className="p-1 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-200 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase shrink-0 ${
                          del.gender === 'girl'
                            ? 'bg-pink-100 text-pink-700'
                            : 'bg-sky-100 text-sky-700'
                        }`}
                      >
                        {del.gender === 'girl' ? (language === 'ml' ? 'പെൺകുട്ടി' : 'Girl') : (language === 'ml' ? 'ആൺകുട്ടി' : 'Boy')}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination controls for unassigned delegates */}
          {unassignedDelegates.length > unassignedPageSize && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-500 font-medium">
                {language === 'ml'
                  ? `പേജ് ${safeUnassignedPage} / ${totalUnassignedPages} (${unassignedDelegates.length} പേർ)`
                  : `Page ${safeUnassignedPage} of ${totalUnassignedPages} (${unassignedDelegates.length} items)`}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={safeUnassignedPage <= 1}
                  onClick={() => setUnassignedPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 shadow-2xs"
                >
                  <ChevronLeft className="w-3 h-3" />
                  <span>{language === 'ml' ? 'മുമ്പത്തെ' : 'Prev'}</span>
                </button>
                <button
                  type="button"
                  disabled={safeUnassignedPage >= totalUnassignedPages}
                  onClick={() => setUnassignedPage((p) => Math.min(totalUnassignedPages, p + 1))}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 shadow-2xs"
                >
                  <span>{language === 'ml' ? 'അടുത്തത്' : 'Next'}</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
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
            <div className="flex items-center gap-2.5">
              <span className="text-xs text-slate-400 hidden sm:inline">
                {accommodatedCount} {language === 'ml' ? 'പേർക്ക് അനുവദിച്ചു' : 'accommodated'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setEditingHouse(null);
                  setIsAddingHouse(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-transform active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{language === 'ml' ? 'വീട് ചേർക്കുക' : 'Add House'}</span>
              </button>
            </div>
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
                            {house.gender_restriction === 'girls'
                              ? (language === 'ml' ? 'പെൺകുട്ടികൾക്ക് മാത്രം' : 'Girls Only')
                              : (language === 'ml' ? 'ആൺകുട്ടികൾക്ക് മാത്രം' : 'Boys Only')}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 truncate mt-0.5">
                        {house.address} • {language === 'ml' ? 'ആതിഥേയൻ:' : 'Host:'} {house.host_name} ({house.host_phone})
                      </span>
                    </div>

                    {/* Actions: Edit House Details & Assign Button */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingHouse(house);
                          setIsAddingHouse(true);
                        }}
                        title={language === 'ml' ? 'വീടിന്റെ വിവരങ്ങൾ തിരുത്തുക' : 'Edit House Details'}
                        className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 hover:text-primary transition-colors flex items-center gap-1 text-xs font-semibold"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{language === 'ml' ? 'തിരുത്തുക' : 'Edit'}</span>
                      </button>
                      <button
                        onClick={() => handleAssignToHouse(house)}
                        disabled={selectedDelegateIds.length === 0}
                        className="touch-target px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-600 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold shrink-0 shadow-xs transition-transform active:scale-95 flex items-center gap-1.5"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                        <span>{t('assign_here')}</span>
                      </button>
                    </div>
                  </div>

                  {/* Capacity Bar */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-600">
                        {language === 'ml' ? `കപ്പാസിറ്റി: ${count} / ${house.capacity} പേർ` : `Capacity: ${count} / ${house.capacity} persons`}
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
                        {language === 'ml' ? `ഇവിടെ താമസിക്കുന്നവർ (${currentOccupants.length}):` : `Current Residents (${currentOccupants.length}):`}
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
                              ({language === 'ml' ? (occ.district_ml || occ.district_en) : (occ.district_en || occ.district_ml)})
                            </span>
                            {occ.volunteer && (
                              <span className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-1 py-0.2 rounded font-medium">
                                👤 {occ.volunteer.name}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => setEditingDelegate(occ)}
                              title={language === 'ml' ? 'വിവരങ്ങൾ തിരുത്തുക' : 'Edit Delegate'}
                              className="text-slate-400 hover:text-primary p-0.5 rounded transition-colors"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
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

      {/* Edit Delegate Modal */}
      <EditDelegateModal
        delegate={editingDelegate}
        isOpen={!!editingDelegate}
        onClose={() => setEditingDelegate(null)}
        onSave={handleSaveDelegate}
        volunteers={volunteers}
      />

      {/* Edit / Add House Modal */}
      <EditHouseModal
        house={editingHouse}
        isOpen={isAddingHouse}
        onClose={() => {
          setIsAddingHouse(false);
          setEditingHouse(null);
        }}
        onSave={handleSaveHouse}
      />

      {/* Manage Announcements Modal */}
      <ManageAnnouncementsModal
        isOpen={isAnnouncementsModalOpen}
        onClose={() => setIsAnnouncementsModalOpen(false)}
        announcements={announcements}
        onCreateAnnouncement={handleCreateAnnouncement}
        onDeleteAnnouncement={handleDeleteAnnouncement}
        defaultDistrictId={user?.district_id || null}
      />

      {/* Manage Volunteers Modal */}
      <ManageVolunteersModal
        isOpen={isVolunteersModalOpen}
        onClose={() => setIsVolunteersModalOpen(false)}
        volunteers={volunteers}
        onCreateVolunteer={async (vol) => {
          await api.createVolunteer(vol);
          await loadData(true);
        }}
        onDeleteVolunteer={async (id) => {
          await api.deleteVolunteer(id);
          await loadData(true);
        }}
      />
    </div>
  );
};

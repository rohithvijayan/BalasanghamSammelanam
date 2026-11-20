import React, { useState, useEffect } from 'react';
import { mockStore, initialDistricts } from '../lib/mockData';
import { Delegate, House, LocationPing } from '../types';
import { api } from '../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n/i18nContext';
import {
  UserCheck,
  Clock,
  Home,
  Phone,
  Search,
  MapPin,
  CheckCircle2,
  Share2,
  AlertCircle,
  Users,
  Navigation,
  Shield,
  Filter
} from 'lucide-react';

export const VolunteerDesk: React.FC = () => {
  const { user } = useAuth();
  const { language, t } = useI18n();

  const [delegates, setDelegates] = useState<Delegate[]>(() => mockStore.getDelegates());
  const [houses, setHouses] = useState<House[]>(() => mockStore.getHouses());
  const [activeTab, setActiveTab] = useState<'attendance' | 'houses'>('attendance');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'checked_in' | 'with_location'>('all');
  const [districtFilter, setDistrictFilter] = useState<string>('all');
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [locationPings, setLocationPings] = useState<Record<string, LocationPing>>({});

  const refreshPings = async () => {
    try {
      const pings = await api.getActiveLocationPings();
      setLocationPings(pings);
    } catch (e) {
      console.error('Failed to load active location pings', e);
    }
  };

  const loadData = async () => {
    try {
      const [delData, houseData] = await Promise.all([
        api.getDelegates(),
        api.getHouses(),
      ]);
      setDelegates(delData);
      setHouses(houseData);
    } catch (e) {
      console.warn('Failed to load data from api', e);
    }
  };

  useEffect(() => {
    loadData();
    refreshPings();
    const interval = setInterval(refreshPings, 10000); // Poll every 10s for live GPS updates
    const unsubscribe = mockStore.subscribe(() => {
      loadData();
      refreshPings();
    });
    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  // Filter delegates
  const filteredDelegates = delegates.filter((d) => {
    const matchesSearch =
      searchQuery === '' ||
      d.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.token.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.phone && d.phone.includes(searchQuery));

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'with_location'
        ? Boolean(locationPings[d.id])
        : d.status === statusFilter;

    const matchesDistrict =
      districtFilter === 'all' || d.district_id.toString() === districtFilter;

    return matchesSearch && matchesStatus && matchesDistrict;
  });

  // Metrics
  const totalCount = delegates.length;
  const checkedInCount = delegates.filter((d) => d.status === 'checked_in').length;
  const pendingCount = totalCount - checkedInCount;
  const activePingCount = Object.keys(locationPings).length;
  const checkinPercentage = Math.round((checkedInCount / (totalCount || 1)) * 100);

  // 1-Click Check-in Toggle
  const handleToggleCheckin = (delegate: Delegate) => {
    const newStatus = delegate.status === 'checked_in' ? 'pending' : 'checked_in';
    mockStore.updateStatus(delegate.id, newStatus);

    if (newStatus === 'checked_in') {
      setSuccessToast(language === 'ml' ? `${delegate.full_name} - ഹാജർ രേഖപ്പെടുത്തി!` : `${delegate.full_name} - Checked In!`);
    } else {
      setSuccessToast(language === 'ml' ? `${delegate.full_name} - ഹാജർ ഒഴിവാക്കി.` : `${delegate.full_name} - Check-In Undone.`);
    }
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // WhatsApp stay link sharing
  const handleShareWhatsApp = (delegate: Delegate) => {
    const stayUrl = `${window.location.origin}/d/${delegate.token}`;
    const text = language === 'ml'
      ? `പ്രിയപ്പെട്ട ${delegate.full_name}, ബാലസംഘം സംസ്ഥാന സമ്മേളനത്തിലെ നിങ്ങളുടെ താമസ വിവരങ്ങളും റൂട്ട് മാപ്പും കാണാൻ ഈ ലിങ്ക് ക്ലിക്ക് ചെയ്യുക:\n${stayUrl}`
      : `Dear ${delegate.full_name}, click this link to view your stay details and route map for the Balasangham State Conference:\n${stayUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
      {/* Success Floating Toast */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold border border-slate-700 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">
                {language === 'ml' ? 'വളണ്ടിയർ ഹെൽപ്പ് ഡെസ്ക്' : 'Volunteer Help Desk'}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                {language === 'ml' ? 'സജീവം (Active)' : 'Active'}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-malayalam-bold text-slate-900 leading-tight">
              {language === 'ml' ? 'പ്രതിനിധി സ്വീകരണവും ഹാജർ നിലയും' : 'Delegate Reception & Attendance Tracker'}
            </h1>
            <span className="text-xs text-slate-500">
              {language === 'ml' ? 'ലോഗിൻ ചെയ്തത്:' : 'Logged in as:'} <strong className="text-slate-800">{user?.full_name || (language === 'ml' ? 'വളണ്ടിയർ' : 'Volunteer')}</strong> • {language === 'ml' ? '8-ാമത് സംസ്ഥാന സമ്മേളനം, നീലേശ്വരം' : '8th State Conference, Nileshwaram'}
            </span>
          </div>
        </div>

        {/* Quick Emergency Helplines for Volunteers */}
        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          <a
            href="tel:04985201201"
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-200"
          >
            <Phone className="w-3.5 h-3.5 text-primary" />
            <span>{language === 'ml' ? 'കൺട്രോൾ റൂം: 04985 201201' : 'Control Room: 04985 201201'}</span>
          </a>
          <a
            href="tel:9447123456"
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-200"
          >
            <Phone className="w-3.5 h-3.5 text-emerald-600" />
            <span>{language === 'ml' ? 'അക്കോമഡേഷൻ കൺവീനർ' : 'Accommodation Convener'}</span>
          </a>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col">
          <span className="text-xs font-semibold text-slate-400">
            {language === 'ml' ? 'ആകെ പ്രതിനിധികൾ' : 'Total Delegates'}
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1">{totalCount}</span>
          <span className="text-[11px] text-slate-500">
            {language === 'ml' ? 'രജിസ്റ്റർ ചെയ്തവർ' : 'Registered'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col">
          <span className="text-xs font-semibold text-slate-400">
            {language === 'ml' ? 'ഹാജരായവർ (Checked In)' : 'Checked In'}
          </span>
          <span className="text-2xl font-black text-emerald-600 mt-1">{checkedInCount}</span>
          <span className="text-[11px] text-emerald-600 font-bold">
            {checkinPercentage}% {language === 'ml' ? 'എത്തിയവർ' : 'Arrived'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col">
          <span className="text-xs font-semibold text-slate-400">
            {language === 'ml' ? 'ഇനി എത്താനുള്ളവർ' : 'Pending Arrival'}
          </span>
          <span className="text-2xl font-black text-amber-600 mt-1">{pendingCount}</span>
          <span className="text-[11px] text-amber-600 font-medium">
            {language === 'ml' ? 'വഴിയിലുള്ളവർ' : 'On the Way'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col">
          <span className="text-xs font-semibold text-slate-400">
            {language === 'ml' ? 'ആതിഥേയ വീടുകൾ' : 'Host Houses'}
          </span>
          <span className="text-2xl font-black text-primary mt-1">{houses.length}</span>
          <span className="text-[11px] text-slate-500">
            {language === 'ml' ? 'താമസ കേന്ദ്രങ്ങൾ' : 'Accommodations'}
          </span>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('attendance')}
          className={`pb-3 px-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'attendance'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>
            {language === 'ml'
              ? `പ്രതിനിധികളുടെ ഹാജർ പട്ടിക (${filteredDelegates.length})`
              : `Delegate Attendance List (${filteredDelegates.length})`}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('houses')}
          className={`pb-3 px-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'houses'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>
            {language === 'ml'
              ? `ആതിഥേയ വീടുകൾ (${houses.length})`
              : `Host Houses (${houses.length})`}
          </span>
        </button>
      </div>

      {/* TAB 1: Attendance & Delegate Check-In */}
      {activeTab === 'attendance' && (
        <div className="flex flex-col gap-4">
          {/* Active Live GPS Locations Alert Banner */}
          {activePingCount > 0 && (
            <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-900 font-malayalam-bold">
                      📍 {activePingCount} {language === 'ml' ? 'പ്രതിനിധി(കൾ) തത്സമയ ലൊക്കേഷൻ ഷെയർ ചെയ്തിട്ടുണ്ട്' : 'delegate(s) shared live GPS location'}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <span className="text-[11px] text-amber-700">
                    {language === 'ml'
                      ? 'വഴിയിലുള്ള പ്രതിനിധികളുടെ തത്സമയ ജി.പി.എസ് ലൊക്കേഷൻ Google Maps-ൽ നേരിട്ട് പരിശോധിക്കാം.'
                      : 'View real-time GPS locations of arriving delegates directly on Google Maps.'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setStatusFilter(statusFilter === 'with_location' ? 'all' : 'with_location')}
                className="px-3.5 py-2 rounded-xl bg-amber-200/80 hover:bg-amber-300 text-amber-900 text-xs font-bold transition-colors self-start sm:self-auto shrink-0"
              >
                {statusFilter === 'with_location'
                  ? (language === 'ml' ? 'എല്ലാം കാണിക്കുക' : 'Show All')
                  : (language === 'ml' ? 'ലൊക്കേഷനുള്ളവരെ മാത്രം കാണുക' : 'Show With Location Only')}
              </button>
            </div>
          )}

          {/* Search & Filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'ml' ? 'പേര്, ഫോൺ നമ്പർ, അല്ലെങ്കിൽ ടോക്കൺ തിരയുക...' : 'Search name, phone, or token...'}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Status Pills */}
            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 shrink-0 flex-wrap gap-1">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                {language === 'ml' ? 'എല്ലാം' : 'All'}
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === 'pending' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600'
                }`}
              >
                {language === 'ml' ? `എത്താനുള്ളവർ (${pendingCount})` : `Pending (${pendingCount})`}
              </button>
              <button
                onClick={() => setStatusFilter('checked_in')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === 'checked_in' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600'
                }`}
              >
                {language === 'ml' ? `ഹാജരായവർ (${checkedInCount})` : `Checked In (${checkedInCount})`}
              </button>
              {activePingCount > 0 && (
                <button
                  onClick={() => setStatusFilter(statusFilter === 'with_location' ? 'all' : 'with_location')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    statusFilter === 'with_location' ? 'bg-primary text-white shadow-xs' : 'text-primary bg-primary-50 hover:bg-primary-100'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{language === 'ml' ? `ലൈവ് GPS (${activePingCount})` : `Live GPS (${activePingCount})`}</span>
                </button>
              )}
            </div>

            {/* District Filter */}
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary shrink-0"
            >
              <option value="all">{language === 'ml' ? 'എല്ലാ ജില്ലകളും' : 'All Districts'}</option>
              {initialDistricts.map((d) => (
                <option key={d.id} value={d.id.toString()}>
                  {language === 'ml' ? d.name_ml : d.name_en}
                </option>
              ))}
            </select>
          </div>

          {/* Delegate Cards List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredDelegates.map((del) => {
              const assignedHouse = houses.find((h) => h.id === del.house_id);
              const isCheckedIn = del.status === 'checked_in';
              const ping = locationPings[del.id];

              return (
                <div
                  key={del.id}
                  className={`bg-white rounded-2xl p-4 border transition-all flex flex-col justify-between gap-3 shadow-xs ${
                    isCheckedIn ? 'border-emerald-200/90 bg-emerald-50/20' : 'border-slate-200/90'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-bold text-slate-900 font-malayalam-bold">
                          {del.full_name}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {language === 'ml' ? (del.district_ml || del.district_en) : (del.district_en || del.district_ml)}
                        </span>
                        {del.gender && (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              del.gender === 'girl'
                                ? 'bg-pink-50 text-pink-700 border border-pink-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {del.gender === 'girl' ? (language === 'ml' ? 'പെൺകുട്ടി' : 'Girl') : (language === 'ml' ? 'ആൺകുട്ടി' : 'Boy')}
                          </span>
                        )}
                        {ping && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 animate-pulse">
                            <MapPin className="w-3 h-3 text-primary fill-primary" />
                            <span>{language === 'ml' ? 'GPS ഷെയർ ചെയ്തു' : 'GPS Shared'}</span>
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-mono text-slate-400 mt-0.5">
                        {language === 'ml' ? 'ടോക്കൺ:' : 'Token:'} {del.token}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 shrink-0 ${
                        isCheckedIn
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {isCheckedIn ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{language === 'ml' ? 'ഹാജരായി' : 'Checked In'}</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3" />
                          <span>{language === 'ml' ? 'വഴിയിലാണ്' : 'En Route'}</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* House & Accommodation Details */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col gap-1.5 text-xs text-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-500">
                        {language === 'ml' ? 'താമസസ്ഥലം:' : 'Accommodation:'}
                      </span>
                      <strong className="text-slate-900">
                        {assignedHouse ? assignedHouse.name : (language === 'ml' ? 'അലോട്ട് ചെയ്തിട്ടില്ല' : 'Not Assigned')}
                      </strong>
                    </div>
                    {assignedHouse && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">
                            {language === 'ml' ? 'ആതിഥേയൻ:' : 'Host:'}
                          </span>
                          <span>{assignedHouse.host_name}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">
                            {language === 'ml' ? 'ഫോൺ:' : 'Phone:'}
                          </span>
                          <a
                            href={`tel:${assignedHouse.host_phone}`}
                            className="font-mono font-bold text-primary hover:underline flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{assignedHouse.host_phone}</span>
                          </a>
                        </div>
                      </>
                    )}
                    {del.emergency_phone && (
                      <div className="flex items-center justify-between border-t border-slate-200/50 pt-1 text-[11px]">
                        <span className="text-slate-500">
                          {language === 'ml' ? `രക്ഷാകർത്താവ് (${del.emergency_name}):` : `Guardian (${del.emergency_name}):`}
                        </span>
                        <a
                          href={`tel:${del.emergency_phone}`}
                          className="font-mono font-bold text-slate-700 hover:text-primary"
                        >
                          {del.emergency_phone}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Live GPS Tracking Box */}
                  {ping && (
                    <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                        <div className="flex flex-col text-left">
                          <span className="text-xs font-bold text-amber-950 flex items-center gap-1 font-malayalam-bold">
                            <Navigation className="w-3.5 h-3.5 text-primary" />
                            <span>{language === 'ml' ? 'തത്സമയ ലൊക്കേഷൻ ലഭ്യമാണ് (Live GPS)' : 'Live GPS Location Available'}</span>
                          </span>
                          <span className="text-[11px] text-amber-800 font-mono">
                            {language === 'ml' ? '30 മിനിറ്റ് ട്രാക്കിംഗ്' : '30-min tracking'} • {ping.lat.toFixed(4)}, {ping.lng.toFixed(4)}
                          </span>
                        </div>
                      </div>
                      <a
                        href={`https://www.google.com/maps?q=${ping.lat},${ping.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="touch-target px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-transform active:scale-95 shrink-0"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{language === 'ml' ? 'Google Maps-ൽ കാണുക' : 'Open in Google Maps'}</span>
                      </a>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleToggleCheckin(del)}
                      className={`touch-target flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-98 shadow-xs ${
                        isCheckedIn
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {isCheckedIn
                          ? (language === 'ml' ? 'ഹാജർ ഒഴിവാക്കുക' : 'Undo Check-In')
                          : (language === 'ml' ? 'ഹാജർ രേഖപ്പെടുത്തുക (Check In)' : 'Mark Checked In')}
                      </span>
                    </button>

                    <button
                      onClick={() => handleShareWhatsApp(del)}
                      title={language === 'ml' ? 'WhatsApp-ൽ ലിങ്ക് ഷെയർ ചെയ്യുക' : 'Share Link on WhatsApp'}
                      className="touch-target p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredDelegates.length === 0 && (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center flex flex-col items-center gap-2">
              <Users className="w-10 h-10 text-slate-300" />
              <span className="text-sm font-bold text-slate-700">
                {language === 'ml' ? 'പ്രതിനിധികളെ കണ്ടെത്താനായില്ല' : 'No Delegates Found'}
              </span>
              <span className="text-xs text-slate-400">
                {language === 'ml' ? 'തിരഞ്ഞെടുത്ത ഫിൽട്ടറുകൾ മാറ്റി ശ്രമിക്കുക' : 'Try adjusting your search or filters'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Host Houses Directory */}
      {activeTab === 'houses' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {houses.map((house) => {
            const occupants = delegates.filter((d) => d.house_id === house.id);
            const arrivedOccupants = occupants.filter((d) => d.status === 'checked_in');

            return (
              <div
                key={house.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between gap-4"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-bold text-slate-900 font-malayalam-bold">
                      {house.name}
                    </h3>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-primary-50 text-primary-800 border border-primary-200 shrink-0">
                      {language === 'ml' ? 'കപ്പാസിറ്റി:' : 'Capacity:'} {occupants.length} / {house.capacity}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{house.address}</span>
                  </p>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col gap-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">
                        {language === 'ml' ? 'ആതിഥേയൻ:' : 'Host:'}
                      </span>
                      <strong className="text-slate-900">{house.host_name}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">
                        {language === 'ml' ? 'ഫോൺ നമ്പർ:' : 'Phone Number:'}
                      </span>
                      <a
                        href={`tel:${house.host_phone}`}
                        className="font-mono font-bold text-primary hover:underline flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{house.host_phone}</span>
                      </a>
                    </div>
                  </div>

                  {/* Residents list in this house */}
                  <div className="mt-2 flex flex-col gap-1.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      {language === 'ml'
                        ? `താമസിക്കുന്ന പ്രതിനിധികൾ (${occupants.length}):`
                        : `Assigned Residents (${occupants.length}):`}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {occupants.map((occ) => (
                        <span
                          key={occ.id}
                          className={`text-xs px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1 ${
                            occ.status === 'checked_in'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {occ.status === 'checked_in' ? '✓' : '•'} {occ.full_name}
                        </span>
                      ))}
                      {occupants.length === 0 && (
                        <span className="text-xs text-slate-400 italic">
                          {language === 'ml' ? 'ആരെയും അലോട്ട് ചെയ്തിട്ടില്ല' : 'No delegates assigned yet'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Open in Google Maps */}
                {house.map_url && (
                  <a
                    href={house.map_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="touch-target py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 border border-slate-300 transition-colors"
                  >
                    <Navigation className="w-4 h-4 text-primary" />
                    <span>{language === 'ml' ? 'റൂട്ട് മാപ്പ് കാണുക (Google Maps)' : 'Open in Google Maps'}</span>
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default VolunteerDesk;

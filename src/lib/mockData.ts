import { District, House, Delegate, Announcement, HelplineItem, StayPortalData, LocationPing, Volunteer, VolunteerLocationPing, PaginationParams, PaginatedResult } from '../types';

export const initialDistricts: District[] = [
  { id: 1, name_en: 'Kasaragod', name_ml: 'കാസർഗോഡ്' },
  { id: 2, name_en: 'Kannur', name_ml: 'കണ്ണൂർ' },
  { id: 3, name_en: 'Wayanad', name_ml: 'വയനാട്' },
  { id: 4, name_en: 'Kozhikode', name_ml: 'കോഴിക്കോട്' },
  { id: 5, name_en: 'Malappuram', name_ml: 'മലപ്പുറം' },
  { id: 6, name_en: 'Palakkad', name_ml: 'പാലക്കാട്' },
  { id: 7, name_en: 'Thrissur', name_ml: 'തൃശ്ശൂർ' },
  { id: 8, name_en: 'Ernakulam', name_ml: 'എറണാകുളം' },
  { id: 9, name_en: 'Idukki', name_ml: 'ഇടുക്കി' },
  { id: 10, name_en: 'Kottayam', name_ml: 'കോട്ടയം' },
  { id: 11, name_en: 'Alappuzha', name_ml: 'ആലപ്പുഴ' },
  { id: 12, name_en: 'Pathanamthitta', name_ml: 'പത്തനംതിട്ട' },
  { id: 13, name_en: 'Kollam', name_ml: 'കൊല്ലം' },
  { id: 14, name_en: 'Thiruvananthapuram', name_ml: 'തിരുവനന്തപുരം' },
  { id: 15, name_en: 'State Committee', name_ml: 'സംസ്ഥാന കമ്മിറ്റി' },
];

export const initialHouses: House[] = [];

export const demoHouses: House[] = [
  {
    id: 'h-101',
    name: 'പൂന്തോട്ടം വീട് (Poonthottam House)',
    address: 'വാർഡ് 4, നീലേശ്വരം നഗരസഭ, റെയിൽവേ സ്റ്റേഷൻ റോഡ്, കാസർഗോഡ്',
    host_name: 'കെ. രാഘവൻ (റിട്ട. അധ്യാപകൻ)',
    host_phone: '+91 94471 23456',
    capacity: 4,
    gender_restriction: 'boys',
  },
  {
    id: 'h-102',
    name: 'സൗപർണിക (Souparnika House)',
    address: 'വാർഡ് 2, കോളേജ് റോഡ്, നീലേശ്വരം, കാസർഗോഡ്',
    host_name: 'പ്രൊഫ. സുജാത എം.',
    host_phone: '+91 98462 89001',
    capacity: 6,
    gender_restriction: 'girls',
  },
  {
    id: 'h-103',
    name: 'മംഗല്യ നിലയം (Mangalya Nilayam)',
    address: 'വാർഡ് 6, പഴയ ബസ് സ്റ്റാൻഡ് റോഡ്, നീലേശ്വരം',
    host_name: 'പി. വി. ബാലകൃഷ്ണൻ',
    host_phone: '+91 97455 33012',
    capacity: 5,
    gender_restriction: 'boys',
  },
  {
    id: 'h-104',
    name: 'ശ്രീലകം (Sreelakam)',
    address: 'വാർഡ് 8, തളി ക്ഷേത്ര റോഡ്, നീലേശ്വരം',
    host_name: 'കെ. നാരായണൻ നമ്പൂതിരി',
    host_phone: '+91 94460 88219',
    capacity: 4,
    gender_restriction: 'boys',
  }
];

export const initialAnnouncements: Announcement[] = [];

export const demoAnnouncements: Announcement[] = [
  {
    id: 'ann-1',
    title_en: 'Cultural Conference at 5:30 PM',
    title_ml: 'സാംസ്കാരിക സമ്മേളനം കൃത്യം 5:30-ന്',
    body_en: 'The evening cultural session begins at 5:30 PM sharp in the Main Auditorium. All delegates must be seated by 5:15 PM.',
    body_ml: 'വൈകുന്നേരത്തെ സാംസ്കാരിക സമ്മേളനം കൃത്യം 5:30-ന് മുഖ്യവേദിയിൽ ആരംഭിക്കും. എല്ലാ പ്രതിനിധികളും 5:15-ഓടെ എത്തിച്ചേരുക.',
    pinned: true,
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: 'ann-2',
    title_en: 'Lunch Arrangements at Dining Hall B',
    title_ml: 'ഭക്ഷണശാല അറിയിപ്പ്',
    body_en: 'Lunch will be served from 1:00 PM to 2:30 PM in Hall B. Please display your delegate badge at the entrance.',
    body_ml: 'ഉച്ചഭക്ഷണം ഉച്ചയ്ക്ക് 1:00 മുതൽ 2:30 വരെ ഹാൾ B-യിൽ ലഭ്യമാണ്. ബാഡ്ജ് നിർബന്ധമായും കാണിക്കുക.',
    pinned: false,
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  {
    id: 'ann-3',
    title_en: 'Special Shuttle Bus Timing',
    title_ml: 'സ്പെഷ്യൽ ബസ് സർവീസ്',
    body_en: 'Dedicated shuttle buses from accommodation clusters to main venue will start at 4:30 PM.',
    body_ml: 'താമസ കേന്ദ്രങ്ങളിൽ നിന്നുള്ള പ്രത്യേക ബസ് സർവീസ് വൈകുന്നേരം 4:30 PM-ന് ആരംഭിക്കും.',
    pinned: false,
    created_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
  }
];

export const helplinesList: HelplineItem[] = [
  { title_ml: 'കൺട്രോൾ റൂം 1 (24/7)', title_en: 'Control Room 1 (24/7)', phone: '9400945049' },
  { title_ml: 'കൺട്രോൾ റൂം 2 (24/7)', title_en: 'Control Room 2 (24/7)', phone: '7012768605' },
  { title_ml: 'കൺട്രോൾ റൂം 3 (24/7)', title_en: 'Control Room 3 (24/7)', phone: '7902619430' },
  { title_ml: 'കൺട്രോൾ റൂം 4 (24/7)', title_en: 'Control Room 4 (24/7)', phone: '9846738223' },
  { title_ml: 'വളണ്ടിയർ ഡെസ്പാച്ച് 1', title_en: 'Volunteer Despatch 1', phone: '9846307261' },
  { title_ml: 'വളണ്ടിയർ ഡെസ്പാച്ച് 2', title_en: 'Volunteer Despatch 2', phone: '9048982088' },
  { title_ml: 'മെഡിക്കൽ എമർജൻസി (24/7)', title_en: 'Medical Emergency (24/7)', phone: '8281833858' },
];

export const defaultVolunteers: Volunteer[] = [
  { name: 'രേഷ്മ പി. (Reshma P.)', phone: '+91 98460 78901', unit: 'നീലേശ്വരം ഈസ്റ്റ്' },
  { name: 'അഞ്ജലി കൃഷ്ണൻ (Anjali Krishnan)', phone: '+91 98461 99012', unit: 'കോളേജ് വാർഡ്' },
  { name: 'വിപിൻ ദാസ് (Vipin Das)', phone: '+91 94472 33445', unit: 'റെയിൽവേ സ്റ്റേഷൻ ഡെസ്ക്' },
  { name: 'രാഹുൽ രാജ് (Rahul Raj)', phone: '+91 97455 66778', unit: 'സമ്മേളന നഗരി' },
  { name: 'സ്നേഹ കെ. (Sneha K.)', phone: '+91 94951 22334', unit: 'ഭക്ഷണശാല കൺട്രോൾ' },
];

export const initialDelegates: Delegate[] = [];

export const demoDelegates: Delegate[] = [
  {
    id: 'del-1',
    token: 'kannur-arjun-412',
    full_name: 'അർജുൻ കെ. (Arjun K.)',
    phone: '+91 98470 11223',
    district_id: 2,
    district_en: 'Kannur',
    district_ml: 'കണ്ണൂർ',
    gender: 'boy',
    house_id: 'h-101',
    volunteer: { name: 'രേഷ്മ പി.', phone: '+91 98460 78901', unit: 'നീലേശ്വരം ഈസ്റ്റ്' },
    status: 'checked_in',
    checked_in_at: new Date().toISOString(),
  },
  {
    id: 'del-2',
    token: 'malappuram-fathima-204',
    full_name: 'ഫാത്തിമ ഷെറിൻ (Fathima Sherin)',
    phone: '+91 94002 81109',
    district_id: 5,
    district_en: 'Malappuram',
    district_ml: 'മലപ്പുറം',
    gender: 'girl',
    house_id: 'h-102',
    volunteer: { name: 'അഞ്ജലി കൃഷ്ണൻ', phone: '+91 98461 99012', unit: 'കോളേജ് വാർഡ്' },
    status: 'checked_in',
    checked_in_at: new Date().toISOString(),
  },
  {
    id: 'del-3',
    token: 'palakkad-adarsh-512',
    full_name: 'ആദർശ് എം. (Adarsh M.)',
    phone: '+91 98471 11029',
    district_id: 6,
    district_en: 'Palakkad',
    district_ml: 'പാലക്കാട്',
    gender: 'boy',
    house_id: null,
    volunteer: null,
    status: 'pending',
  },
  {
    id: 'del-4',
    token: 'palakkad-nithin-513',
    full_name: 'നിതിൻ കൃഷ്ണൻ (Nithin Krishnan)',
    phone: '+91 97455 33012',
    district_id: 6,
    district_en: 'Palakkad',
    district_ml: 'പാലക്കാട്',
    gender: 'boy',
    house_id: null,
    volunteer: null,
    status: 'pending',
  },
  {
    id: 'del-wayanad-kg4jio',
    token: 'wayanad-kg4jio',
    full_name: 'അഭിനന്ദ് സി.വി. (Abhinand C.V.)',
    phone: '+91 94000 77112',
    district_id: 3,
    district_en: 'Wayanad',
    district_ml: 'വയനാട്',
    gender: 'boy',
    house_id: 'h-101',
    volunteer: { name: 'രേഷ്മ പി.', phone: '+91 98460 78901', unit: 'നീലേശ്വരം ഈസ്റ്റ്' },
    status: 'pending',
  },
  {
    id: 'del-5',
    token: 'wayanad-abhinand-319',
    full_name: 'അഭിനന്ദ് സി.വി. (Abhinand C.V.)',
    phone: '+91 94000 77112',
    district_id: 3,
    district_en: 'Wayanad',
    district_ml: 'വയനാട്',
    gender: 'boy',
    house_id: null,
    volunteer: null,
    status: 'pending',
  },
  {
    id: 'del-6',
    token: 'kannur-anand-391',
    full_name: 'ആനന്ദ് കെ. (Anand K.)',
    phone: '+91 98472 22019',
    district_id: 2,
    district_en: 'Kannur',
    district_ml: 'കണ്ണൂർ',
    gender: 'boy',
    house_id: 'h-101',
    volunteer: { name: 'രേഷ്മ പി.', phone: '+91 98460 78901', unit: 'നീലേശ്വരം ഈസ്റ്റ്' },
    status: 'checked_in',
    checked_in_at: new Date().toISOString(),
  }
];

// Known mock/demo tokens and house IDs to purge from production data
export const MOCK_TOKENS = new Set([
  'kannur-arjun-412',
  'malappuram-fathima-204',
  'palakkad-adarsh-512',
  'palakkad-nithin-513',
  'wayanad-abhinand-319',
  'kannur-anand-391',
]);

export const MOCK_HOUSE_IDS = new Set(['h-101', 'h-102', 'h-103', 'h-104']);

export const MOCK_ANNOUNCEMENT_IDS = new Set(['ann-1', 'ann-2', 'ann-3']);

// Cache Time-To-Live: 5 hours (persists delegates, houses, volunteers & announcements across visits)
export const CACHE_TTL_MS = 5 * 60 * 60 * 1000;

export const getHouseNaturalKey = (h: House | { name?: string; host_phone?: string; id?: string }): string => {
  const cleanName = (h.name || '').trim().toLowerCase();
  const cleanPhone = (h.host_phone || '').trim().replace(/[^0-9]/g, '');
  if (cleanName) {
    return cleanPhone ? `${cleanName}::${cleanPhone}` : cleanName;
  }
  return (h.id || '').trim().toLowerCase();
};

export const normalizePhone = (phone?: string | null): string => {
  if (!phone) return '';
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.length >= 10) {
    return digits.slice(-10);
  }
  return digits;
};

export const getVolunteerNaturalKey = (v: Volunteer | { name?: string; phone?: string; id?: string }): string => {
  const cleanPhone = normalizePhone(v.phone);
  const cleanName = (v.name || '').trim().toLowerCase();
  if (cleanPhone && cleanName) {
    return `${cleanName}::${cleanPhone}`;
  }
  if (cleanPhone) return cleanPhone;
  if (cleanName) return cleanName;
  return (v.id || '').trim().toLowerCase();
};

// In-Memory Reactive Store (Local state with localStorage sync & TTL)
class MockStore {
  private delegates: Delegate[];
  private houses: House[];
  private volunteers: Volunteer[] = [];
  private announcements: Announcement[];
  private locationPings: Record<string, LocationPing> = {};
  private volunteerLocationPings: Record<string, VolunteerLocationPing> = {};
  private listeners: (() => void)[] = [];

  constructor() {
    const cacheTs = parseInt(localStorage.getItem('sammelanam_cache_ts') || '0', 10);
    const isExpired = Date.now() - cacheTs > CACHE_TTL_MS;

    const savedDelegates = localStorage.getItem('sammelanam_delegates');
    if (savedDelegates && !isExpired) {
      try {
        const parsed: Delegate[] = JSON.parse(savedDelegates);
        // Deduplicate saved delegates and purge any leftover mock/demo delegates
        const tokenMap = new Map<string, Delegate>();
        for (const d of parsed) {
          const key = (d.token || d.id).toLowerCase().trim();
          if (!MOCK_TOKENS.has(key)) {
            tokenMap.set(key, d);
          }
        }
        this.delegates = Array.from(tokenMap.values());
      } catch {
        this.delegates = [];
      }
    } else {
      this.delegates = [];
    }

    const savedHouses = localStorage.getItem('sammelanam_houses');
    if (savedHouses && !isExpired) {
      try {
        const parsed: House[] = JSON.parse(savedHouses);
        const houseMap = new Map<string, House>();
        for (const h of parsed) {
          if (!MOCK_HOUSE_IDS.has(h.id)) {
            const key = getHouseNaturalKey(h);
            const existing = houseMap.get(key);
            if (!existing) {
              houseMap.set(key, h);
            } else {
              houseMap.set(key, { ...h, id: existing.id || h.id });
            }
          }
        }
        this.houses = Array.from(houseMap.values());
      } catch {
        this.houses = [];
      }
    } else {
      this.houses = [];
    }

    const savedVolunteers = localStorage.getItem('sammelanam_volunteers');
    if (savedVolunteers && !isExpired) {
      try {
        this.volunteers = JSON.parse(savedVolunteers);
      } catch {
        this.volunteers = [...defaultVolunteers];
      }
    } else {
      this.volunteers = [...defaultVolunteers];
    }

    const savedPings = localStorage.getItem('sammelanam_location_pings');
    this.locationPings = savedPings ? JSON.parse(savedPings) : {};

    const savedVolPings = localStorage.getItem('sammelanam_volunteer_pings');
    this.volunteerLocationPings = savedVolPings ? JSON.parse(savedVolPings) : {};

    const savedAnnouncements = localStorage.getItem('sammelanam_announcements');
    if (savedAnnouncements && !isExpired) {
      try {
        const parsed: Announcement[] = JSON.parse(savedAnnouncements);
        this.announcements = parsed.filter((a) => !MOCK_ANNOUNCEMENT_IDS.has(a.id));
      } catch {
        this.announcements = [];
      }
    } else {
      this.announcements = [];
    }
  }

  private save(notify = true) {
    localStorage.setItem('sammelanam_delegates', JSON.stringify(this.delegates));
    localStorage.setItem('sammelanam_houses', JSON.stringify(this.houses));
    localStorage.setItem('sammelanam_volunteers', JSON.stringify(this.volunteers));
    localStorage.setItem('sammelanam_announcements', JSON.stringify(this.announcements));
    localStorage.setItem('sammelanam_location_pings', JSON.stringify(this.locationPings));
    localStorage.setItem('sammelanam_volunteer_pings', JSON.stringify(this.volunteerLocationPings));
    localStorage.setItem('sammelanam_cache_ts', Date.now().toString());
    if (notify) {
      this.listeners.forEach((cb) => cb());
    }
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  getDelegates(): Delegate[] {
    const activeVolPings = this.getActiveVolunteerLocationPings();
    const volMap = new Map<string, Volunteer>();
    for (const v of this.volunteers) {
      if (v.id) volMap.set(v.id, v);
    }
    return this.delegates.map((d) => {
      let resolvedVol = d.volunteer;
      if (!resolvedVol && d.volunteer_id) {
        resolvedVol = volMap.get(d.volunteer_id) || null;
      }
      if (resolvedVol) {
        const keyName = (resolvedVol.name || '').trim().toLowerCase();
        const keyPhone = (resolvedVol.phone || '').replace(/[^0-9]/g, '');
        const active_location = activeVolPings[keyName] || (keyPhone ? activeVolPings[keyPhone] : null);
        return {
          ...d,
          volunteer: {
            ...resolvedVol,
            active_location: active_location || null,
          },
          volunteer_id: resolvedVol.id || d.volunteer_id || null,
        };
      }
      return d;
    });
  }

  getHouses(): House[] {
    const houseMap = new Map<string, House>();
    const idRemap = new Map<string, string>();
    let hadDuplicates = false;

    for (const h of this.houses) {
      if (!MOCK_HOUSE_IDS.has(h.id)) {
        const key = getHouseNaturalKey(h);
        const existing = houseMap.get(key);
        if (existing) {
          hadDuplicates = true;
          if (h.id && existing.id && h.id !== existing.id) {
            idRemap.set(h.id, existing.id);
          }
        } else {
          houseMap.set(key, h);
        }
      }
    }

    if (hadDuplicates) {
      this.houses = Array.from(houseMap.values());
      if (idRemap.size > 0) {
        this.delegates = this.delegates.map((d) => {
          if (d.house_id && idRemap.has(d.house_id)) {
            return { ...d, house_id: idRemap.get(d.house_id)! };
          }
          return d;
        });
      }
      this.save();
    }

    const volMap = new Map<string, Volunteer>();
    for (const v of this.volunteers) {
      if (v.id) volMap.set(v.id, v);
    }

    return this.houses.map((h) => {
      const resolvedVol = h.volunteer || (h.volunteer_id ? volMap.get(h.volunteer_id) : null) || null;
      return {
        ...h,
        volunteer: resolvedVol,
        volunteer_id: resolvedVol?.id || h.volunteer_id || null,
      };
    });
  }

  getVolunteers(): Volunteer[] {
    return this.volunteers;
  }

  addVolunteer(vol: Omit<Volunteer, 'id'> & { id?: string }): Volunteer {
    const fullVol: Volunteer = {
      ...vol,
      id: vol.id || 'vol-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      name: vol.name.trim(),
      phone: vol.phone.trim(),
      unit: (vol.unit || '').trim(),
    };
    const idx = this.volunteers.findIndex(
      (v) => (v.id && v.id === fullVol.id) || v.name.toLowerCase() === fullVol.name.toLowerCase()
    );
    if (idx >= 0) {
      this.volunteers[idx] = fullVol;
    } else {
      this.volunteers = [fullVol, ...this.volunteers];
    }
    this.save(true);
    return fullVol;
  }

  deleteVolunteer(idOrName: string) {
    const clean = idOrName.toLowerCase().trim();
    this.volunteers = this.volunteers.filter(
      (v) => (v.id ? v.id.toLowerCase() !== clean : true) && v.name.toLowerCase() !== clean
    );
    this.save(true);
  }

  updateVolunteer(updated: Partial<Volunteer> & { id: string }): Volunteer | null {
    let found = false;
    this.volunteers = this.volunteers.map((v) => {
      if (v.id === updated.id) {
        found = true;
        return {
          ...v,
          ...updated,
          name: updated.name !== undefined ? updated.name.trim() : v.name,
          phone: updated.phone !== undefined ? updated.phone.trim() : v.phone,
          unit: updated.unit !== undefined ? (updated.unit.trim() || undefined) : v.unit,
        };
      }
      return v;
    });
    this.save(true);
    return found ? this.volunteers.find((v) => v.id === updated.id) || null : null;
  }

  setVolunteers(volunteers: Volunteer[], notify = false) {
    this.volunteers = volunteers;
    this.save(notify);
  }

  importVolunteers(newVolunteers: Volunteer[]) {
    const volMap = new Map<string, Volunteer>();
    for (const v of this.volunteers) {
      const key = getVolunteerNaturalKey(v);
      volMap.set(key, v);
    }
    for (const v of newVolunteers) {
      const key = getVolunteerNaturalKey(v);
      const existing = volMap.get(key);
      if (existing) {
        volMap.set(key, { ...existing, ...v, id: existing.id || v.id });
      } else {
        volMap.set(key, v);
      }
    }
    this.volunteers = Array.from(volMap.values());
    this.save(true);
  }

  clearLocalVolunteers() {
    this.volunteers = [];
    localStorage.removeItem('sammelanam_volunteers');
    this.save(true);
  }

  getAnnouncements(): Announcement[] {
    return this.announcements;
  }

  addAnnouncement(ann: Omit<Announcement, 'id' | 'created_at' | 'pinned'> & { id?: string; created_at?: string; pinned?: boolean }): Announcement {
    const newAnn: Announcement = {
      id: ann.id || 'ann-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      title_en: ann.title_en,
      title_ml: ann.title_ml,
      body_en: ann.body_en,
      body_ml: ann.body_ml,
      pinned: Boolean(ann.pinned),
      target_district_id: ann.target_district_id || null,
      created_at: ann.created_at || new Date().toISOString(),
    };
    this.announcements = [newAnn, ...this.announcements.filter((a) => a.id !== newAnn.id)];
    this.save();
    return newAnn;
  }

  deleteAnnouncement(id: string) {
    this.announcements = this.announcements.filter((a) => a.id !== id);
    this.save();
  }

  setAnnouncements(announcements: Announcement[], notify = false) {
    this.announcements = announcements.filter((a) => !MOCK_ANNOUNCEMENT_IDS.has(a.id));
    this.save(notify);
  }

  clearLocalAnnouncements() {
    this.announcements = [];
    localStorage.removeItem('sammelanam_announcements');
    this.save();
  }

  getPaginatedDelegates(params: PaginationParams = {}): PaginatedResult<Delegate> {
    const {
      page = 1,
      pageSize = 25,
      search = '',
      districtId = 'all',
      gender = 'all',
      status = 'all',
      unassignedOnly = false,
    } = params;

    const all = this.getDelegates();
    const cleanSearch = search.toLowerCase().trim();

    const filtered = all.filter((d) => {
      if (unassignedOnly && d.house_id) return false;
      if (districtId !== 'all' && d.district_id.toString() !== districtId.toString()) return false;
      if (gender !== 'all' && d.gender !== gender) return false;
      if (status !== 'all' && d.status !== status) return false;
      if (cleanSearch) {
        const matchesName = d.full_name.toLowerCase().includes(cleanSearch);
        const matchesToken = d.token.toLowerCase().includes(cleanSearch);
        const matchesPhone = d.phone && d.phone.includes(cleanSearch);
        if (!matchesName && !matchesToken && !matchesPhone) return false;
      }
      return true;
    });

    const totalCount = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = (safePage - 1) * pageSize;
    const paginatedData = filtered.slice(start, start + pageSize);

    return {
      data: paginatedData,
      totalCount,
      page: safePage,
      pageSize,
      totalPages,
    };
  }

  getPaginatedHouses(page = 1, pageSize = 20, search = ''): PaginatedResult<House> {
    const all = this.getHouses();
    const clean = search.toLowerCase().trim();
    const filtered = clean
      ? all.filter((h) => h.name.toLowerCase().includes(clean) || h.address.toLowerCase().includes(clean))
      : all;

    const totalCount = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = (safePage - 1) * pageSize;
    const paginatedData = filtered.slice(start, start + pageSize);

    return {
      data: paginatedData,
      totalCount,
      page: safePage,
      pageSize,
      totalPages,
    };
  }

  getDelegateByToken(token: string): StayPortalData | null {
    const clean = token.toLowerCase().trim();
    const cleanDigits = clean.replace(/[^0-9]/g, '');
    const cleanLast10 = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : cleanDigits;

    const matchesDelegate = (d: Delegate) => {
      if (d.token.toLowerCase() === clean || d.id.toLowerCase() === clean) return true;
      if (d.phone) {
        const dDigits = d.phone.replace(/[^0-9]/g, '');
        const dLast10 = dDigits.length >= 10 ? dDigits.slice(-10) : dDigits;
        if (cleanDigits.length >= 7 && (dDigits === cleanDigits || (cleanLast10 && dLast10 && cleanLast10 === dLast10))) {
          return true;
        }
      }
      return false;
    };

    let delegate = this.delegates.find(matchesDelegate);

    const activeVolPings = this.getActiveVolunteerLocationPings();
    const resolveVol = (v?: Volunteer | null): Volunteer | null => {
      if (!v) return null;
      const keyName = (v.name || '').trim().toLowerCase();
      const keyPhone = (v.phone || '').replace(/[^0-9]/g, '');
      const last10 = keyPhone.length >= 10 ? keyPhone.slice(-10) : keyPhone;
      const active_location =
        activeVolPings[keyName] ||
        (keyPhone ? activeVolPings[keyPhone] : null) ||
        (last10 ? activeVolPings[last10] : null);
      return {
        ...v,
        active_location: active_location || null,
      };
    };

    // Fallback to demo delegates for tests or direct demo URL access
    if (!delegate) {
      delegate = demoDelegates.find(matchesDelegate);
      if (!delegate) return null;
      const demoHouse = demoHouses.find((h) => h.id === delegate?.house_id) || null;
      const targetDelegate = delegate;
      let vol = targetDelegate.volunteer;
      if (!vol && targetDelegate.volunteer_id) {
        vol = this.volunteers.find((v) => v.id === targetDelegate.volunteer_id) || null;
      }
      const resolvedVol = resolveVol(vol);
      return {
        delegate: { ...delegate, volunteer: resolvedVol },
        house: demoHouse,
        volunteer: resolvedVol,
        announcements: this.announcements.length > 0 ? this.announcements : demoAnnouncements,
        helplines: helplinesList,
      };
    }

    const house = delegate.house_id ? this.houses.find((h) => h.id === delegate.house_id) || null : null;
    let vol = delegate.volunteer;
    if (!vol && delegate.volunteer_id) {
      vol = this.volunteers.find((v) => v.id === delegate.volunteer_id) || null;
    }
    const resolvedVol = resolveVol(vol);

    return {
      delegate: { ...delegate, volunteer: resolvedVol },
      house,
      volunteer: resolvedVol,
      announcements: this.announcements,
      helplines: helplinesList,
    };
  }

  assignVolunteer(delegateId: string, volunteer: Volunteer | null) {
    this.delegates = this.delegates.map((d) =>
      d.id === delegateId
        ? { ...d, volunteer, volunteer_id: volunteer?.id || null }
        : d
    );
    this.save();
  }

  bulkAssignVolunteer(delegateIds: string[], volunteer: Volunteer | null) {
    const idSet = new Set(delegateIds);
    this.delegates = this.delegates.map((d) =>
      idSet.has(d.id)
        ? { ...d, volunteer, volunteer_id: volunteer?.id || null }
        : d
    );
    this.save();
  }

  assignHouse(delegateId: string, houseId: string | null) {
    const targetHouse = houseId ? this.houses.find((h) => h.id === houseId) : null;
    let houseVol: Volunteer | null = targetHouse?.volunteer || null;
    if (!houseVol && targetHouse?.volunteer_id) {
      houseVol = this.volunteers.find((v) => v.id === targetHouse.volunteer_id) || null;
    }
    this.delegates = this.delegates.map((d) => {
      if (d.id === delegateId) {
        if (!houseId) {
          // Removal of delegate from a house -> Empty the volunteer field
          return {
            ...d,
            house_id: null,
            volunteer: null,
            volunteer_id: null,
          };
        }
        // Assigned to a house with volunteer B -> Overwrite volunteer field with the house's volunteer
        return {
          ...d,
          house_id: houseId,
          volunteer: houseVol,
          volunteer_id: houseVol?.id || null,
        };
      }
      return d;
    });
    this.save();
  }

  bulkAssign(delegateIds: string[], houseId: string | null) {
    const targetHouse = houseId ? this.houses.find((h) => h.id === houseId) : null;
    let houseVol: Volunteer | null = targetHouse?.volunteer || null;
    if (!houseVol && targetHouse?.volunteer_id) {
      houseVol = this.volunteers.find((v) => v.id === targetHouse.volunteer_id) || null;
    }
    const idSet = new Set(delegateIds);
    this.delegates = this.delegates.map((d) => {
      if (idSet.has(d.id)) {
        if (!houseId) {
          // Removal of delegates from a house -> Empty the volunteer field
          return {
            ...d,
            house_id: null,
            volunteer: null,
            volunteer_id: null,
          };
        }
        // Assigned to a house with volunteer B -> Overwrite volunteer field with the house's volunteer
        return {
          ...d,
          house_id: houseId,
          volunteer: houseVol,
          volunteer_id: houseVol?.id || null,
        };
      }
      return d;
    });
    this.save();
  }

  assignHouseVolunteer(houseId: string, volunteer: Volunteer | null) {
    this.houses = this.houses.map((h) =>
      h.id === houseId
        ? { ...h, volunteer, volunteer_id: volunteer?.id || null }
        : h
    );
    // Auto-update all delegates residing in this house
    this.delegates = this.delegates.map((d) =>
      d.house_id === houseId
        ? { ...d, volunteer, volunteer_id: volunteer?.id || null }
        : d
    );
    this.save();
  }

  updateStatus(delegateId: string, status: Delegate['status']) {
    this.delegates = this.delegates.map((d) =>
      d.id === delegateId
        ? {
            ...d,
            status,
            checked_in_at: status === 'checked_in' ? new Date().toISOString() : d.checked_in_at,
          }
        : d
    );
    this.save();
  }

  updateDelegate(updated: Partial<Delegate> & { id: string }) {
    this.delegates = this.delegates.map((d) =>
      d.id === updated.id ? { ...d, ...updated } : d
    );
    this.save();
  }

  updateHouse(updated: Partial<House> & { id: string }) {
    let newVol = updated.volunteer;
    if (newVol === undefined && updated.volunteer_id !== undefined) {
      newVol = updated.volunteer_id ? this.volunteers.find((v) => v.id === updated.volunteer_id) || null : null;
    }

    this.houses = this.houses.map((h) => {
      if (h.id === updated.id) {
        return {
          ...h,
          ...updated,
          ...(newVol !== undefined ? { volunteer: newVol, volunteer_id: newVol?.id || null } : {}),
        };
      }
      return h;
    });

    if (newVol !== undefined) {
      this.delegates = this.delegates.map((d) =>
        d.house_id === updated.id
          ? { ...d, volunteer: newVol, volunteer_id: newVol?.id || null }
          : d
      );
    }
    this.save();
  }

  addHouse(house: Omit<House, 'id'> & { id?: string }): House {
    const fullHouse: House = {
      ...house,
      id: house.id || 'h-' + Date.now(),
    };
    if (!this.houses.some((h) => h.id === fullHouse.id)) {
      this.houses = [...this.houses, fullHouse];
    } else {
      this.houses = this.houses.map((h) => (h.id === fullHouse.id ? fullHouse : h));
    }
    this.save();
    return fullHouse;
  }

  importDelegates(newDelegates: Delegate[]) {
    const tokenMap = new Map<string, Delegate>();
    // Exclude mock demo delegates from existing
    for (const d of this.delegates) {
      const key = (d.token || d.id).toLowerCase().trim();
      if (!MOCK_TOKENS.has(key)) {
        tokenMap.set(key, d);
      }
    }
    // Add newly imported delegates
    for (const d of newDelegates) {
      const key = (d.token || d.id).toLowerCase().trim();
      if (!MOCK_TOKENS.has(key)) {
        const existing = tokenMap.get(key);
        tokenMap.set(key, existing ? { ...existing, ...d } : d);
      }
    }
    this.delegates = Array.from(tokenMap.values());
    this.save();
  }

  setDelegates(delegates: Delegate[], notify = false) {
    const tokenMap = new Map<string, Delegate>();
    for (const d of delegates) {
      const key = (d.token || d.id).toLowerCase().trim();
      if (!MOCK_TOKENS.has(key)) {
        tokenMap.set(key, d);
      }
    }
    this.delegates = Array.from(tokenMap.values());
    this.save(notify);
  }

  clearLocalDelegates() {
    this.delegates = [];
    localStorage.removeItem('sammelanam_delegates');
    localStorage.removeItem('sammelanam_cache_ts');
    this.save();
  }

  importHouses(newHouses: House[]) {
    const houseMap = new Map<string, House>();
    const idRemap = new Map<string, string>();

    for (const h of this.houses) {
      if (!MOCK_HOUSE_IDS.has(h.id)) {
        const key = getHouseNaturalKey(h);
        houseMap.set(key, h);
      }
    }
    for (const h of newHouses) {
      if (!MOCK_HOUSE_IDS.has(h.id)) {
        const key = getHouseNaturalKey(h);
        const existing = houseMap.get(key);
        if (existing) {
          if (h.id && existing.id && h.id !== existing.id) {
            idRemap.set(h.id, existing.id);
          }
          houseMap.set(key, { ...existing, ...h, id: existing.id || h.id });
        } else {
          houseMap.set(key, h);
        }
      }
    }
    this.houses = Array.from(houseMap.values());
    if (idRemap.size > 0) {
      this.delegates = this.delegates.map((d) => {
        if (d.house_id && idRemap.has(d.house_id)) {
          return { ...d, house_id: idRemap.get(d.house_id)! };
        }
        return d;
      });
    }
    this.save();
  }

  setHouses(houses: House[], notify = false) {
    const houseMap = new Map<string, House>();
    const idRemap = new Map<string, string>();

    for (const h of houses) {
      if (!MOCK_HOUSE_IDS.has(h.id)) {
        const key = getHouseNaturalKey(h);
        const existing = houseMap.get(key);
        if (existing) {
          if (h.id && existing.id && h.id !== existing.id) {
            idRemap.set(h.id, existing.id);
          }
          houseMap.set(key, { ...existing, ...h, id: existing.id || h.id });
        } else {
          houseMap.set(key, h);
        }
      }
    }
    this.houses = Array.from(houseMap.values());
    if (idRemap.size > 0) {
      this.delegates = this.delegates.map((d) => {
        if (d.house_id && idRemap.has(d.house_id)) {
          return { ...d, house_id: idRemap.get(d.house_id)! };
        }
        return d;
      });
    }
    this.save(notify);
  }

  clearLocalHouses() {
    this.houses = [];
    localStorage.removeItem('sammelanam_houses');
    this.save();
  }

  loadDemoData() {
    this.delegates = [...demoDelegates];
    this.houses = [...demoHouses];
    this.announcements = [...demoAnnouncements];
    this.save();
  }

  recordLocationPing(tokenOrId: string, lat: number, lng: number, accuracy?: number) {
    const clean = tokenOrId.toLowerCase().trim();
    let delegate = this.delegates.find(
      (d) => d.token.toLowerCase() === clean || d.id === tokenOrId
    );
    if (!delegate) {
      delegate = demoDelegates.find(
        (d) => d.token.toLowerCase() === clean || d.id === tokenOrId
      );
    }
    const delId = delegate ? delegate.id : tokenOrId;
    const now = new Date();
    const expires = new Date(now.getTime() + 30 * 60 * 1000);
    const pingObj: LocationPing = {
      delegate_id: delId,
      lat,
      lng,
      accuracy,
      created_at: now.toISOString(),
      expires_at: expires.toISOString(),
    };
    this.locationPings[delId] = pingObj;
    this.locationPings[clean] = pingObj;
    this.save();
  }

  getActiveLocationPings(): Record<string, LocationPing> {
    const now = Date.now();
    const active: Record<string, LocationPing> = {};
    for (const [delId, ping] of Object.entries(this.locationPings)) {
      if (new Date(ping.expires_at).getTime() > now) {
        active[delId] = ping;
      }
    }
    return active;
  }

  recordVolunteerLocationPing(name: string, phone: string, lat: number, lng: number, accuracy?: number) {
    const cleanName = (name || '').trim().toLowerCase();
    const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
    const now = new Date();
    const expires = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes
    const pingObj: VolunteerLocationPing = {
      volunteer_name: name,
      volunteer_phone: phone,
      lat,
      lng,
      accuracy,
      created_at: now.toISOString(),
      expires_at: expires.toISOString(),
    };
    if (cleanName) this.volunteerLocationPings[cleanName] = pingObj;
    if (cleanPhone) {
      this.volunteerLocationPings[cleanPhone] = pingObj;
      const last10 = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : cleanPhone;
      if (last10) this.volunteerLocationPings[last10] = pingObj;
    }
    this.save();
  }

  clearVolunteerLocationPing(name: string, phone?: string) {
    const cleanName = (name || '').trim().toLowerCase();
    const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
    for (const [key, ping] of Object.entries(this.volunteerLocationPings)) {
      const matchName = cleanName && (key === cleanName || (ping.volunteer_name || '').trim().toLowerCase() === cleanName);
      const matchPhone = cleanPhone && (key === cleanPhone || (ping.volunteer_phone || '').replace(/[^0-9]/g, '') === cleanPhone);
      if (matchName || matchPhone) {
        delete this.volunteerLocationPings[key];
      }
    }
    this.save();
  }

  getActiveVolunteerLocationPings(): Record<string, VolunteerLocationPing> {
    const now = Date.now();
    const active: Record<string, VolunteerLocationPing> = {};
    for (const [key, ping] of Object.entries(this.volunteerLocationPings)) {
      if (new Date(ping.expires_at).getTime() > now) {
        active[key] = ping;
      }
    }
    return active;
  }
}

export const mockStore = new MockStore();

// Resilient volunteer-to-delegate association matcher (matches by ID, phone, name, or house in-charge)
export const isDelegateAssignedToVolunteer = (
  delegate: Delegate,
  volunteerIdentifier: { id?: string; name?: string; phone?: string },
  housesList?: House[]
): boolean => {
  if (!delegate) return false;
  // Match by direct volunteer_id
  if (volunteerIdentifier.id && delegate.volunteer_id && delegate.volunteer_id === volunteerIdentifier.id) {
    return true;
  }
  // Match by delegate.volunteer
  if (delegate.volunteer) {
    if (volunteerIdentifier.id && delegate.volunteer.id && delegate.volunteer.id === volunteerIdentifier.id) {
      return true;
    }
    // Match by normalized phone
    if (volunteerIdentifier.phone && delegate.volunteer.phone) {
      const p1 = normalizePhone(delegate.volunteer.phone);
      const p2 = normalizePhone(volunteerIdentifier.phone);
      if (p1 && p2 && p1 === p2) return true;
    }
    // Match by name
    if (volunteerIdentifier.name && delegate.volunteer.name) {
      const n1 = delegate.volunteer.name.trim().toLowerCase();
      const n2 = volunteerIdentifier.name.trim().toLowerCase();
      if (n1 === n2) return true;
    }
  }

  // Match by house in-charge volunteer auto-inheritance
  if (housesList && delegate.house_id) {
    const house = housesList.find((h) => h.id === delegate.house_id);
    if (house) {
      if (volunteerIdentifier.id && house.volunteer_id && house.volunteer_id === volunteerIdentifier.id) {
        return true;
      }
      if (house.volunteer) {
        if (volunteerIdentifier.id && house.volunteer.id && house.volunteer.id === volunteerIdentifier.id) {
          return true;
        }
        if (volunteerIdentifier.phone && house.volunteer.phone) {
          const p1 = normalizePhone(house.volunteer.phone);
          const p2 = normalizePhone(volunteerIdentifier.phone);
          if (p1 && p2 && p1 === p2) return true;
        }
        if (volunteerIdentifier.name && house.volunteer.name) {
          const n1 = house.volunteer.name.trim().toLowerCase();
          const n2 = volunteerIdentifier.name.trim().toLowerCase();
          if (n1 === n2) return true;
        }
      }
    }
  }

  return false;
};

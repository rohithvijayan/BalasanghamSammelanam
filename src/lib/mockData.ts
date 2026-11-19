import { District, House, Delegate, Announcement, HelplineItem, StayPortalData, LocationPing } from '../types';

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
];

export const initialHouses: House[] = [
  {
    id: 'h-101',
    name: 'പൂന്തോട്ടം വീട് (Poonthottam House)',
    address: 'വാർഡ് 4, നീലേശ്വരം നഗരസഭ, റെയിൽവേ സ്റ്റേഷൻ റോഡ്, കാസർഗോഡ്',
    map_url: 'https://www.google.com/maps/search/?api=1&query=12.2530,75.1290',
    lat: 12.2530,
    lng: 75.1290,
    host_name: 'കെ. രാഘവൻ (റിട്ട. അധ്യാപകൻ)',
    host_phone: '+91 94471 23456',
    capacity: 4,
    gender_restriction: 'boys',
    notes: 'റെയിൽവേ സ്റ്റേഷനിൽ നിന്ന് 500 മീറ്റർ. കുടിവെള്ളവും ഫാനും ലഭ്യമാണ്.',
  },
  {
    id: 'h-102',
    name: 'സൗപർണിക (Souparnika House)',
    address: 'വാർഡ് 2, കോളേജ് റോഡ്, നീലേശ്വരം, കാസർഗോഡ്',
    map_url: 'https://www.google.com/maps/search/?api=1&query=12.2510,75.1250',
    lat: 12.2510,
    lng: 75.1250,
    host_name: 'പ്രൊഫ. സുജാത എം.',
    host_phone: '+91 98462 89001',
    capacity: 6,
    gender_restriction: 'girls',
    notes: 'സമ്മേളന നഗരിക്ക് സമീപം. വിശാലമായ ഹാൾ, അറ്റാച്ച്ഡ് ബാത്ത്റൂം.',
  },
  {
    id: 'h-103',
    name: 'മംഗല്യ നിലയം (Mangalya Nilayam)',
    address: 'വാർഡ് 6, പഴയ ബസ് സ്റ്റാൻഡ് റോഡ്, നീലേശ്വരം',
    map_url: 'https://www.google.com/maps/search/?api=1&query=12.2540,75.1310',
    lat: 12.2540,
    lng: 75.1310,
    host_name: 'പി. വി. ബാലകൃഷ്ണൻ',
    host_phone: '+91 97455 33012',
    capacity: 5,
    gender_restriction: 'boys',
    notes: 'പാലായി സമ്മേളന നഗരിക്ക് 5 മിനിറ്റ് നടത്തം.',
  },
  {
    id: 'h-104',
    name: 'ശ്രീലകം (Sreelakam)',
    address: 'വാർഡ് 8, തളി ക്ഷേത്ര റോഡ്, നീലേശ്വരം',
    map_url: 'https://www.google.com/maps/search/?api=1&query=12.2500,75.1270',
    lat: 12.2500,
    lng: 75.1270,
    host_name: 'കെ. നാരായണൻ നമ്പൂതിരി',
    host_phone: '+91 94460 88219',
    capacity: 4,
    gender_restriction: 'boys',
    notes: 'ശാന്തമായ അന്തരീക്ഷം.',
  }
];

export const initialAnnouncements: Announcement[] = [
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
  { title_ml: 'കൺട്രോൾ റൂം (24/7)', title_en: 'Control Room Desk', phone: '04985201201' },
  { title_ml: 'മെഡിക്കൽ എയ്ഡ് & ആംബുലൻസ്', title_en: 'Medical Emergency', phone: '9400011223' },
  { title_ml: 'റെസ്ക്യൂ & വളണ്ടിയർ വിങ്', title_en: 'Volunteer Dispatch', phone: '9447123456' }
];

export const initialDelegates: Delegate[] = [
  {
    id: 'del-1',
    token: 'kannur-arjun-412',
    full_name: 'അർജുൻ കെ. (Arjun K.)',
    phone: '+91 98470 11223',
    district_id: 2,
    district_en: 'Kannur',
    district_ml: 'കണ്ണൂർ',
    gender: 'boy',
    emergency_name: 'സുരേഷ് കെ. (അച്ഛൻ)',
    emergency_phone: '+91 94460 21990',
    notes: 'കണ്ണൂർ സൗത്ത് യൂണിറ്റ്',
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
    emergency_name: 'അബ്ദുൽ റഹ്മാൻ (രക്ഷാകർത്താവ്)',
    emergency_phone: '+91 98461 44556',
    notes: 'നിലമ്പൂർ ഏരിയ',
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
    emergency_name: 'മോഹനൻ എം. (അച്ഛൻ)',
    emergency_phone: '+91 94460 21991',
    notes: 'ചിറ്റൂർ ഏരിയ',
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
    emergency_name: 'കൃഷ്ണൻകുട്ടി',
    emergency_phone: '+91 94471 88992',
    notes: 'ആലത്തൂർ',
    house_id: null,
    volunteer: null,
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
    emergency_name: 'ചന്ദ്രൻ സി.വി.',
    emergency_phone: '+91 98460 33441',
    notes: 'മാനന്തവാടി',
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
    emergency_name: 'കുമാരൻ കെ.',
    emergency_phone: '+91 94460 11994',
    notes: 'തളിപ്പറമ്പ്',
    house_id: 'h-101',
    volunteer: { name: 'രേഷ്മ പി.', phone: '+91 98460 78901', unit: 'നീലേശ്വരം ഈസ്റ്റ്' },
    status: 'checked_in',
    checked_in_at: new Date().toISOString(),
  }
];

// In-Memory Reactive Store (Local state with localStorage sync)
class MockStore {
  private delegates: Delegate[];
  private houses: House[];
  private announcements: Announcement[];
  private locationPings: Record<string, LocationPing> = {};
  private listeners: (() => void)[] = [];

  constructor() {
    const savedDelegates = localStorage.getItem('sammelanam_delegates');
    if (savedDelegates) {
      try {
        const parsed: Delegate[] = JSON.parse(savedDelegates);
        // Deduplicate saved delegates by token or id to immediately cleanse any poisoned/duplicated local storage
        const tokenMap = new Map<string, Delegate>();
        for (const d of parsed) {
          const key = (d.token || d.id).toLowerCase().trim();
          tokenMap.set(key, d);
        }
        this.delegates = Array.from(tokenMap.values());
      } catch {
        this.delegates = [...initialDelegates];
      }
    } else {
      this.delegates = [...initialDelegates];
    }

    const savedHouses = localStorage.getItem('sammelanam_houses');
    if (savedHouses) {
      try {
        const parsed: House[] = JSON.parse(savedHouses);
        const houseMap = new Map<string, House>();
        for (const h of parsed) {
          const key = (h.id || h.name).toLowerCase().trim();
          houseMap.set(key, h);
        }
        this.houses = Array.from(houseMap.values());
      } catch {
        this.houses = [...initialHouses];
      }
    } else {
      this.houses = [...initialHouses];
    }

    const savedPings = localStorage.getItem('sammelanam_location_pings');
    this.locationPings = savedPings ? JSON.parse(savedPings) : {};

    this.announcements = initialAnnouncements;
  }

  private save() {
    localStorage.setItem('sammelanam_delegates', JSON.stringify(this.delegates));
    localStorage.setItem('sammelanam_houses', JSON.stringify(this.houses));
    localStorage.setItem('sammelanam_location_pings', JSON.stringify(this.locationPings));
    this.listeners.forEach((cb) => cb());
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  getDelegates(): Delegate[] {
    return this.delegates;
  }

  getHouses(): House[] {
    return this.houses;
  }

  getAnnouncements(): Announcement[] {
    return this.announcements;
  }

  getDelegateByToken(token: string): StayPortalData | null {
    const delegate = this.delegates.find((d) => d.token.toLowerCase() === token.toLowerCase());
    if (!delegate) return null;

    const house = delegate.house_id ? this.houses.find((h) => h.id === delegate.house_id) || null : null;

    return {
      delegate,
      house,
      volunteer: delegate.volunteer || {
        name: 'രേഷ്മ പി. (Reshma P.)',
        phone: '+91 98460 78901',
        unit: 'യൂണിറ്റ് വളണ്ടിയർ • നീലേശ്വരം',
      },
      announcements: this.announcements,
      helplines: helplinesList,
    };
  }

  assignHouse(delegateId: string, houseId: string | null) {
    this.delegates = this.delegates.map((d) => (d.id === delegateId ? { ...d, house_id: houseId } : d));
    this.save();
  }

  bulkAssign(delegateIds: string[], houseId: string) {
    this.delegates = this.delegates.map((d) => (delegateIds.includes(d.id) ? { ...d, house_id: houseId } : d));
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

  importDelegates(newDelegates: Delegate[]) {
    const tokenMap = new Map<string, Delegate>();
    for (const d of this.delegates) {
      const key = (d.token || d.id).toLowerCase().trim();
      tokenMap.set(key, d);
    }
    for (const d of newDelegates) {
      const key = (d.token || d.id).toLowerCase().trim();
      const existing = tokenMap.get(key);
      tokenMap.set(key, existing ? { ...existing, ...d } : d);
    }
    this.delegates = Array.from(tokenMap.values());
    this.save();
  }

  setDelegates(delegates: Delegate[]) {
    const tokenMap = new Map<string, Delegate>();
    for (const d of delegates) {
      const key = (d.token || d.id).toLowerCase().trim();
      tokenMap.set(key, d);
    }
    this.delegates = Array.from(tokenMap.values());
    this.save();
  }

  clearLocalDelegates() {
    this.delegates = [...initialDelegates];
    localStorage.removeItem('sammelanam_delegates');
    this.save();
  }

  importHouses(newHouses: House[]) {
    const houseMap = new Map<string, House>();
    for (const h of this.houses) {
      const key = (h.id || h.name).toLowerCase().trim();
      houseMap.set(key, h);
    }
    for (const h of newHouses) {
      const key = (h.id || h.name).toLowerCase().trim();
      const existing = houseMap.get(key);
      houseMap.set(key, existing ? { ...existing, ...h } : h);
    }
    this.houses = Array.from(houseMap.values());
    this.save();
  }

  setHouses(houses: House[]) {
    const houseMap = new Map<string, House>();
    for (const h of houses) {
      const key = (h.id || h.name).toLowerCase().trim();
      houseMap.set(key, h);
    }
    this.houses = Array.from(houseMap.values());
    this.save();
  }

  clearLocalHouses() {
    this.houses = [...initialHouses];
    localStorage.removeItem('sammelanam_houses');
    this.save();
  }

  recordLocationPing(tokenOrId: string, lat: number, lng: number, accuracy?: number) {
    const delegate = this.delegates.find(
      (d) => d.token.toLowerCase() === tokenOrId.toLowerCase() || d.id === tokenOrId
    );
    if (!delegate) return;
    const now = new Date();
    const expires = new Date(now.getTime() + 30 * 60 * 1000);
    this.locationPings[delegate.id] = {
      delegate_id: delegate.id,
      lat,
      lng,
      accuracy,
      created_at: now.toISOString(),
      expires_at: expires.toISOString(),
    };
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
}

export const mockStore = new MockStore();

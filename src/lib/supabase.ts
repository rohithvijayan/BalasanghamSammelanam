import { createClient } from '@supabase/supabase-js';
import { mockStore, getHouseNaturalKey } from './mockData';
import { StayPortalData, DelegateStatus, LocationPing, Delegate, House, Volunteer, VolunteerLocationPing, Announcement } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// =========================================================================
// Network Egress Optimization: In-Memory TTL Cache & In-Flight Deduplication
// =========================================================================
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const TTL_DELEGATES = 25000;       // 25s cache
const TTL_HOUSES = 30000;          // 30s cache
const TTL_ANNOUNCEMENTS = 25000;   // 25s cache
const TTL_PINGS = 15000;           // 15s cache

let delegatesCache: CacheEntry<Delegate[]> | null = null;
let housesCache: CacheEntry<House[]> | null = null;
const announcementsCache = new Map<string, CacheEntry<Announcement[]>>();
let locationPingsCache: CacheEntry<Record<string, LocationPing>> | null = null;
let volunteerPingsCache: CacheEntry<Record<string, VolunteerLocationPing>> | null = null;

let inflightDelegates: Promise<Delegate[]> | null = null;
let inflightHouses: Promise<House[]> | null = null;
const inflightAnnouncements = new Map<string, Promise<Announcement[]>>();
let inflightLocationPings: Promise<Record<string, LocationPing>> | null = null;
let inflightVolunteerPings: Promise<Record<string, VolunteerLocationPing>> | null = null;

export const invalidateCache = (target?: 'delegates' | 'houses' | 'announcements' | 'pings' | 'all') => {
  if (!target || target === 'all') {
    delegatesCache = null;
    housesCache = null;
    announcementsCache.clear();
    locationPingsCache = null;
    volunteerPingsCache = null;
  } else if (target === 'delegates') {
    delegatesCache = null;
  } else if (target === 'houses') {
    housesCache = null;
  } else if (target === 'announcements') {
    announcementsCache.clear();
  } else if (target === 'pings') {
    locationPingsCache = null;
    volunteerPingsCache = null;
  }
};

// Unified Data Service: Seamlessly switches between live Supabase and mock/local store
export const api = {
  // Fetch all delegates (Supabase live with fallback to mockStore, with deduplication & caching)
  async getDelegates(forceRefresh = false): Promise<Delegate[]> {
    if (!forceRefresh && delegatesCache && Date.now() - delegatesCache.timestamp < TTL_DELEGATES) {
      return delegatesCache.data;
    }

    if (inflightDelegates) {
      return inflightDelegates;
    }

    inflightDelegates = (async () => {
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('delegates')
            .select(`
              id,
              token,
              full_name,
              phone,
              district_id,
              gender,
              emergency_name,
              emergency_phone,
              notes,
              house_id,
              status,
              checked_in_at,
              districts (
                id,
                name_en,
                name_ml
              )
            `)
            .order('created_at', { ascending: false });

          if (!error && data && data.length > 0) {
            const mapped = data.map((row: any) => ({
              id: row.id,
              token: row.token,
              full_name: row.full_name,
              phone: row.phone || '',
              district_id: row.district_id,
              district_en: row.districts?.name_en || 'Kannur',
              district_ml: row.districts?.name_ml || 'കണ്ണൂർ',
              gender: row.gender || 'boy',
              emergency_name: row.emergency_name || '',
              emergency_phone: row.emergency_phone || '',
              notes: row.notes || '',
              house_id: row.house_id,
              status: row.status,
              checked_in_at: row.checked_in_at,
            }));
            delegatesCache = { data: mapped, timestamp: Date.now() };
            mockStore.setDelegates(mapped, false);
            return mapped;
          }
        } catch (err) {
          console.warn('Failed to fetch delegates from Supabase, falling back to mockStore', err);
        }
      }
      const local = mockStore.getDelegates();
      delegatesCache = { data: local, timestamp: Date.now() };
      return local;
    })().finally(() => {
      inflightDelegates = null;
    });

    return inflightDelegates;
  },

  // Fetch all accommodation houses (Supabase live with fallback, with deduplication & caching)
  async getHouses(forceRefresh = false): Promise<House[]> {
    if (!forceRefresh && housesCache && Date.now() - housesCache.timestamp < TTL_HOUSES) {
      return housesCache.data;
    }

    if (inflightHouses) {
      return inflightHouses;
    }

    inflightHouses = (async () => {
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('houses')
            .select('*')
            .order('name', { ascending: true });

          if (!error && data && data.length > 0) {
            const mapped = data.map((row: any) => ({
              id: row.id,
              name: row.name,
              address: row.address,
              map_url: row.map_url,
              lat: row.lat,
              lng: row.lng,
              host_name: row.host_name,
              host_phone: row.host_phone,
              capacity: row.capacity,
              gender_restriction: row.gender_restriction,
              notes: row.notes,
            }));

            // Deduplicate by natural key so duplicate rows in Supabase never balloon the UI
            const uniqueMap = new Map<string, House>();
            for (const h of mapped) {
              const key = getHouseNaturalKey(h);
              if (!uniqueMap.has(key)) {
                uniqueMap.set(key, h);
              }
            }
            const uniqueHouses = Array.from(uniqueMap.values());
            housesCache = { data: uniqueHouses, timestamp: Date.now() };
            mockStore.setHouses(uniqueHouses, false);
            return uniqueHouses;
          }
        } catch (err) {
          console.warn('Failed to fetch houses from Supabase, falling back to mockStore', err);
        }
      }
      const local = mockStore.getHouses();
      housesCache = { data: local, timestamp: Date.now() };
      return local;
    })().finally(() => {
      inflightHouses = null;
    });

    return inflightHouses;
  },

  // Bulk import delegates to Supabase
  async importDelegates(delegates: Delegate[]): Promise<{ count: number; error?: string }> {
    // 1. Deduplicate by token to prevent duplicate rows
    const uniqueMap = new Map<string, Delegate>();
    for (const d of delegates) {
      const key = (d.token || d.id || `${d.full_name}-${d.phone}`).toLowerCase().trim();
      uniqueMap.set(key, d);
    }
    const uniqueDelegates = Array.from(uniqueMap.values());

    if (supabase) {
      const rows = uniqueDelegates.map((d, idx) => ({
        token: d.token || `del-${Math.random().toString(36).substring(2, 9)}-${idx}`,
        full_name: d.full_name,
        phone: d.phone || null,
        district_id: d.district_id || 2,
        gender: d.gender || 'boy',
        emergency_name: d.emergency_name || null,
        emergency_phone: d.emergency_phone || null,
        notes: d.notes || null,
        status: (d.status as DelegateStatus) || 'pending',
      }));

      // Method 1: Try secure, fast RPC (bypasses table column restrictions and runs in one transaction)
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('import_delegates', {
          p_delegates: rows,
        });

        if (!rpcError && rpcData?.success) {
          mockStore.importDelegates(uniqueDelegates);
          return { count: rpcData.count || uniqueDelegates.length };
        }
        if (rpcError) {
          console.warn('RPC import_delegates error, trying direct upsert fallback', rpcError);
        }
      } catch (e) {
        console.warn('RPC import_delegates exception', e);
      }

      // Method 2: Fallback to batch upsert
      const batchSize = 50;
      let insertedCount = 0;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const { data, error } = await supabase
          .from('delegates')
          .upsert(batch, { onConflict: 'token' })
          .select('id, token, full_name');

        if (error) {
          console.error('Supabase importDelegates error:', error);
          if (error.message?.includes('permission denied')) {
            throw new Error(
              'Supabase permission denied for table delegates. Please run the script in supabase/fix_permissions.sql in your Supabase SQL Editor.'
            );
          }
          throw new Error(error.message);
        }
        if (data) {
          insertedCount += data.length;
        }
      }

      // Also sync to mockStore
      mockStore.importDelegates(uniqueDelegates);
      invalidateCache('delegates');
      return { count: insertedCount || uniqueDelegates.length };
    }

    mockStore.importDelegates(uniqueDelegates);
    invalidateCache('delegates');
    return { count: uniqueDelegates.length };
  },

  // Bulk import houses to Supabase
  async importHouses(houses: House[]): Promise<{ count: number; error?: string }> {
    const uniqueMap = new Map<string, House>();
    for (const h of houses) {
      const key = getHouseNaturalKey(h);
      uniqueMap.set(key, h);
    }
    const uniqueHouses = Array.from(uniqueMap.values());

    if (supabase) {
      try {
        // Fetch existing houses to avoid duplicate rows
        const { data: existingRows } = await supabase
          .from('houses')
          .select('id, name, host_phone');

        const existingMap = new Map<string, string>(); // naturalKey -> id
        if (existingRows) {
          for (const r of existingRows) {
            const key = getHouseNaturalKey(r);
            existingMap.set(key, r.id);
          }
        }

        const toInsert: any[] = [];
        const toUpdate: { id: string; data: any }[] = [];

        for (const h of uniqueHouses) {
          const key = getHouseNaturalKey(h);
          const existingId = existingMap.get(key);
          const payload = {
            name: h.name,
            address: h.address,
            map_url: h.map_url || null,
            lat: h.lat || null,
            lng: h.lng || null,
            host_name: h.host_name,
            host_phone: h.host_phone,
            capacity: h.capacity || 4,
            gender_restriction: h.gender_restriction || 'any',
            notes: h.notes || null,
          };

          if (existingId) {
            toUpdate.push({ id: existingId, data: payload });
          } else {
            toInsert.push(payload);
          }
        }

        if (toInsert.length > 0) {
          const { error: insErr } = await supabase.from('houses').insert(toInsert);
          if (insErr) {
            console.error('Supabase importHouses insert error:', insErr);
            if (insErr.message?.includes('permission denied')) {
              throw new Error(
                'Supabase permission denied for houses. Please run supabase/fix_permissions.sql in your Supabase SQL Editor.'
              );
            }
            throw new Error(insErr.message);
          }
        }

        if (toUpdate.length > 0) {
          await Promise.all(
            toUpdate.map((item) =>
              supabase.from('houses').update(item.data).eq('id', item.id)
            )
          );
        }

        mockStore.importHouses(uniqueHouses);
        invalidateCache('houses');
        return { count: uniqueHouses.length };
      } catch (err: any) {
        console.warn('Supabase importHouses error, fallback to mockStore', err);
        mockStore.importHouses(uniqueHouses);
        invalidateCache('houses');
        return { count: uniqueHouses.length, error: err.message };
      }
    }
    mockStore.importHouses(uniqueHouses);
    invalidateCache('houses');
    return { count: uniqueHouses.length };
  },
  // Fetch delegate stay details using secure token
  async getMyStay(token: string): Promise<StayPortalData | null> {
    if (supabase) {
      const { data, error } = await supabase.rpc('get_my_stay', { p_token: token });
      if (error || !data || !data.success) {
        console.warn('Supabase get_my_stay error, falling back to mock store', error);
        return mockStore.getDelegateByToken(token);
      }
      let resolvedVolunteer = data.volunteer;
      if (resolvedVolunteer && !resolvedVolunteer.active_location) {
        const volPings = await api.getActiveVolunteerLocationPings();
        const cleanName = (resolvedVolunteer.name || '').trim().toLowerCase();
        const cleanPhone = (resolvedVolunteer.phone || '').replace(/[^0-9]/g, '');
        const activeLoc = volPings[cleanName] || (cleanPhone ? volPings[cleanPhone] : null);
        resolvedVolunteer = {
          ...resolvedVolunteer,
          active_location: activeLoc || null,
        };
      }
      return {
        delegate: data.delegate,
        house: data.house,
        volunteer: resolvedVolunteer,
        announcements: data.announcements || [],
        helplines: data.helpline || [],
      };
    }
    return mockStore.getDelegateByToken(token);
  },

  // Share temporary volunteer live location (30 mins)
  async shareVolunteerLocation(name: string, phone: string, lat: number, lng: number, accuracy?: number): Promise<{ success: boolean }> {
    invalidateCache('pings');
    if (supabase) {
      try {
        const { data, error } = await supabase.rpc('share_volunteer_location', {
          p_name: name,
          p_phone: phone,
          p_lat: lat,
          p_lng: lng,
          p_accuracy: accuracy || null,
        });
        if (!error && data?.success) {
          mockStore.recordVolunteerLocationPing(name, phone, lat, lng, accuracy);
          return { success: true };
        }
      } catch (err) {
        console.warn('Supabase share_volunteer_location failed, falling back to mock store', err);
      }
    }
    mockStore.recordVolunteerLocationPing(name, phone, lat, lng, accuracy);
    return { success: true };
  },

  // Clear/stop volunteer live location sharing
  async clearVolunteerLocation(name: string, phone?: string): Promise<{ success: boolean }> {
    invalidateCache('pings');
    mockStore.clearVolunteerLocationPing(name, phone);
    return { success: true };
  },

  // Fetch active volunteer location pings (for delegates and admins)
  async getActiveVolunteerLocationPings(forceRefresh = false): Promise<Record<string, VolunteerLocationPing>> {
    if (!forceRefresh && volunteerPingsCache && Date.now() - volunteerPingsCache.timestamp < TTL_PINGS) {
      return volunteerPingsCache.data;
    }

    if (inflightVolunteerPings) {
      return inflightVolunteerPings;
    }

    inflightVolunteerPings = (async () => {
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('volunteer_location_pings')
            .select('id, volunteer_name, volunteer_phone, lat, lng, accuracy, created_at, expires_at')
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false });

          if (!error && data) {
            const pings: Record<string, VolunteerLocationPing> = {};
            data.forEach((p: any) => {
              const cleanName = (p.volunteer_name || '').trim().toLowerCase();
              const cleanPhone = (p.volunteer_phone || '').replace(/[^0-9]/g, '');
              if (cleanName && !pings[cleanName]) pings[cleanName] = p;
              if (cleanPhone && !pings[cleanPhone]) pings[cleanPhone] = p;
            });
            volunteerPingsCache = { data: pings, timestamp: Date.now() };
            return pings;
          }
        } catch (err) {
          console.warn('Failed to query volunteer_location_pings from Supabase, fallback to store', err);
        }
      }
      const local = mockStore.getActiveVolunteerLocationPings();
      volunteerPingsCache = { data: local, timestamp: Date.now() };
      return local;
    })().finally(() => {
      inflightVolunteerPings = null;
    });

    return inflightVolunteerPings;
  },

  // Share temporary location ping (30 mins)
  async shareLocation(token: string, lat: number, lng: number, accuracy?: number): Promise<{ success: boolean }> {
    invalidateCache('pings');
    if (supabase) {
      const { data, error } = await supabase.rpc('share_location', {
        p_token: token,
        p_lat: lat,
        p_lng: lng,
        p_accuracy: accuracy || null,
      });
      if (!error && data?.success) {
        mockStore.recordLocationPing(token, lat, lng, accuracy);
        return { success: true };
      }
    }
    mockStore.recordLocationPing(token, lat, lng, accuracy);
    console.log('[MOCK LOCATION SHARED]', { token, lat, lng, accuracy, expires_in: '30m' });
    return { success: true };
  },

  // Fetch active location pings (for admin and volunteers)
  async getActiveLocationPings(forceRefresh = false): Promise<Record<string, LocationPing>> {
    if (!forceRefresh && locationPingsCache && Date.now() - locationPingsCache.timestamp < TTL_PINGS) {
      return locationPingsCache.data;
    }

    if (inflightLocationPings) {
      return inflightLocationPings;
    }

    inflightLocationPings = (async () => {
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('location_pings')
            .select('id, delegate_id, lat, lng, accuracy, created_at, expires_at')
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false });

          if (!error && data) {
            const pings: Record<string, LocationPing> = {};
            data.forEach((p: any) => {
              if (!pings[p.delegate_id]) {
                pings[p.delegate_id] = p;
              }
            });
            locationPingsCache = { data: pings, timestamp: Date.now() };
            return pings;
          }
        } catch (err) {
          console.warn('Failed to query location_pings from Supabase, fallback to store', err);
        }
      }
      const local = mockStore.getActiveLocationPings();
      locationPingsCache = { data: local, timestamp: Date.now() };
      return local;
    })().finally(() => {
      inflightLocationPings = null;
    });

    return inflightLocationPings;
  },

  // Update check-in status (Admin/Staff)
  async updateDelegateStatus(delegateId: string, status: DelegateStatus): Promise<boolean> {
    invalidateCache('delegates');
    if (supabase) {
      const { error } = await supabase
        .from('delegates')
        .update({
          status,
          checked_in_at: status === 'checked_in' ? new Date().toISOString() : null,
        })
        .eq('id', delegateId);
      if (!error) return true;
    }
    mockStore.updateStatus(delegateId, status);
    return true;
  },

  // Assign delegate to house (Admin)
  async assignHouse(delegateId: string, houseId: string | null): Promise<boolean> {
    invalidateCache('delegates');
    invalidateCache('houses');
    if (supabase) {
      const { error } = await supabase
        .from('delegates')
        .update({ house_id: houseId })
        .eq('id', delegateId);
      if (!error) return true;
    }
    mockStore.assignHouse(delegateId, houseId);
    return true;
  },

  // Bulk assign delegates (Admin)
  async bulkAssign(delegateIds: string[], houseId: string): Promise<boolean> {
    invalidateCache('delegates');
    invalidateCache('houses');
    if (supabase) {
      const { error } = await supabase
        .from('delegates')
        .update({ house_id: houseId })
        .in('id', delegateIds);
      if (!error) return true;
    }
    mockStore.bulkAssign(delegateIds, houseId);
    return true;
  },

  // Assign volunteer to delegate (Admin)
  async assignVolunteer(delegateId: string, volunteer: Volunteer | null): Promise<boolean> {
    invalidateCache('delegates');
    mockStore.assignVolunteer(delegateId, volunteer);
    return true;
  },

  // Bulk assign volunteer to multiple delegates (Admin)
  async bulkAssignVolunteer(delegateIds: string[], volunteer: Volunteer | null): Promise<boolean> {
    invalidateCache('delegates');
    mockStore.bulkAssignVolunteer(delegateIds, volunteer);
    return true;
  },

  // Edit delegate details (Admin)
  async updateDelegate(delegate: Partial<Delegate> & { id: string }): Promise<boolean> {
    invalidateCache('delegates');
    mockStore.updateDelegate(delegate);
    if (supabase) {
      try {
        const { error } = await supabase
          .from('delegates')
          .update({
            full_name: delegate.full_name,
            phone: delegate.phone,
            district_id: delegate.district_id,
            gender: delegate.gender,
            emergency_name: delegate.emergency_name,
            emergency_phone: delegate.emergency_phone,
            notes: delegate.notes,
          })
          .eq('id', delegate.id);
        if (error) {
          console.warn('Supabase updateDelegate error:', error);
        }
      } catch (e) {
        console.warn('Failed to update delegate in Supabase', e);
      }
    }
    return true;
  },

  // Edit house details (Admin)
  async updateHouse(house: Partial<House> & { id: string }): Promise<boolean> {
    invalidateCache('houses');
    mockStore.updateHouse(house);
    if (supabase) {
      try {
        const { error } = await supabase
          .from('houses')
          .update({
            name: house.name,
            address: house.address,
            map_url: house.map_url,
            host_name: house.host_name,
            host_phone: house.host_phone,
            capacity: house.capacity,
            gender_restriction: house.gender_restriction,
            notes: house.notes,
          })
          .eq('id', house.id);
        if (error) {
          console.warn('Supabase updateHouse error:', error);
        }
      } catch (e) {
        console.warn('Failed to update house in Supabase', e);
      }
    }
    return true;
  },

  // Add new house (Admin)
  async addHouse(houseData: Omit<House, 'id'> & { id?: string }): Promise<House> {
    invalidateCache('houses');
    const newHouse: House = {
      ...houseData,
      id: houseData.id || 'h-' + Date.now(),
    };
    mockStore.addHouse(newHouse);
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('houses')
          .insert({
            name: newHouse.name,
            address: newHouse.address,
            map_url: newHouse.map_url,
            host_name: newHouse.host_name,
            host_phone: newHouse.host_phone,
            capacity: newHouse.capacity,
            gender_restriction: newHouse.gender_restriction,
            notes: newHouse.notes,
          })
          .select()
          .single();
        if (!error && data) {
          return {
            ...newHouse,
            id: data.id,
          };
        }
      } catch (e) {
        console.warn('Failed to insert house into Supabase', e);
      }
    }
    return newHouse;
  },

  // Fetch announcements (Supabase live with fallback to mockStore, with deduplication & caching)
  async getAnnouncements(targetDistrictId?: number | null, forceRefresh = false): Promise<Announcement[]> {
    const cacheKey = targetDistrictId ? `dist-${targetDistrictId}` : 'all';
    const cached = announcementsCache.get(cacheKey);
    if (!forceRefresh && cached && Date.now() - cached.timestamp < TTL_ANNOUNCEMENTS) {
      return cached.data;
    }

    if (inflightAnnouncements.has(cacheKey)) {
      return inflightAnnouncements.get(cacheKey)!;
    }

    const promise = (async () => {
      if (supabase) {
        try {
          let query = supabase
            .from('announcements')
            .select('id, title_en, title_ml, body_en, body_ml, pinned, target_district_id, created_at')
            .order('pinned', { ascending: false })
            .order('created_at', { ascending: false });

          if (targetDistrictId) {
            query = query.or(`target_district_id.is.null,target_district_id.eq.${targetDistrictId}`);
          }

          const { data, error } = await query;
          if (!error && data) {
            announcementsCache.set(cacheKey, { data, timestamp: Date.now() });
            mockStore.setAnnouncements(data, false);
            return data;
          }
        } catch (err) {
          console.warn('Failed to fetch announcements from Supabase, fallback to mockStore', err);
        }
      }
      const storeAnnouncements = mockStore.getAnnouncements();
      const filtered = targetDistrictId
        ? storeAnnouncements.filter((a) => !a.target_district_id || a.target_district_id === targetDistrictId)
        : storeAnnouncements;
      announcementsCache.set(cacheKey, { data: filtered, timestamp: Date.now() });
      return filtered;
    })().finally(() => {
      inflightAnnouncements.delete(cacheKey);
    });

    inflightAnnouncements.set(cacheKey, promise);
    return promise;
  },

  // Create announcement (Admin)
  async createAnnouncement(annData: {
    title_en: string;
    title_ml: string;
    body_en: string;
    body_ml: string;
    pinned?: boolean;
    target_district_id?: number | null;
  }): Promise<Announcement> {
    invalidateCache('announcements');
    const local = mockStore.addAnnouncement({
      ...annData,
      pinned: Boolean(annData.pinned),
    });
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('announcements')
          .insert({
            title_en: annData.title_en,
            title_ml: annData.title_ml,
            body_en: annData.body_en,
            body_ml: annData.body_ml,
            pinned: Boolean(annData.pinned),
            target_district_id: annData.target_district_id || null,
          })
          .select()
          .single();

        if (!error && data) {
          mockStore.deleteAnnouncement(local.id);
          return mockStore.addAnnouncement(data);
        } else if (error) {
          console.warn('Supabase createAnnouncement error:', error);
        }
      } catch (err) {
        console.warn('Failed to insert announcement into Supabase', err);
      }
    }
    return local;
  },

  // Delete announcement (Admin)
  async deleteAnnouncement(id: string): Promise<boolean> {
    invalidateCache('announcements');
    mockStore.deleteAnnouncement(id);
    if (supabase) {
      try {
        const { error } = await supabase.from('announcements').delete().eq('id', id);
        if (error) {
          console.warn('Supabase deleteAnnouncement error:', error);
        }
      } catch (err) {
        console.warn('Failed to delete announcement from Supabase', err);
      }
    }
    return true;
  }
};

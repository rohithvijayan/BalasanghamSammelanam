import { createClient } from '@supabase/supabase-js';
import { mockStore, getHouseNaturalKey, getVolunteerNaturalKey } from './mockData';
import { StayPortalData, DelegateStatus, LocationPing, Delegate, House, Volunteer, VolunteerLocationPing, Announcement, PaginationParams, PaginatedResult } from '../types';
import {
  browserCache,
  CACHE_KEYS,
  TTL_BROWSER_CACHE_MS,
  shouldLiveFetchOnLoad,
} from './browserCache';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// SECURITY UTILITY: URL Sanitizer to prevent Stored XSS (javascript: / data: URI attacks)
export const isSafeUrl = (url?: string | null): boolean => {
  if (!url) return false;
  const clean = url.trim();
  try {
    const parsed = new URL(clean);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
};

// =========================================================================
// Network Resilience: Retry with Exponential Backoff for Transient Failures
// =========================================================================
export async function withNetworkRetry<T>(
  fn: () => Promise<T>,
  retries = 2,
  baseDelayMs = 400
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err: any) {
      attempt++;
      const isNetworkErr =
        err?.name === 'TypeError' ||
        err?.message?.includes('Failed to fetch') ||
        err?.message?.includes('NetworkError') ||
        err?.message?.includes('aborted') ||
        (typeof navigator !== 'undefined' && !navigator.onLine);

      if (attempt > retries || !isNetworkErr) {
        throw err;
      }
      await new Promise((res) => setTimeout(res, baseDelayMs * Math.pow(2, attempt - 1)));
    }
  }
}

// =========================================================================
// Network Egress Optimization: In-Memory TTL Cache & In-Flight Deduplication
// =========================================================================
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const TTL_PINGS = 15000;           // 15s cache for temporary live GPS pings

let delegatesCache: CacheEntry<Delegate[]> | null = null;
let housesCache: CacheEntry<House[]> | null = null;
let volunteersCache: CacheEntry<Volunteer[]> | null = null;
const announcementsCache = new Map<string, CacheEntry<Announcement[]>>();
let locationPingsCache: CacheEntry<Record<string, LocationPing>> | null = null;
let volunteerPingsCache: CacheEntry<Record<string, VolunteerLocationPing>> | null = null;

let inflightDelegates: Promise<Delegate[]> | null = null;
let inflightHouses: Promise<House[]> | null = null;
let inflightVolunteers: Promise<Volunteer[]> | null = null;
const inflightAnnouncements = new Map<string, Promise<Announcement[]>>();
let inflightLocationPings: Promise<Record<string, LocationPing>> | null = null;
let inflightVolunteerPings: Promise<Record<string, VolunteerLocationPing>> | null = null;

export const invalidateCache = (target?: 'delegates' | 'houses' | 'volunteers' | 'announcements' | 'pings' | 'all') => {
  if (!target || target === 'all') {
    delegatesCache = null;
    housesCache = null;
    volunteersCache = null;
    announcementsCache.clear();
    locationPingsCache = null;
    volunteerPingsCache = null;
    browserCache.clearAll();
  } else if (target === 'delegates') {
    delegatesCache = null;
    browserCache.remove(CACHE_KEYS.DELEGATES);
  } else if (target === 'houses') {
    housesCache = null;
    browserCache.remove(CACHE_KEYS.HOUSES);
  } else if (target === 'volunteers') {
    volunteersCache = null;
    browserCache.remove(CACHE_KEYS.VOLUNTEERS);
  } else if (target === 'announcements') {
    announcementsCache.clear();
    browserCache.remove(CACHE_KEYS.ANNOUNCEMENTS());
    for (let i = 1; i <= 14; i++) {
      browserCache.remove(CACHE_KEYS.ANNOUNCEMENTS(i));
    }
  } else if (target === 'pings') {
    locationPingsCache = null;
    volunteerPingsCache = null;
  }
};

// Unified Data Service: Seamlessly switches between live Supabase and mock/local store
export const api = {
  invalidateCache,
  // Fetch all delegates (Supabase live with 5-hour persistent browser cache, live refresh on page reload)
  async getDelegates(forceRefresh = false): Promise<Delegate[]> {
    const cacheKey = CACHE_KEYS.DELEGATES;
    const mustRefresh = shouldLiveFetchOnLoad(cacheKey, forceRefresh);

    if (!mustRefresh) {
      if (delegatesCache && Date.now() - delegatesCache.timestamp < TTL_BROWSER_CACHE_MS) {
        return delegatesCache.data;
      }
      const localCached = browserCache.get<Delegate[]>(cacheKey, TTL_BROWSER_CACHE_MS);
      if (localCached && localCached.length > 0) {
        delegatesCache = { data: localCached, timestamp: Date.now() };
        mockStore.setDelegates(localCached, false);
        return localCached;
      }
    }

    if (inflightDelegates) {
      return inflightDelegates;
    }

    inflightDelegates = (async () => {
      if (supabase) {
        try {
          const volunteersPromise =
            volunteersCache && Date.now() - volunteersCache.timestamp < TTL_BROWSER_CACHE_MS
              ? Promise.resolve(volunteersCache.data)
              : api.getVolunteers();

          const [delegatesResult, volunteersList] = await Promise.all([
            supabase
              .from('delegates')
              .select(`
                id,
                token,
                full_name,
                phone,
                district_id,
                gender,
                house_id,
                volunteer_id,
                status,
                checked_in_at,
                districts (
                  id,
                  name_en,
                  name_ml
                )
              `)
              .order('created_at', { ascending: false }),
            volunteersPromise,
          ]);

          const { data, error } = delegatesResult;

          if (!error && data) {
            const volMap = new Map<string, Volunteer>();
            for (const v of volunteersList) {
              if (v.id) volMap.set(v.id, v);
            }

            const mapped = data.map((row: any) => {
              const resolvedVol = row.volunteer_id ? (volMap.get(row.volunteer_id) || null) : null;
              return {
                id: row.id,
                token: row.token,
                full_name: row.full_name,
                phone: row.phone || '',
                district_id: row.district_id,
                district_en: row.districts?.name_en || 'Kannur',
                district_ml: row.districts?.name_ml || 'കണ്ണൂർ',
                gender: row.gender || 'boy',
                house_id: row.house_id,
                volunteer_id: row.volunteer_id || null,
                volunteer: resolvedVol,
                status: row.status,
                checked_in_at: row.checked_in_at,
              };
            });
            delegatesCache = { data: mapped, timestamp: Date.now() };
            browserCache.set(cacheKey, mapped);
            mockStore.setDelegates(mapped, false);
            return mapped;
          }
        } catch (err) {
          console.warn('Failed to fetch delegates from Supabase, falling back to cache', err);
        }
      }
      const fallbackCached = browserCache.get<Delegate[]>(cacheKey, TTL_BROWSER_CACHE_MS);
      if (fallbackCached && fallbackCached.length > 0) {
        delegatesCache = { data: fallbackCached, timestamp: Date.now() };
        return fallbackCached;
      }
      const local = mockStore.getDelegates();
      delegatesCache = { data: local, timestamp: Date.now() };
      browserCache.set(cacheKey, local);
      return local;
    })().finally(() => {
      inflightDelegates = null;
    });

    return inflightDelegates;
  },

  // Fetch all accommodation houses (Supabase live with 5-hour persistent browser cache, live refresh on page reload)
  async getHouses(forceRefresh = false): Promise<House[]> {
    const cacheKey = CACHE_KEYS.HOUSES;
    const mustRefresh = shouldLiveFetchOnLoad(cacheKey, forceRefresh);

    if (!mustRefresh) {
      if (housesCache && Date.now() - housesCache.timestamp < TTL_BROWSER_CACHE_MS) {
        return housesCache.data;
      }
      const localCached = browserCache.get<House[]>(cacheKey, TTL_BROWSER_CACHE_MS);
      if (localCached && localCached.length > 0) {
        housesCache = { data: localCached, timestamp: Date.now() };
        mockStore.setHouses(localCached, false);
        return localCached;
      }
    }

    if (inflightHouses) {
      return inflightHouses;
    }

    inflightHouses = (async () => {
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('houses')
            .select('id, name, address, host_name, host_phone, capacity, gender_restriction, volunteer_id')
            .order('name', { ascending: true });

          if (!error && data) {
            const volMap = new Map<string, Volunteer>();
            for (const v of mockStore.getVolunteers()) {
              if (v.id) volMap.set(v.id, v);
            }

            const mapped = data.map((row: any) => {
              const vol = row.volunteer_id ? volMap.get(row.volunteer_id) || null : null;
              return {
                id: row.id,
                name: row.name,
                address: row.address,
                host_name: row.host_name,
                host_phone: row.host_phone,
                capacity: row.capacity,
                gender_restriction: row.gender_restriction,
                volunteer_id: row.volunteer_id || null,
                volunteer: vol,
              };
            });

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
            browserCache.set(cacheKey, uniqueHouses);
            mockStore.setHouses(uniqueHouses, false);
            return uniqueHouses;
          }
        } catch (err) {
          console.warn('Failed to fetch houses from Supabase, falling back to cache', err);
        }
      }
      const fallbackCached = browserCache.get<House[]>(cacheKey, TTL_BROWSER_CACHE_MS);
      if (fallbackCached && fallbackCached.length > 0) {
        housesCache = { data: fallbackCached, timestamp: Date.now() };
        return fallbackCached;
      }
      const local = mockStore.getHouses();
      housesCache = { data: local, timestamp: Date.now() };
      browserCache.set(cacheKey, local);
      return local;
    })().finally(() => {
      inflightHouses = null;
    });

    return inflightHouses;
  },

  // Fetch volunteers (Supabase live with 5-hour persistent browser cache, live refresh on page reload)
  async getVolunteers(forceRefresh = false): Promise<Volunteer[]> {
    const cacheKey = CACHE_KEYS.VOLUNTEERS;
    const mustRefresh = shouldLiveFetchOnLoad(cacheKey, forceRefresh);

    if (!mustRefresh) {
      if (volunteersCache && Date.now() - volunteersCache.timestamp < TTL_BROWSER_CACHE_MS) {
        return volunteersCache.data;
      }
      const localCached = browserCache.get<Volunteer[]>(cacheKey, TTL_BROWSER_CACHE_MS);
      if (localCached && localCached.length > 0) {
        volunteersCache = { data: localCached, timestamp: Date.now() };
        mockStore.setVolunteers(localCached, false);
        return localCached;
      }
    }

    if (inflightVolunteers) {
      return inflightVolunteers;
    }

    inflightVolunteers = (async () => {
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('volunteers')
            .select('id, name, phone, unit')
            .order('name', { ascending: true });

          if (!error && data) {
            const mapped: Volunteer[] = data.map((row: any) => ({
              id: row.id,
              name: row.name,
              phone: row.phone,
              unit: row.unit || '',
            }));
            volunteersCache = { data: mapped, timestamp: Date.now() };
            browserCache.set(cacheKey, mapped);
            mockStore.setVolunteers(mapped, false);
            return mapped;
          }
        } catch (err) {
          console.warn('Failed to fetch volunteers from Supabase, falling back to cache', err);
        }
      }
      const fallbackCached = browserCache.get<Volunteer[]>(cacheKey, TTL_BROWSER_CACHE_MS);
      if (fallbackCached && fallbackCached.length > 0) {
        volunteersCache = { data: fallbackCached, timestamp: Date.now() };
        return fallbackCached;
      }
      const local = mockStore.getVolunteers();
      volunteersCache = { data: local, timestamp: Date.now() };
      browserCache.set(cacheKey, local);
      return local;
    })().finally(() => {
      inflightVolunteers = null;
    });

    return inflightVolunteers;
  },

  // Create volunteer (Admin)
  async createVolunteer(vol: Omit<Volunteer, 'id'>): Promise<Volunteer> {
    invalidateCache('volunteers');
    const local = mockStore.addVolunteer(vol);
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('volunteers')
          .insert({
            name: vol.name.trim(),
            phone: vol.phone.trim(),
            unit: (vol.unit || '').trim(),
          })
          .select()
          .single();

        if (!error && data) {
          mockStore.deleteVolunteer(local.id || local.name);
          return mockStore.addVolunteer(data);
        } else if (error) {
          console.warn('Supabase createVolunteer error:', error);
        }
      } catch (err) {
        console.warn('Failed to insert volunteer into Supabase', err);
      }
    }
    return local;
  },

  // Delete volunteer (Admin)
  async deleteVolunteer(id: string, name?: string): Promise<boolean> {
    invalidateCache('volunteers');
    mockStore.deleteVolunteer(id || name || '');
    if (supabase) {
      try {
        let query = supabase.from('volunteers').delete();
        if (id) {
          query = query.eq('id', id);
        } else if (name) {
          query = query.eq('name', name);
        }
        const { error } = await query;
        if (error) {
          console.warn('Supabase deleteVolunteer error:', error);
        }
      } catch (err) {
        console.warn('Failed to delete volunteer from Supabase', err);
      }
    }
    return true;
  },

  // Update volunteer (Admin or Volunteer self-edit)
  async updateVolunteer(updated: Partial<Volunteer> & { id: string }): Promise<Volunteer | null> {
    invalidateCache('volunteers');
    mockStore.updateVolunteer(updated);
    if (supabase) {
      try {
        const payload: Record<string, any> = {};
        if (updated.name !== undefined) payload.name = updated.name.trim();
        if (updated.phone !== undefined) payload.phone = updated.phone.trim();
        if (updated.unit !== undefined) payload.unit = updated.unit.trim();

        const { data, error } = await supabase
          .from('volunteers')
          .update(payload)
          .eq('id', updated.id)
          .select()
          .maybeSingle();

        if (!error && data) {
          mockStore.updateVolunteer(data);
          return data;
        } else if (error) {
          console.warn('Supabase updateVolunteer error:', error);
        }
      } catch (err) {
        console.warn('Failed to update volunteer in Supabase', err);
      }
    }
    return mockStore.getVolunteers().find((v) => v.id === updated.id) || null;
  },

  // Get paginated delegates (reduces payload size and DB egress)
  async getDelegatesPaginated(params: PaginationParams = {}, forceRefresh = false): Promise<PaginatedResult<Delegate>> {
    const {
      page = 1,
      pageSize = 25,
      search = '',
      districtId = 'all',
      gender = 'all',
      status = 'all',
      unassignedOnly = false,
    } = params;

    if (supabase) {
      try {
        let query = supabase
          .from('delegates')
          .select(`
            id,
            token,
            full_name,
            phone,
            district_id,
            gender,
            house_id,
            volunteer_id,
            status,
            checked_in_at,
            districts (
              id,
              name_en,
              name_ml
            )
          `, { count: 'exact' });

        if (unassignedOnly) {
          query = query.is('house_id', null);
        }
        if (districtId !== 'all') {
          query = query.eq('district_id', districtId);
        }
        if (gender !== 'all') {
          query = query.eq('gender', gender);
        }
        if (status !== 'all') {
          query = query.eq('status', status);
        }
        if (search && search.trim()) {
          const s = search.trim();
          query = query.or(`full_name.ilike.%${s}%,token.ilike.%${s}%,phone.ilike.%${s}%`);
        }

        const safePage = Math.max(1, page);
        const from = (safePage - 1) * pageSize;
        const to = from + pageSize - 1;

        query = query.range(from, to).order('created_at', { ascending: false });

        const { data, count, error } = await query;

        if (!error && data) {
          const mapped: Delegate[] = data.map((row: any) => {
            const vol = row.volunteer_id ? mockStore.getVolunteers().find((v) => v.id === row.volunteer_id) || null : null;
            return {
              id: row.id,
              token: row.token,
              full_name: row.full_name,
              phone: row.phone || '',
              district_id: row.district_id,
              district_en: row.districts?.name_en || 'Kannur',
              district_ml: row.districts?.name_ml || 'കണ്ണൂർ',
              gender: row.gender || 'boy',
              house_id: row.house_id,
              volunteer_id: row.volunteer_id || null,
              volunteer: vol,
              status: row.status,
              checked_in_at: row.checked_in_at,
            };
          });

          const totalCount = count !== null ? count : mapped.length;
          const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

          return {
            data: mapped,
            totalCount,
            page: safePage,
            pageSize,
            totalPages,
          };
        }
      } catch (err) {
        console.warn('Failed to fetch paginated delegates from Supabase, falling back to mockStore', err);
      }
    }

    return mockStore.getPaginatedDelegates(params);
  },

  // Get paginated houses (reduces payload size and DB egress)
  async getHousesPaginated(page = 1, pageSize = 20, search = '', forceRefresh = false): Promise<PaginatedResult<House>> {
    if (supabase) {
      try {
        let query = supabase.from('houses').select('id, name, address, host_name, host_phone, capacity, gender_restriction, volunteer_id', { count: 'exact' });

        if (search && search.trim()) {
          const s = search.trim();
          query = query.or(`name.ilike.%${s}%,address.ilike.%${s}%,host_name.ilike.%${s}%`);
        }

        const safePage = Math.max(1, page);
        const from = (safePage - 1) * pageSize;
        const to = from + pageSize - 1;

        query = query.range(from, to).order('name', { ascending: true });

        const { data, count, error } = await query;

        if (!error && data) {
          const volMap = new Map<string, Volunteer>();
          for (const v of mockStore.getVolunteers()) {
            if (v.id) volMap.set(v.id, v);
          }

          const mapped: House[] = data.map((row: any) => {
            const vol = row.volunteer_id ? volMap.get(row.volunteer_id) || null : null;
            return {
              id: row.id,
              name: row.name,
              address: row.address,
              host_name: row.host_name,
              host_phone: row.host_phone,
              capacity: row.capacity,
              gender_restriction: row.gender_restriction,
              volunteer_id: row.volunteer_id || null,
              volunteer: vol,
            };
          });

          const totalCount = count !== null ? count : mapped.length;
          const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

          return {
            data: mapped,
            totalCount,
            page: safePage,
            pageSize,
            totalPages,
          };
        }
      } catch (err) {
        console.warn('Failed to fetch paginated houses from Supabase, falling back to mockStore', err);
      }
    }

    return mockStore.getPaginatedHouses(page, pageSize, search);
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
      // 1. Try atomic, high-performance bulk RPC first
      try {
        const rpcPayload = uniqueHouses.map((h) => ({
          name: h.name,
          address: h.address,
          host_name: h.host_name,
          host_phone: h.host_phone,
          capacity: h.capacity || 4,
          gender_restriction: h.gender_restriction || 'any',
        }));
        const { data: rpcData, error: rpcErr } = await supabase.rpc('bulk_upsert_houses', { p_houses: rpcPayload });
        if (!rpcErr && rpcData?.success) {
          mockStore.importHouses(uniqueHouses);
          invalidateCache('houses');
          return { count: rpcData.count || uniqueHouses.length };
        }
      } catch {
        // Fallback to table insert/update below
      }

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
            host_name: h.host_name,
            host_phone: h.host_phone,
            capacity: h.capacity || 4,
            gender_restriction: h.gender_restriction || 'any',
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

  // Bulk import volunteers to Supabase
  async importVolunteers(volunteers: Volunteer[]): Promise<{ count: number; error?: string }> {
    const uniqueMap = new Map<string, Volunteer>();
    for (const v of volunteers) {
      const key = getVolunteerNaturalKey(v);
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, v);
      }
    }
    const uniqueVolunteers = Array.from(uniqueMap.values());

    if (supabase) {
      try {
        const { data: existingRows } = await supabase
          .from('volunteers')
          .select('id, name, phone, unit');

        const existingMap = new Map<string, string>(); // naturalKey -> id
        if (existingRows) {
          for (const r of existingRows) {
            const key = getVolunteerNaturalKey(r);
            existingMap.set(key, r.id);
          }
        }

        const toInsert: any[] = [];
        const toUpdate: { id: string; data: any }[] = [];

        for (const v of uniqueVolunteers) {
          const key = getVolunteerNaturalKey(v);
          const existingId = existingMap.get(key);
          const payload = {
            name: v.name.trim(),
            phone: v.phone.trim(),
            unit: (v.unit || '').trim(),
          };

          if (existingId) {
            toUpdate.push({ id: existingId, data: payload });
          } else {
            toInsert.push(payload);
          }
        }

        if (toInsert.length > 0) {
          const { error: insErr } = await supabase.from('volunteers').insert(toInsert);
          if (insErr) {
            console.error('Supabase importVolunteers insert error:', insErr);
            if (insErr.message?.includes('permission denied')) {
              throw new Error(
                'Supabase permission denied for volunteers. Please run supabase/fix_permissions.sql in your Supabase SQL Editor.'
              );
            }
            throw new Error(insErr.message);
          }
        }

        if (toUpdate.length > 0) {
          await Promise.all(
            toUpdate.map((item) =>
              supabase.from('volunteers').update(item.data).eq('id', item.id)
            )
          );
        }

        mockStore.importVolunteers(uniqueVolunteers);
        invalidateCache('volunteers');
        return { count: uniqueVolunteers.length };
      } catch (err: any) {
        console.warn('Supabase importVolunteers error, fallback to mockStore', err);
        mockStore.importVolunteers(uniqueVolunteers);
        invalidateCache('volunteers');
        return { count: uniqueVolunteers.length, error: err.message };
      }
    }
    mockStore.importVolunteers(uniqueVolunteers);
    invalidateCache('volunteers');
    return { count: uniqueVolunteers.length };
  },
  // Fetch delegate stay details using secure token (with 5-hour persistent cache & live reload refresh)
  async getMyStay(token: string, forceRefresh = false): Promise<StayPortalData | null> {
    const storageKey = CACHE_KEYS.STAY_PORTAL(token);
    const mustRefresh = shouldLiveFetchOnLoad(storageKey, forceRefresh);

    if (!mustRefresh) {
      const cached = browserCache.get<StayPortalData>(storageKey, TTL_BROWSER_CACHE_MS);
      if (cached) {
        return cached;
      }
    }

    if (supabase) {
      const { data, error } = await supabase.rpc('get_my_stay', { p_token: token });
      if (error || !data || !data.success) {
        console.warn('Supabase get_my_stay error, falling back to cache/mock store', error);
        const fallback = browserCache.get<StayPortalData>(storageKey, TTL_BROWSER_CACHE_MS);
        if (fallback) return fallback;
        return mockStore.getDelegateByToken(token);
      }
      let resolvedVolunteer = data.volunteer;
      if (resolvedVolunteer && !resolvedVolunteer.active_location) {
        const volPings = await api.getActiveVolunteerLocationPings();
        const cleanName = (resolvedVolunteer.name || '').trim().toLowerCase();
        const cleanPhone = (resolvedVolunteer.phone || '').replace(/[^0-9]/g, '');
        const last10 = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : cleanPhone;
        const activeLoc = volPings[cleanName] || (cleanPhone ? volPings[cleanPhone] : null) || (last10 ? volPings[last10] : null);
        resolvedVolunteer = {
          ...resolvedVolunteer,
          active_location: activeLoc || null,
        };
      }
      const result: StayPortalData = {
        delegate: data.delegate,
        house: data.house,
        volunteer: resolvedVolunteer,
        announcements: data.announcements || [],
        helplines: data.helplines || data.helpline || [],
      };
      browserCache.set(storageKey, result);
      if (data.delegate?.token && data.delegate.token !== token) {
        browserCache.set(CACHE_KEYS.STAY_PORTAL(data.delegate.token), result);
      }
      return result;
    }

    const fallback = browserCache.get<StayPortalData>(storageKey, TTL_BROWSER_CACHE_MS);
    if (fallback) return fallback;
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
              const last10 = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : cleanPhone;
              if (cleanName && !pings[cleanName]) pings[cleanName] = p;
              if (cleanPhone && !pings[cleanPhone]) pings[cleanPhone] = p;
              if (last10 && !pings[last10]) pings[last10] = p;
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
    // Optimistic local update so UI reflects status immediately
    mockStore.updateStatus(delegateId, status);
    browserCache.set(CACHE_KEYS.DELEGATES, mockStore.getDelegates());

    if (supabase) {
      const updatePayload = {
        status,
        checked_in_at: status === 'checked_in' ? new Date().toISOString() : null,
      };

      try {
        await withNetworkRetry(async () => {
          const { error } = await supabase
            .from('delegates')
            .update(updatePayload)
            .eq('id', delegateId);
          if (error) {
            console.error('Supabase updateDelegateStatus error:', error);
            throw new Error(error.message || 'Failed to update delegate status');
          }
        });
      } catch (err: any) {
        console.warn('Network issue during updateDelegateStatus cloud sync:', err);
        if (typeof window !== 'undefined') {
          const syncOnOnline = () => {
            window.removeEventListener('online', syncOnOnline);
            (async () => {
              try {
                await supabase?.from('delegates').update(updatePayload).eq('id', delegateId);
                console.info('Background sync completed for updateDelegateStatus');
              } catch (e) {
                console.error('Background sync retry failed:', e);
              }
            })();
          };
          window.addEventListener('online', syncOnOnline);
        }
        throw err;
      }
    }
    return true;
  },

  // Alias for updateDelegateStatus
  async updateStatus(delegateId: string, status: DelegateStatus): Promise<boolean> {
    return this.updateDelegateStatus(delegateId, status);
  },

  // Assign delegate to house (Admin)
  async assignHouse(delegateId: string, houseId: string | null): Promise<boolean> {
    invalidateCache('delegates');
    const targetHouse = houseId ? mockStore.getHouses().find((h) => h.id === houseId) : null;
    let targetVolId = targetHouse?.volunteer_id || targetHouse?.volunteer?.id || null;

    // Optimistic local update
    mockStore.assignHouse(delegateId, houseId);
    browserCache.set(CACHE_KEYS.DELEGATES, mockStore.getDelegates());

    if (supabase) {
      if (houseId && !targetVolId) {
        try {
          const { data: hRow } = await supabase.from('houses').select('volunteer_id').eq('id', houseId).single();
          if (hRow?.volunteer_id) targetVolId = hRow.volunteer_id;
        } catch (e) {
          console.warn('Direct house volunteer lookup notice:', e);
        }
      }

      const updatePayload: Record<string, any> = {
        house_id: houseId,
        volunteer_id: houseId ? (targetVolId || null) : null,
      };

      try {
        await withNetworkRetry(async () => {
          const { error } = await supabase
            .from('delegates')
            .update(updatePayload)
            .eq('id', delegateId);
          if (error) {
            console.error('Supabase assignHouse error:', error);
            throw new Error(error.message || 'Failed to assign house in database');
          }
        });
      } catch (err: any) {
        console.warn('Network issue during assignHouse cloud sync:', err);
        if (typeof window !== 'undefined') {
          const syncOnOnline = () => {
            window.removeEventListener('online', syncOnOnline);
            (async () => {
              try {
                await supabase?.from('delegates').update(updatePayload).eq('id', delegateId);
                console.info('Background sync completed for assignHouse');
              } catch (e) {
                console.error('Background sync retry failed:', e);
              }
            })();
          };
          window.addEventListener('online', syncOnOnline);
        }
        throw err;
      }
    }
    return true;
  },

  // Bulk assign delegates (Admin)
  async bulkAssign(delegateIds: string[], houseId: string | null): Promise<boolean> {
    if (!delegateIds || delegateIds.length === 0) return true;
    invalidateCache('delegates');
    const targetHouse = houseId ? mockStore.getHouses().find((h) => h.id === houseId) : null;
    let targetVolId = targetHouse?.volunteer_id || targetHouse?.volunteer?.id || null;

    // Optimistic local update
    mockStore.bulkAssign(delegateIds, houseId);
    browserCache.set(CACHE_KEYS.DELEGATES, mockStore.getDelegates());

    if (supabase) {
      if (houseId && !targetVolId) {
        try {
          const { data: hRow } = await supabase.from('houses').select('volunteer_id').eq('id', houseId).single();
          if (hRow?.volunteer_id) targetVolId = hRow.volunteer_id;
        } catch (e) {
          console.warn('Direct house volunteer lookup notice:', e);
        }
      }

      const updatePayload: Record<string, any> = {
        house_id: houseId,
        volunteer_id: houseId ? (targetVolId || null) : null,
      };

      try {
        await withNetworkRetry(async () => {
          const { error } = await supabase
            .from('delegates')
            .update(updatePayload)
            .in('id', delegateIds);
          if (error) {
            console.error('Supabase bulkAssign error:', error);
            throw new Error(error.message || 'Failed to bulk assign in database');
          }
        });
      } catch (err: any) {
        console.warn('Network issue during bulkAssign cloud sync:', err);
        if (typeof window !== 'undefined') {
          const syncOnOnline = () => {
            window.removeEventListener('online', syncOnOnline);
            (async () => {
              try {
                await supabase?.from('delegates').update(updatePayload).in('id', delegateIds);
                console.info('Background sync completed for bulkAssign');
              } catch (e) {
                console.error('Background sync retry failed:', e);
              }
            })();
          };
          window.addEventListener('online', syncOnOnline);
        }
        throw err;
      }
    }
    return true;
  },

  // Assign volunteer in-charge to a house (Admin) - auto-inherits to all occupants in this house
  async assignHouseVolunteer(houseId: string, volunteer: Volunteer | null): Promise<boolean> {
    invalidateCache('houses');
    invalidateCache('delegates');
    mockStore.assignHouseVolunteer(houseId, volunteer);

    if (supabase) {
      try {
        await withNetworkRetry(async () => {
          // Atomic update on house: database trigger trg_house_volunteer_to_delegates_sync
          // automatically and atomically cascades volunteer_id to all delegates in this house
          const { error: houseErr } = await supabase
            .from('houses')
            .update({ volunteer_id: volunteer?.id || null })
            .eq('id', houseId);
          if (houseErr) {
            console.warn('Supabase assignHouseVolunteer house update notice:', houseErr.message);
            throw new Error(houseErr.message || 'Failed to update house volunteer');
          }

          // Defensive sync for delegates in case trigger is disabled
          const { error: delErr } = await supabase
            .from('delegates')
            .update({ volunteer_id: volunteer?.id || null })
            .eq('house_id', houseId);
          if (delErr) {
            console.warn('Supabase assignHouseVolunteer delegates update notice:', delErr.message);
          }
        });
      } catch (err: any) {
        console.warn('Failed to update house volunteer in Supabase', err);
        throw err;
      }
    }
    return true;
  },

  // Assign volunteer to delegate (Admin) - with cloud persistence
  async assignVolunteer(delegateId: string, volunteer: Volunteer | null): Promise<boolean> {
    invalidateCache('delegates');
    mockStore.assignVolunteer(delegateId, volunteer);
    if (supabase) {
      try {
        await withNetworkRetry(async () => {
          const { error } = await supabase
            .from('delegates')
            .update({ volunteer_id: volunteer?.id || null })
            .eq('id', delegateId);
          if (error) {
            console.warn('Supabase assignVolunteer notice:', error.message);
            if (error.code === '23503' || error.message?.includes('violates foreign key constraint') || error.message?.includes('delegates_volunteer_id_fkey')) {
              throw new Error(
                'Database Foreign Key Constraint (23503): delegates_volunteer_id_fkey in Supabase still references profiles table. Please run the SQL migration in supabase/migrations/20261121_fix_volunteer_foreign_key.sql in your Supabase SQL Editor.'
              );
            }
            throw new Error(error.message || 'Failed to assign volunteer');
          }
        });
      } catch (err: any) {
        console.warn('Failed to update volunteer_id in Supabase', err);
        throw err;
      }
    }
    return true;
  },

  // Bulk assign volunteer to multiple delegates (Admin) - with cloud persistence
  async bulkAssignVolunteer(delegateIds: string[], volunteer: Volunteer | null): Promise<boolean> {
    if (!delegateIds || delegateIds.length === 0) return true;
    invalidateCache('delegates');
    mockStore.bulkAssignVolunteer(delegateIds, volunteer);
    if (supabase) {
      try {
        await withNetworkRetry(async () => {
          const { error } = await supabase
            .from('delegates')
            .update({ volunteer_id: volunteer?.id || null })
            .in('id', delegateIds);
          if (error) {
            console.warn('Supabase bulkAssignVolunteer notice:', error.message);
            if (error.code === '23503' || error.message?.includes('violates foreign key constraint') || error.message?.includes('delegates_volunteer_id_fkey')) {
              throw new Error(
                'Database Foreign Key Constraint (23503): delegates_volunteer_id_fkey in Supabase still references profiles table. Please run the SQL migration in supabase/migrations/20261121_fix_volunteer_foreign_key.sql in your Supabase SQL Editor.'
              );
            }
            throw new Error(error.message || 'Failed to bulk assign volunteer');
          }
        });
      } catch (err: any) {
        console.warn('Failed to update volunteer_id in Supabase', err);
        throw err;
      }
    }
    return true;
  },

  // Edit delegate details (Admin)
  async updateDelegate(delegate: Partial<Delegate> & { id: string }): Promise<boolean> {
    invalidateCache('delegates');
    mockStore.updateDelegate(delegate);
    if (supabase) {
      try {
        await withNetworkRetry(async () => {
          const { error } = await supabase
            .from('delegates')
            .update({
              full_name: delegate.full_name,
              phone: delegate.phone,
              district_id: delegate.district_id,
              gender: delegate.gender,
              ...(delegate.volunteer_id !== undefined
                ? { volunteer_id: delegate.volunteer_id }
                : delegate.volunteer !== undefined
                ? { volunteer_id: delegate.volunteer?.id || null }
                : {}),
            })
            .eq('id', delegate.id);
          if (error) {
            console.error('Supabase updateDelegate error:', error);
            throw new Error(error.message || 'Failed to update delegate');
          }
        });
      } catch (e: any) {
        console.error('Failed to update delegate in Supabase', e);
        throw e;
      }
    }
    return true;
  },

  // Edit house details (Admin)
  async updateHouse(house: Partial<House> & { id: string }): Promise<boolean> {
    invalidateCache('houses');
    const targetVolId =
      house.volunteer_id !== undefined
        ? house.volunteer_id
        : house.volunteer !== undefined
        ? house.volunteer?.id || null
        : undefined;

    mockStore.updateHouse(house);
    if (supabase) {
      try {
        await withNetworkRetry(async () => {
          const { error } = await supabase
            .from('houses')
            .update({
              name: house.name,
              address: house.address,
              host_name: house.host_name,
              host_phone: house.host_phone,
              capacity: house.capacity,
              gender_restriction: house.gender_restriction,
              ...(targetVolId !== undefined ? { volunteer_id: targetVolId } : {}),
            })
            .eq('id', house.id);
          if (error) {
            console.error('Supabase updateHouse error:', error);
            throw new Error(error.message || 'Failed to update house');
          }

          if (targetVolId !== undefined) {
            // Auto-update occupants of this house to inherit the house volunteer
            invalidateCache('delegates');
            await supabase
              .from('delegates')
              .update({ volunteer_id: targetVolId })
              .eq('house_id', house.id);
          }
        });
      } catch (e: any) {
        console.error('Failed to update house in Supabase', e);
        throw e;
      }
    }
    return true;
  },

  // Add new house (Admin)
  async addHouse(houseData: Omit<House, 'id'> & { id?: string }): Promise<House> {
    invalidateCache('houses');
    const targetVolId =
      houseData.volunteer_id !== undefined
        ? houseData.volunteer_id
        : houseData.volunteer !== undefined
        ? houseData.volunteer?.id || null
        : null;

    const newHouse: House = {
      ...houseData,
      volunteer_id: targetVolId,
      id: houseData.id || 'h-' + Date.now(),
    };
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('houses')
          .insert({
            name: newHouse.name,
            address: newHouse.address,
            host_name: newHouse.host_name,
            host_phone: newHouse.host_phone,
            capacity: newHouse.capacity,
            gender_restriction: newHouse.gender_restriction,
            volunteer_id: targetVolId,
          })
          .select()
          .single();
        if (error) {
          console.error('Supabase addHouse error:', error);
          throw new Error(error.message || 'Failed to add house');
        }
        if (data) {
          const created = {
            ...newHouse,
            id: data.id,
          };
          mockStore.addHouse(created);
          return created;
        }
      } catch (e: any) {
        console.error('Failed to insert house into Supabase', e);
        throw e;
      }
    }
    mockStore.addHouse(newHouse);
    return newHouse;
  },

  // Fetch announcements (Supabase live with 5-hour persistent browser cache, live refresh on page reload)
  async getAnnouncements(targetDistrictId?: number | null, forceRefresh = false): Promise<Announcement[]> {
    const memoryKey = targetDistrictId ? `dist-${targetDistrictId}` : 'all';
    const storageKey = CACHE_KEYS.ANNOUNCEMENTS(targetDistrictId);
    const mustRefresh = shouldLiveFetchOnLoad(storageKey, forceRefresh);

    if (!mustRefresh) {
      const cached = announcementsCache.get(memoryKey);
      if (cached && Date.now() - cached.timestamp < TTL_BROWSER_CACHE_MS) {
        return cached.data;
      }
      const localCached = browserCache.get<Announcement[]>(storageKey, TTL_BROWSER_CACHE_MS);
      if (localCached && localCached.length > 0) {
        announcementsCache.set(memoryKey, { data: localCached, timestamp: Date.now() });
        mockStore.setAnnouncements(localCached, false);
        return localCached;
      }
    }

    if (inflightAnnouncements.has(memoryKey)) {
      return inflightAnnouncements.get(memoryKey)!;
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
            announcementsCache.set(memoryKey, { data, timestamp: Date.now() });
            browserCache.set(storageKey, data);
            mockStore.setAnnouncements(data, false);
            return data;
          }
        } catch (err) {
          console.warn('Failed to fetch announcements from Supabase, fallback to cache', err);
        }
      }
      const fallbackCached = browserCache.get<Announcement[]>(storageKey, TTL_BROWSER_CACHE_MS);
      if (fallbackCached && fallbackCached.length > 0) {
        announcementsCache.set(memoryKey, { data: fallbackCached, timestamp: Date.now() });
        return fallbackCached;
      }
      const storeAnnouncements = mockStore.getAnnouncements();
      const filtered = targetDistrictId
        ? storeAnnouncements.filter((a) => !a.target_district_id || a.target_district_id === targetDistrictId)
        : storeAnnouncements;
      announcementsCache.set(memoryKey, { data: filtered, timestamp: Date.now() });
      browserCache.set(storageKey, filtered);
      return filtered;
    })().finally(() => {
      inflightAnnouncements.delete(memoryKey);
    });

    inflightAnnouncements.set(memoryKey, promise);
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

        if (error) {
          console.error('Supabase createAnnouncement error:', error);
          mockStore.deleteAnnouncement(local.id);
          throw new Error(error.message || 'Failed to publish announcement');
        }

        if (data) {
          mockStore.deleteAnnouncement(local.id);
          return mockStore.addAnnouncement(data);
        }
      } catch (err: any) {
        mockStore.deleteAnnouncement(local.id);
        console.error('Failed to insert announcement into Supabase', err);
        throw err;
      }
    }
    return local;
  },

  // Delete announcement (Admin)
  async deleteAnnouncement(id: string): Promise<boolean> {
    invalidateCache('announcements');
    if (supabase) {
      try {
        const { error } = await supabase.from('announcements').delete().eq('id', id);
        if (error) {
          console.error('Supabase deleteAnnouncement error:', error);
          throw new Error(error.message || 'Failed to delete announcement');
        }
      } catch (err: any) {
        console.error('Failed to delete announcement from Supabase', err);
        throw err;
      }
    }
    mockStore.deleteAnnouncement(id);
    return true;
  }
};

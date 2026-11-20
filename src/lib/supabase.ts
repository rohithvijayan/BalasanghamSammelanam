import { createClient } from '@supabase/supabase-js';
import { mockStore, getHouseNaturalKey } from './mockData';
import { StayPortalData, DelegateStatus, LocationPing, Delegate, House, Volunteer } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Unified Data Service: Seamlessly switches between live Supabase and mock/local store
export const api = {
  // Fetch all delegates (Supabase live with fallback to mockStore)
  async getDelegates(): Promise<Delegate[]> {
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
          mockStore.setDelegates(mapped);
          return mapped;
        }
      } catch (err) {
        console.warn('Failed to fetch delegates from Supabase, falling back to mockStore', err);
      }
    }
    return mockStore.getDelegates();
  },

  // Fetch all accommodation houses (Supabase live with fallback)
  async getHouses(): Promise<House[]> {
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
          mockStore.setHouses(uniqueHouses);
          return uniqueHouses;
        }
      } catch (err) {
        console.warn('Failed to fetch houses from Supabase, falling back to mockStore', err);
      }
    }
    return mockStore.getHouses();
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
      return { count: insertedCount || uniqueDelegates.length };
    }

    mockStore.importDelegates(uniqueDelegates);
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
        return { count: uniqueHouses.length };
      } catch (err: any) {
        console.warn('Supabase importHouses error, fallback to mockStore', err);
        mockStore.importHouses(uniqueHouses);
        return { count: uniqueHouses.length, error: err.message };
      }
    }
    mockStore.importHouses(uniqueHouses);
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
      return {
        delegate: data.delegate,
        house: data.house,
        volunteer: data.volunteer,
        announcements: data.announcements || [],
        helplines: data.helpline || [],
      };
    }
    return mockStore.getDelegateByToken(token);
  },

  // Share temporary location ping (30 mins)
  async shareLocation(token: string, lat: number, lng: number, accuracy?: number): Promise<{ success: boolean }> {
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
  async getActiveLocationPings(): Promise<Record<string, LocationPing>> {
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
          return pings;
        }
      } catch (err) {
        console.warn('Failed to query location_pings from Supabase, fallback to store', err);
      }
    }
    return mockStore.getActiveLocationPings();
  },

  // Update check-in status (Admin/Staff)
  async updateDelegateStatus(delegateId: string, status: DelegateStatus): Promise<boolean> {
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
    mockStore.assignVolunteer(delegateId, volunteer);
    return true;
  },

  // Bulk assign volunteer to multiple delegates (Admin)
  async bulkAssignVolunteer(delegateIds: string[], volunteer: Volunteer | null): Promise<boolean> {
    mockStore.bulkAssignVolunteer(delegateIds, volunteer);
    return true;
  },

  // Edit delegate details (Admin)
  async updateDelegate(delegate: Partial<Delegate> & { id: string }): Promise<boolean> {
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
  }
};

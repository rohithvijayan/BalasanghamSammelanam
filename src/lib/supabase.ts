import { createClient } from '@supabase/supabase-js';
import { mockStore } from './mockData';
import { StayPortalData, DelegateStatus } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Unified Data Service: Seamlessly switches between live Supabase and mock/local store
export const api = {
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
        return { success: true };
      }
    }
    console.log('[MOCK LOCATION SHARED]', { token, lat, lng, accuracy, expires_in: '30m' });
    return { success: true };
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
  }
};

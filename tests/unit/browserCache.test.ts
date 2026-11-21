import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  browserCache,
  CACHE_KEYS,
  TTL_BROWSER_CACHE_MS,
  isPageReload,
  shouldLiveFetchOnLoad,
  markReloadHandled,
} from '../../src/lib/browserCache';
import { api } from '../../src/lib/supabase';

describe('Browser Persistent Cache with 5-Hour TTL & Page Reload Invalidation', () => {
  beforeEach(() => {
    localStorage.clear();
    browserCache.clearAll();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    browserCache.clearAll();
    vi.restoreAllMocks();
  });

  it('verifies TTL_BROWSER_CACHE_MS is exactly 5 hours', () => {
    expect(TTL_BROWSER_CACHE_MS).toBe(5 * 60 * 60 * 1000);
    expect(TTL_BROWSER_CACHE_MS).toBe(18000000);
  });

  it('stores and retrieves items correctly within 5 hours', () => {
    const testData = [{ id: 'del-1', full_name: 'അനു കൃഷ്ണൻ', token: 'kannur-anu-101' }];
    browserCache.set(CACHE_KEYS.DELEGATES, testData);

    const retrieved = browserCache.get<typeof testData>(CACHE_KEYS.DELEGATES);
    expect(retrieved).not.toBeNull();
    expect(retrieved).toEqual(testData);
    expect(retrieved?.[0].full_name).toBe('അനു കൃഷ്ണൻ');
  });

  it('returns cached item at 4.9 hours and expires after 5.0 hours', () => {
    const originalDateNow = Date.now;
    let mockTime = 1700000000000;
    vi.spyOn(Date, 'now').mockImplementation(() => mockTime);

    const houseData = [{ id: 'house-1', name: 'താഴെ വീട്ടിൽ', capacity: 4 }];
    browserCache.set(CACHE_KEYS.HOUSES, houseData);

    // Fast-forward 4 hours (within 5h TTL)
    mockTime += 4 * 60 * 60 * 1000;
    const stillValid = browserCache.get<typeof houseData>(CACHE_KEYS.HOUSES);
    expect(stillValid).not.toBeNull();
    expect(stillValid?.[0].name).toBe('താഴെ വീട്ടിൽ');

    // Fast-forward past 5 hours (e.g. 5 hours + 10 seconds)
    mockTime += 1 * 60 * 60 * 1000 + 10000;
    const expired = browserCache.get<typeof houseData>(CACHE_KEYS.HOUSES);
    expect(expired).toBeNull();

    // Verify it was cleaned up from localStorage
    expect(localStorage.getItem(CACHE_KEYS.HOUSES)).toBeNull();

    Date.now = originalDateNow;
  });

  it('handles corrupted JSON or malformed envelope gracefully without throwing', () => {
    // Malformed JSON string
    localStorage.setItem(CACHE_KEYS.VOLUNTEERS, '{malformed_json');
    expect(browserCache.get(CACHE_KEYS.VOLUNTEERS)).toBeNull();
    expect(localStorage.getItem(CACHE_KEYS.VOLUNTEERS)).toBeNull();

    // Valid JSON but not an envelope
    localStorage.setItem(CACHE_KEYS.VOLUNTEERS, JSON.stringify({ notAnEnvelope: true }));
    expect(browserCache.get(CACHE_KEYS.VOLUNTEERS)).toBeNull();
    expect(localStorage.getItem(CACHE_KEYS.VOLUNTEERS)).toBeNull();
  });

  it('removes specific cache entry with remove()', () => {
    browserCache.set(CACHE_KEYS.DELEGATES, [{ id: '1' }]);
    browserCache.set(CACHE_KEYS.HOUSES, [{ id: '2' }]);

    browserCache.remove(CACHE_KEYS.DELEGATES);

    expect(browserCache.get(CACHE_KEYS.DELEGATES)).toBeNull();
    expect(browserCache.get(CACHE_KEYS.HOUSES)).not.toBeNull();
  });

  it('clearAll() clears all sammelanam cache entries but preserves other localStorage keys', () => {
    localStorage.setItem('user_auth_token', 'jwt_xyz_123');
    browserCache.set(CACHE_KEYS.DELEGATES, [{ id: 'del-1' }]);
    browserCache.set(CACHE_KEYS.HOUSES, [{ id: 'house-1' }]);
    browserCache.set(CACHE_KEYS.ANNOUNCEMENTS('all'), [{ id: 'ann-1' }]);

    browserCache.clearAll();

    expect(browserCache.get(CACHE_KEYS.DELEGATES)).toBeNull();
    expect(browserCache.get(CACHE_KEYS.HOUSES)).toBeNull();
    expect(browserCache.get(CACHE_KEYS.ANNOUNCEMENTS('all'))).toBeNull();
    // Unrelated key remains intact
    expect(localStorage.getItem('user_auth_token')).toBe('jwt_xyz_123');
  });

  describe('Page Reload Invalidation & Navigation Timing', () => {
    it('detects page reload from performance.getEntriesByType', () => {
      // Mock performance.getEntriesByType to return type: 'reload'
      vi.spyOn(performance, 'getEntriesByType').mockReturnValue([
        { type: 'reload' } as PerformanceNavigationTiming,
      ]);

      expect(isPageReload()).toBe(true);
    });

    it('detects normal navigation when type is navigate', () => {
      vi.spyOn(performance, 'getEntriesByType').mockReturnValue([
        { type: 'navigate' } as PerformanceNavigationTiming,
      ]);

      expect(isPageReload()).toBe(false);
    });

    it('shouldLiveFetchOnLoad returns true on page reload for first request of each resource', () => {
      vi.spyOn(performance, 'getEntriesByType').mockReturnValue([
        { type: 'reload' } as PerformanceNavigationTiming,
      ]);

      // Resource 1: Delegates on reload
      const reloadFetch1 = shouldLiveFetchOnLoad(CACHE_KEYS.DELEGATES, false);
      expect(reloadFetch1).toBe(true);

      // Second request for Delegates in the same session does not re-trigger reload live fetch
      const reloadFetch2 = shouldLiveFetchOnLoad(CACHE_KEYS.DELEGATES, false);
      expect(reloadFetch2).toBe(false);

      // Resource 2: Houses on the same reload (first time queried)
      const housesFetch1 = shouldLiveFetchOnLoad(CACHE_KEYS.HOUSES, false);
      expect(housesFetch1).toBe(true);
      const housesFetch2 = shouldLiveFetchOnLoad(CACHE_KEYS.HOUSES, false);
      expect(housesFetch2).toBe(false);
    });

    it('shouldLiveFetchOnLoad always returns true when forceRefresh is true', () => {
      vi.spyOn(performance, 'getEntriesByType').mockReturnValue([
        { type: 'navigate' } as PerformanceNavigationTiming,
      ]);

      expect(shouldLiveFetchOnLoad(CACHE_KEYS.DELEGATES, true)).toBe(true);
    });

    it('shouldLiveFetchOnLoad returns false on normal in-app route navigation', () => {
      vi.spyOn(performance, 'getEntriesByType').mockReturnValue([
        { type: 'navigate' } as PerformanceNavigationTiming,
      ]);

      expect(shouldLiveFetchOnLoad('some_unique_resource_key', false)).toBe(false);
    });
  });

  describe('API Cache Invalidation Integration', () => {
    it('invalidating delegates removes delegate cache entry from browserCache', () => {
      browserCache.set(CACHE_KEYS.DELEGATES, [{ id: 'del-1' }]);
      expect(browserCache.get(CACHE_KEYS.DELEGATES)).not.toBeNull();

      api.invalidateCache('delegates');
      expect(browserCache.get(CACHE_KEYS.DELEGATES)).toBeNull();
    });

    it('invalidating houses removes house cache entry from browserCache', () => {
      browserCache.set(CACHE_KEYS.HOUSES, [{ id: 'house-1' }]);
      expect(browserCache.get(CACHE_KEYS.HOUSES)).not.toBeNull();

      api.invalidateCache('houses');
      expect(browserCache.get(CACHE_KEYS.HOUSES)).toBeNull();
    });

    it('invalidating volunteers removes volunteer cache entry from browserCache', () => {
      browserCache.set(CACHE_KEYS.VOLUNTEERS, [{ id: 'vol-1' }]);
      expect(browserCache.get(CACHE_KEYS.VOLUNTEERS)).not.toBeNull();

      api.invalidateCache('volunteers');
      expect(browserCache.get(CACHE_KEYS.VOLUNTEERS)).toBeNull();
    });

    it('invalidating announcements removes announcement cache entries from browserCache', () => {
      browserCache.set(CACHE_KEYS.ANNOUNCEMENTS('all'), [{ id: 'ann-all' }]);
      browserCache.set(CACHE_KEYS.ANNOUNCEMENTS(2), [{ id: 'ann-dist-2' }]);

      api.invalidateCache('announcements');
      expect(browserCache.get(CACHE_KEYS.ANNOUNCEMENTS('all'))).toBeNull();
      expect(browserCache.get(CACHE_KEYS.ANNOUNCEMENTS(2))).toBeNull();
    });
  });
});

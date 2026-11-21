// =========================================================================
// Persistent Browser Local Cache with 5-Hour TTL & Page Reload Invalidation
// Balasangham State Conference (ബാലസംഘം സംസ്ഥാന സമ്മേളനം)
// =========================================================================

export const TTL_BROWSER_CACHE_MS = 5 * 60 * 60 * 1000; // 5 hours in milliseconds

export const CACHE_KEYS = {
  DELEGATES: 'sammelanam_cache_v2_delegates',
  HOUSES: 'sammelanam_cache_v2_houses',
  VOLUNTEERS: 'sammelanam_cache_v2_volunteers',
  ANNOUNCEMENTS: (districtId?: number | string | null) =>
    `sammelanam_cache_v2_announcements_${districtId && districtId !== 'all' ? `dist_${districtId}` : 'all'}`,
  STAY_PORTAL: (token: string) => `sammelanam_cache_v2_stay_${token}`,
} as const;

interface CacheEnvelope<T> {
  data: T;
  timestamp: number;
}

// In-session set to track resources that have already executed their reload live-fetch
const handledReloadResources = new Set<string>();

/**
 * Detects whether the current page mount was triggered by a user browser reload (F5 / Refresh button / Pull-to-refresh)
 */
export const isPageReload = (): boolean => {
  if (typeof window === 'undefined' || typeof performance === 'undefined') {
    return false;
  }

  try {
    const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (navEntries && navEntries.length > 0) {
      return navEntries[0].type === 'reload';
    }
    // Fallback for older browsers
    return (performance as any)?.navigation?.type === 1;
  } catch {
    return false;
  }
};

/**
 * Checks if a resource needs a live fetch on page mount.
 * Returns true if forceRefresh is true, OR if the page was reloaded and this resource has not yet been live-fetched.
 */
export const shouldLiveFetchOnLoad = (resourceKey: string, forceRefresh = false): boolean => {
  if (forceRefresh) return true;

  if (isPageReload() && !handledReloadResources.has(resourceKey)) {
    handledReloadResources.add(resourceKey);
    return true;
  }

  return false;
};

/**
 * Marks a resource as having handled its reload live-fetch for the current session.
 */
export const markReloadHandled = (resourceKey: string): void => {
  handledReloadResources.add(resourceKey);
};

export const browserCache = {
  /**
   * Retrieves data from the persistent browser cache if present and within the 5-hour TTL.
   */
  get<T>(key: string, ttlMs = TTL_BROWSER_CACHE_MS): T | null {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }

    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;

      const envelope: CacheEnvelope<T> = JSON.parse(raw);
      if (!envelope || typeof envelope.timestamp !== 'number') {
        localStorage.removeItem(key);
        return null;
      }

      const age = Date.now() - envelope.timestamp;
      if (age < 0 || age > ttlMs) {
        // Expired
        localStorage.removeItem(key);
        return null;
      }

      return envelope.data;
    } catch (err) {
      console.warn(`[browserCache] Error reading cache key "${key}":`, err);
      try {
        localStorage.removeItem(key);
      } catch {
        // Ignore storage access errors
      }
      return null;
    }
  },

  /**
   * Saves data into the persistent browser cache with the current timestamp (5-hour TTL starts now).
   */
  set<T>(key: string, data: T): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    try {
      const envelope: CacheEnvelope<T> = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(key, JSON.stringify(envelope));
    } catch (err) {
      console.warn(`[browserCache] Quota exceeded or error writing cache key "${key}":`, err);
    }
  },

  /**
   * Invalidates / removes a specific cache entry.
   */
  remove(key: string): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    try {
      localStorage.removeItem(key);
    } catch (err) {
      console.warn(`[browserCache] Error removing cache key "${key}":`, err);
    }
  },

  /**
   * Clears all Balasangham v2 cache entries from browser storage.
   */
  clearAll(): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('sammelanam_cache_v2_')) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      handledReloadResources.clear();
    } catch (err) {
      console.warn('[browserCache] Error clearing cache:', err);
    }
  },
};

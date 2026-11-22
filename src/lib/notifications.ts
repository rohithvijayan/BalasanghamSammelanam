import { Announcement } from '../types';

export const isNotificationSupported = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

export const getNotificationPermission = (): NotificationPermission | 'unsupported' => {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
};

export const requestNotificationPermission = async (): Promise<NotificationPermission | 'unsupported'> => {
  if (!isNotificationSupported()) return 'unsupported';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn('Notification permission request failed', err);
    return 'denied';
  }
};

/**
 * Play a polite notification chime using Web Audio API
 */
export const playNotificationChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // Ignore audio autoplay restrictions
  }
};

/**
 * Obtain an active ServiceWorker registration with auto-registration fallback.
 * Critical for Chrome on Android where new Notification() throws an Illegal Constructor error.
 */
export const getActiveServiceWorkerRegistration = async (): Promise<ServiceWorkerRegistration | null> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    // 1. Check existing registration
    let reg = await navigator.serviceWorker.getRegistration();

    // 2. If not registered yet, initiate registration
    if (!reg) {
      reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    }

    // 3. Wait for readiness if not yet active (with 2.5s safety timeout)
    if (reg && !reg.active) {
      const readyReg = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<ServiceWorkerRegistration | null>((resolve) =>
          setTimeout(() => resolve(reg || null), 2500)
        ),
      ]);
      return readyReg || reg;
    }

    return reg;
  } catch (err) {
    console.warn('Failed to obtain ServiceWorker registration', err);
    return null;
  }
};

/**
 * Display a native browser notification.
 * Uses ServiceWorkerRegistration.showNotification() for Android Chrome & mobile PWAs,
 * with graceful fallback to desktop Notification constructor.
 */
export const sendBrowserNotification = async (
  title: string,
  options?: NotificationOptions
): Promise<boolean> => {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  // Ensure absolute icon URLs so Service Workers on custom domains / subpaths resolve correctly
  const origin = typeof window !== 'undefined' && window.location ? window.location.origin : '';
  const notificationOptions: NotificationOptions & { vibrate?: number[] } = {
    icon: origin ? `${origin}/pwa-192x192.png` : '/pwa-192x192.png',
    badge: origin ? `${origin}/favicon.png` : '/favicon.png',
    silent: false,
    vibrate: [250, 100, 250],
    ...options,
  };

  // Play polite audible chime
  playNotificationChime();

  // Primary path for Mobile Android Chrome & iOS PWA: ServiceWorkerRegistration.showNotification
  if ('serviceWorker' in navigator) {
    try {
      const registration = await getActiveServiceWorkerRegistration();
      if (registration && typeof registration.showNotification === 'function') {
        await registration.showNotification(title, notificationOptions);
        return true;
      }
    } catch (swErr) {
      console.warn('ServiceWorker showNotification failed, trying desktop fallback', swErr);
    }
  }

  // Secondary path: Desktop browsers (Chrome, Edge, Firefox, Safari desktop)
  try {
    if (typeof Notification === 'function') {
      const notif = new Notification(title, notificationOptions);
      setTimeout(() => {
        try {
          notif.close();
        } catch {}
      }, 7000);
      return true;
    }
  } catch (err) {
    console.warn('Notification constructor failed (expected on Android Chrome):', err);
  }

  return false;
};

/**
 * Detect newly published announcements and trigger push notification
 */
export const checkAndNotifyNewAnnouncements = (
  announcements: Announcement[],
  knownIds: Set<string>,
  language: 'ml' | 'en' = 'ml'
): Set<string> => {
  const updatedIds = new Set(knownIds);
  if (!announcements || announcements.length === 0) return updatedIds;

  // On first load with knownIds empty, record existing IDs without spamming notifications
  if (knownIds.size === 0) {
    announcements.forEach((a) => updatedIds.add(a.id));
    return updatedIds;
  }

  // Find newly added announcements
  const newAnnouncements = announcements.filter((a) => !knownIds.has(a.id));

  newAnnouncements.forEach((ann) => {
    updatedIds.add(ann.id);
    const title = language === 'ml' ? ann.title_ml : ann.title_en;
    const body = language === 'ml' ? ann.body_ml : ann.body_en;

    sendBrowserNotification(`📢 ${title}`, {
      body,
      tag: `announcement-${ann.id}`,
    });
  });

  return updatedIds;
};

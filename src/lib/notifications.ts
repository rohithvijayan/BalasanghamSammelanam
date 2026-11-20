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
 * Display a native browser notification
 */
export const sendBrowserNotification = async (
  title: string,
  options?: NotificationOptions
): Promise<boolean> => {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  const notificationOptions: NotificationOptions = {
    icon: '/pwa-192x192.png',
    badge: '/favicon.png',
    silent: false,
    ...options,
  };

  try {
    // Try via active ServiceWorker registration if available
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration && registration.showNotification) {
        await registration.showNotification(title, notificationOptions);
        playNotificationChime();
        return true;
      }
    }

    // Direct Notification fallback
    new Notification(title, notificationOptions);
    playNotificationChime();
    return true;
  } catch (err) {
    console.warn('Failed to display browser notification', err);
    return false;
  }
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

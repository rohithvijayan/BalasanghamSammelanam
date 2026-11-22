import React, { useEffect, useRef } from 'react';
import { useI18n } from '../i18n/i18nContext';
import { api, supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  isNotificationSupported,
  getNotificationPermission,
  sendBrowserNotification,
  checkAndNotifyNewAnnouncements,
} from '../lib/notifications';

const SYNC_INTERVAL_MS = 35000; // 35 seconds periodic poll

export const GlobalNotificationSync: React.FC = () => {
  const { language } = useI18n();
  const knownIdsRef = useRef<Set<string>>(new Set());
  const isInitializedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!isNotificationSupported()) return;

    // 1. Initial seed of known announcements so we don't spam notifications on page load
    const initializeKnownAnnouncements = async () => {
      try {
        const announcements = await api.getAnnouncements(undefined, false);
        if (announcements && announcements.length > 0) {
          const ids = new Set<string>();
          announcements.forEach((a) => {
            if (a.id) ids.add(a.id);
          });
          knownIdsRef.current = ids;
        }
      } catch (err) {
        console.warn('Initial announcements fetch notice', err);
      } finally {
        isInitializedRef.current = true;
      }
    };

    initializeKnownAnnouncements();

    // 2. Realtime listener via Supabase WebSocket channel (Instant push when tab is open)
    let channel: any = null;
    if (isSupabaseConfigured && supabase) {
      try {
        channel = supabase
          .channel('public-announcements-realtime')
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'announcements' },
            (payload) => {
              const newAnn = payload.new as any;
              if (
                newAnn &&
                newAnn.id &&
                !knownIdsRef.current.has(newAnn.id) &&
                getNotificationPermission() === 'granted'
              ) {
                knownIdsRef.current.add(newAnn.id);
                const title =
                  language === 'ml'
                    ? newAnn.title_ml || newAnn.title_en || 'പുതിയ അറിയിപ്പ്'
                    : newAnn.title_en || newAnn.title_ml || 'New Announcement';
                const body =
                  language === 'ml'
                    ? newAnn.body_ml || newAnn.body_en || ''
                    : newAnn.body_en || newAnn.body_ml || '';

                sendBrowserNotification(`📢 ${title}`, {
                  body: body,
                  tag: `ann-${newAnn.id}`,
                });
              }
            }
          )
          .subscribe();
      } catch (err) {
        console.warn('Supabase realtime channel subscription notice', err);
      }
    }

    // 3. Periodic Background Fallback Poll
    // NOTE: This runs even when document.visibilityState === 'hidden'
    // so Chrome tabs kept in background receive live push alerts!
    const interval = setInterval(async () => {
      // Only check if notifications are allowed and initialization completed
      if (!isInitializedRef.current) return;
      if (getNotificationPermission() !== 'granted') return;

      try {
        const latest = await api.getAnnouncements(undefined, false);
        if (latest && latest.length > 0) {
          const updatedIds = checkAndNotifyNewAnnouncements(
            latest,
            knownIdsRef.current,
            language as 'ml' | 'en'
          );
          knownIdsRef.current = updatedIds;
        }
      } catch (err) {
        // Silent network retry
      }
    }, SYNC_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [language]);

  return null; // Headless background sync service
};

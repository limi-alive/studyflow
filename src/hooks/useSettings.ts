import { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, ensureSettings } from '../lib/db';
import { syncPending } from '../lib/sync';

export function useSettings(userId: string) {
  useEffect(() => {
    void (async () => {
      // Pull cloud settings before creating a device-local default. This prevents
      // a fresh phone from overwriting an existing account's preferences.
      await syncPending(userId);
      const settings = await ensureSettings(userId);
      if (settings.syncStatus === 'pending') window.dispatchEvent(new CustomEvent('studyflow:sync-needed', { detail: { userId } }));
      const migrationKey = `studyflow.plushThemeUpgrade.${userId}`;
      if (!localStorage.getItem(migrationKey) && settings.themeId === 'liquid') {
        await db.settings.update(userId, { themeId: 'plush', updatedAt: new Date().toISOString(), syncStatus: 'pending' });
        localStorage.setItem(migrationKey, '1');
        window.dispatchEvent(new CustomEvent('studyflow:sync-needed', { detail: { userId } }));
      }
    })();
  }, [userId]);
  return useLiveQuery(() => db.settings.get(userId), [userId]);
}

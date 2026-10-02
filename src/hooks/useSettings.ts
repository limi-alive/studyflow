import { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, ensureSettings } from '../lib/db';

export function useSettings(userId: string) {
  useEffect(() => {
    void (async () => {
      const settings = await ensureSettings(userId);
      const migrationKey = `studyflow.plushThemeUpgrade.${userId}`;
      if (!localStorage.getItem(migrationKey) && settings.themeId === 'liquid') {
        await db.settings.update(userId, { themeId: 'plush', updatedAt: new Date().toISOString() });
        localStorage.setItem(migrationKey, '1');
      }
    })();
  }, [userId]);
  return useLiveQuery(() => db.settings.get(userId), [userId]);
}

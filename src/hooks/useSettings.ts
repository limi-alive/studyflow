import { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, ensureSettings } from '../lib/db';

export function useSettings(userId: string) {
  useEffect(() => { void ensureSettings(userId); }, [userId]);
  return useLiveQuery(() => db.settings.get(userId), [userId]);
}

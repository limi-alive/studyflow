import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { syncAll } from '../lib/sync';
import { cloudEnabled } from '../lib/supabase';

export function SyncBadge({ userId, enabled = true }: { userId: string; enabled?: boolean }) {
  const [state, setState] = useState<'offline'|'synced'|'syncing'|'failed'>(navigator.onLine ? 'synced' : 'offline');
  const running = useRef(false);

  useEffect(() => {
    let alive = true;
    const run = async () => {
      if (running.current) return;
      if (!enabled || !navigator.onLine || !cloudEnabled) { if (alive) setState('offline'); return; }
      running.current = true;
      if (alive) setState('syncing');
      const result = await syncAll(userId);
      running.current = false;
      if (!alive) return;
      setState(result.ok ? 'synced' : result.error === 'offline-or-cloud-disabled' || result.error === 'auth-mismatch' ? 'offline' : 'failed');
    };
    const online = () => void run();
    const offline = () => setState('offline');
    const foreground = () => { if (document.visibilityState === 'visible') void run(); };
    const syncNeeded = (event: Event) => {
      const detail = (event as CustomEvent<{userId?: string}>).detail;
      if (!detail?.userId || detail.userId === userId) window.setTimeout(() => void run(), 250);
    };
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') void run(); }, 20_000);
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    window.addEventListener('focus', online);
    document.addEventListener('visibilitychange', foreground);
    window.addEventListener('studyflow:sync-needed', syncNeeded);
    void run();
    return () => {
      alive = false;
      window.clearInterval(timer);
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
      window.removeEventListener('focus', online);
      document.removeEventListener('visibilitychange', foreground);
      window.removeEventListener('studyflow:sync-needed', syncNeeded);
    };
  }, [userId, enabled]);

  const Icon = state === 'offline' ? CloudOff : state === 'syncing' ? RefreshCw : Cloud;
  return <button className="sync-badge" onClick={() => enabled && void syncAll(userId)} title="Sync status">
    <Icon size={14} className={state === 'syncing' ? 'spin' : ''}/><span>{enabled ? state : 'local'}</span>
  </button>;
}

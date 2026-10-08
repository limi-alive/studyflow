import { Check, Cloud, CloudOff, RefreshCw, TriangleAlert } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { syncAll } from '../lib/sync';
import { cloudEnabled } from '../lib/supabase';

type SyncState = 'offline'|'synced'|'syncing'|'failed';

export function SyncBadge({ userId, enabled = true }: { userId: string; enabled?: boolean }) {
  const [state, setState] = useState<SyncState>(navigator.onLine ? 'synced' : 'offline');
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
      const nextState = result.ok ? 'synced' : result.error === 'offline-or-cloud-disabled' || result.error === 'auth-mismatch' ? 'offline' : 'failed';
      setState(nextState);
    };
    const online = () => void run();
    const offline = () => setState('offline');
    const foreground = () => { if (document.visibilityState === 'visible') void run(); };
    const syncNeeded = (event: Event) => {
      const detail = (event as CustomEvent<{userId?: string}>).detail;
      if (!detail?.userId || detail.userId === userId) window.setTimeout(() => void run(), 250);
    };
    const syncState = (event: Event) => {
      const detail = (event as CustomEvent<{userId?: string; state?: SyncState}>).detail;
      if (detail?.userId && detail.userId !== userId) return;
      if (detail?.state && alive) setState(detail.state);
    };
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') void run(); }, 45_000);
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    window.addEventListener('focus', online);
    document.addEventListener('visibilitychange', foreground);
    window.addEventListener('studyflow:sync-needed', syncNeeded);
    window.addEventListener('studyflow:sync-state', syncState);
    void run();
    return () => {
      alive = false;
      window.clearInterval(timer);
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
      window.removeEventListener('focus', online);
      document.removeEventListener('visibilitychange', foreground);
      window.removeEventListener('studyflow:sync-needed', syncNeeded);
      window.removeEventListener('studyflow:sync-state', syncState);
    };
  }, [userId, enabled]);

  const Icon = state === 'offline' ? CloudOff : state === 'syncing' ? RefreshCw : state === 'failed' ? TriangleAlert : Check;
  const label = enabled ? state : 'local';
  return <button className={`sync-badge is-${state}`} onClick={() => enabled && void syncAll(userId)} title="Sync status">
    <Icon size={14} className={state === 'syncing' ? 'spin' : ''}/><span>{label}</span>{state === 'synced' && <Cloud size={11} className="sync-cloud-mini"/>}
  </button>;
}

import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { syncPending } from '../lib/sync';
import { cloudEnabled } from '../lib/supabase';

export function SyncBadge({ userId }: { userId: string }) {
  const [state, setState] = useState<'offline'|'synced'|'syncing'|'failed'>(navigator.onLine ? 'synced' : 'offline');
  useEffect(() => {
    const run = async () => {
      if (!navigator.onLine || !cloudEnabled) { setState('offline'); return; }
      setState('syncing');
      const r = await syncPending(userId);
      setState(r.ok ? 'synced' : r.error === 'offline-or-cloud-disabled' ? 'offline' : 'failed');
    };
    const online = () => void run();
    const offline = () => setState('offline');
    window.addEventListener('online', online); window.addEventListener('offline', offline);
    void run();
    return () => { window.removeEventListener('online', online); window.removeEventListener('offline', offline); };
  }, [userId]);

  const Icon = state === 'offline' ? CloudOff : state === 'syncing' ? RefreshCw : Cloud;
  return <button className="sync-badge" onClick={() => void syncPending(userId)} title="Sync status">
    <Icon size={14} className={state === 'syncing' ? 'spin' : ''}/><span>{state}</span>
  </button>;
}

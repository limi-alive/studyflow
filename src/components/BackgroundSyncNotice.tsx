import { Check, CloudOff, RefreshCw, RotateCw, TriangleAlert } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { syncAll } from '../lib/sync';

type SyncUiState = 'idle' | 'syncing' | 'synced' | 'failed' | 'offline';
type SyncEventDetail = { userId?: string; state?: SyncUiState; ok?: boolean; error?: string };

export function BackgroundSyncNotice({ userId, enabled }: { userId: string; enabled: boolean }) {
  const [state, setState] = useState<SyncUiState>('idle');
  const [visible, setVisible] = useState(false);
  const showTimer = useRef<number | null>(null);
  const hideTimer = useRef<number | null>(null);
  const wasVisible = useRef(false);

  useEffect(() => {
    const clearTimers = () => {
      if (showTimer.current !== null) window.clearTimeout(showTimer.current);
      if (hideTimer.current !== null) window.clearTimeout(hideTimer.current);
      showTimer.current = null;
      hideTimer.current = null;
    };

    const handleState = (next: SyncUiState) => {
      clearTimers();
      setState(next);

      if (!enabled || next === 'idle' || next === 'offline') {
        setVisible(false);
        wasVisible.current = false;
        return;
      }

      if (next === 'syncing') {
        showTimer.current = window.setTimeout(() => {
          setVisible(true);
          wasVisible.current = true;
        }, 360);
        return;
      }

      if (next === 'synced') {
        if (!wasVisible.current) {
          setVisible(false);
          return;
        }
        setVisible(true);
        hideTimer.current = window.setTimeout(() => {
          setVisible(false);
          wasVisible.current = false;
          setState('idle');
        }, 1250);
        return;
      }

      setVisible(true);
      wasVisible.current = true;
    };

    const onSyncState = (event: Event) => {
      const detail = (event as CustomEvent<SyncEventDetail>).detail;
      if (detail?.userId && detail.userId !== userId) return;
      if (detail?.state) handleState(detail.state);
    };
    const onOffline = () => handleState('offline');

    window.addEventListener('studyflow:sync-state', onSyncState);
    window.addEventListener('offline', onOffline);
    return () => {
      clearTimers();
      window.removeEventListener('studyflow:sync-state', onSyncState);
      window.removeEventListener('offline', onOffline);
    };
  }, [enabled, userId]);

  if (!enabled || !visible) return null;

  const Icon = state === 'synced' ? Check : state === 'failed' ? TriangleAlert : state === 'offline' ? CloudOff : RefreshCw;
  const title = state === 'synced' ? 'All changes saved' : state === 'failed' ? 'Sync needs attention' : state === 'offline' ? 'Working offline' : 'Updating your study space';
  const copy = state === 'synced' ? 'Your devices are up to date.' : state === 'failed' ? 'Your local data is safe. Retry cloud sync.' : state === 'offline' ? 'Changes will sync when you reconnect.' : 'You can keep using StudyFlow while this finishes.';

  return <div className={`background-sync-toast is-${state}`} role="status" aria-live="polite">
    <span className="background-sync-icon"><Icon size={16} className={state === 'syncing' ? 'spin' : ''}/></span>
    <span className="background-sync-copy"><strong>{title}</strong><small>{copy}</small></span>
    {state === 'failed' && <button type="button" onClick={() => void syncAll(userId)} aria-label="Retry sync"><RotateCw size={15}/></button>}
  </div>;
}

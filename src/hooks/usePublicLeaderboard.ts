import { useCallback, useEffect, useRef, useState } from 'react';
import { cloudEnabled, supabase } from '../lib/supabase';
import { useAuthIdentity } from './useAuthIdentity';
import { useTimePulse } from './useTimePulse';
import { jalaliLeaderboardBoundsAt } from '../utils/leaderboardPeriod';

export type PublicLeaderboardRow = {
  username: string | null;
  display_name: string | null;
  period_seconds: number;
  session_count: number;
  rank_no: number;
  is_me: boolean;
};

type Result = { monthKey: string; userId: string | null; rows: PublicLeaderboardRow[] };

export function usePublicLeaderboard() {
  const identity = useAuthIdentity();
  const nowMs = useTimePulse();
  const range = jalaliLeaderboardBoundsAt(nowMs);
  const [result, setResult] = useState<Result>({ monthKey: '', userId: null, rows: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const requestSerial = useRef(0);
  const activeRequest = useRef<string | null>(null);
  const rerunRequested = useRef(false);
  const isSignedIn = identity.signedIn && !!identity.userId;
  const currentUserId = identity.userId;
  const queryKey = `${currentUserId ?? 'guest'}|${range.start}|${range.end}`;

  const refresh = useCallback(async () => {
    if (!isSignedIn || !cloudEnabled || !supabase || !currentUserId) {
      requestSerial.current += 1;
      activeRequest.current = null;
      setError(null);
      setLoading(false);
      setResult({ monthKey: '', userId: null, rows: [] });
      return;
    }

    // A new user/month may start immediately. Repeated refreshes for the
    // same user+month collapse into a single request.
    if (activeRequest.current === queryKey) {
      rerunRequested.current = true;
      return;
    }
    const serial = ++requestSerial.current;
    activeRequest.current = queryKey;
    setLoading(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc('studyflow_public_leaderboard', {
        period_start: range.start,
        period_end: range.end,
        row_limit: 20
      });
      if (serial !== requestSerial.current) return;
      if (rpcError) {
        setError(rpcError.message);
      } else {
        setResult({ monthKey: range.monthKey, userId: currentUserId, rows: (data ?? []) as PublicLeaderboardRow[] });
        setLastUpdatedAt(new Date().toISOString());
      }
    } catch (cause) {
      if (serial === requestSerial.current)
        setError(cause instanceof Error ? cause.message : 'Unable to update monthly leaderboard');
    } finally {
      if (serial === requestSerial.current) {
        activeRequest.current = null;
        setLoading(false);
        if (rerunRequested.current) {
          rerunRequested.current = false;
          // New activity arriving during an RPC should be reflected quickly.
          window.dispatchEvent(new Event('studyflow:league-refresh-queued'));
        }
      }
    }
  }, [currentUserId, isSignedIn, queryKey, range.start, range.end, range.monthKey]);

  useEffect(() => {
    // This effect invalidates late responses on logout, account change and month
    // rollover. Old period data is never displayed as current month data.
    rerunRequested.current = false;
    void refresh();
    const update = () => { if (document.visibilityState === 'visible') void refresh(); };
    const onSync = () => { void refresh(); };
    const onQueue = () => { window.setTimeout(() => void refresh(), 250); };
    window.addEventListener('studyflow:sync-complete', onSync);
    window.addEventListener('studyflow:league-refresh-queued', onQueue);
    window.addEventListener('focus', update);
    window.addEventListener('online', update);
    window.addEventListener('pageshow', update);
    document.addEventListener('visibilitychange', update);
    const interval = window.setInterval(update, 60_000);
    return () => {
      requestSerial.current++;
      activeRequest.current = null;
      window.removeEventListener('studyflow:sync-complete', onSync);
      window.removeEventListener('studyflow:league-refresh-queued', onQueue);
      window.removeEventListener('focus', update);
      window.removeEventListener('online', update);
      window.removeEventListener('pageshow', update);
      document.removeEventListener('visibilitychange', update);
      window.clearInterval(interval);
    };
  }, [refresh]);

  const currentRows = result.monthKey === range.monthKey && result.userId === currentUserId ? result.rows : [];
  return {
    rows: currentRows,
    loading,
    error,
    refresh,
    signedIn: isSignedIn,
    periodKey: range.monthKey,
    periodStartAt: range.start,
    nextResetAt: range.nextResetAt,
    remainingMs: range.remainingMs,
    lastUpdatedAt
  };
}

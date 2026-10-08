import { useCallback, useEffect, useMemo, useState } from 'react';
import { cloudEnabled, supabase } from '../lib/supabase';
import { useAuthIdentity } from './useAuthIdentity';

export type PublicLeaderboardRow = {
  username: string | null;
  display_name: string | null;
  period_seconds: number;
  session_count: number;
  rank_no: number;
  is_me: boolean;
};

function monthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

export function usePublicLeaderboard() {
  const identity = useAuthIdentity();
  const [rows, setRows] = useState<PublicLeaderboardRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const range = useMemo(monthRange, []);

  const refresh = useCallback(async () => {
    if (!identity.signedIn || !cloudEnabled || !supabase) {
      setRows([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    const { data, error: rpcError } = await supabase.rpc('studyflow_public_leaderboard', {
      period_start: range.start,
      period_end: range.end,
      row_limit: 20
    });
    if (rpcError) {
      setError(rpcError.message);
      setRows([]);
    } else {
      setError(null);
      setRows((data ?? []) as PublicLeaderboardRow[]);
    }
    setLoading(false);
  }, [identity.signedIn, range.start, range.end]);

  useEffect(() => {
    void refresh();
    const onSync = () => void refresh();
    const onFocus = () => { if (document.visibilityState === 'visible') void refresh(); };
    window.addEventListener('studyflow:sync-complete', onSync);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') void refresh(); }, 60_000);
    return () => {
      window.removeEventListener('studyflow:sync-complete', onSync);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
      window.clearInterval(timer);
    };
  }, [refresh]);

  return { rows, loading, error, refresh, signedIn: identity.signedIn };
}

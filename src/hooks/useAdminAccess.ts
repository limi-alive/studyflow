import { useCallback, useEffect, useState } from 'react';
import { cloudEnabled, supabase } from '../lib/supabase';
import { useAuthIdentity } from './useAuthIdentity';

export function useAdminAccess() {
  const identity = useAuthIdentity();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!cloudEnabled || !supabase || !identity.signedIn || !identity.userId) {
      setIsAdmin(false);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error: rpcError } = await supabase.rpc('is_studyflow_admin');
    setIsAdmin(Boolean(data) && !rpcError);
    setError(rpcError ? rpcError.message : null);
    setLoading(false);
  }, [identity.signedIn, identity.userId]);

  useEffect(() => { void refresh(); }, [refresh]);
  return { loading, isAdmin, error, refresh, identity };
}

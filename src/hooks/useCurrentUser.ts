import { useEffect, useState } from 'react';
import { getLocalUserId, separateOfflineIdentityFromCloudUser } from '../lib/db';
import { supabase } from '../lib/supabase';

export function useCurrentUser() {
  const [userId, setUserId] = useState(getLocalUserId());
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        separateOfflineIdentityFromCloudUser(data.user.id);
        setUserId(data.user.id);
        setEmail(data.user.email ?? null);
      }
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        separateOfflineIdentityFromCloudUser(session.user.id);
        setUserId(session.user.id);
        setEmail(session.user.email ?? null);
      } else {
        setUserId(getLocalUserId());
        setEmail(null);
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return { userId, email, isCloudUser: Boolean(email) };
}

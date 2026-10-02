import { useEffect, useState } from 'react';
import { getLocalUserId } from '../lib/db';
import { supabase } from '../lib/supabase';

export function useCurrentUser() {
  const [userId, setUserId] = useState(getLocalUserId());
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) { setUserId(data.user.id); setEmail(data.user.email ?? null); }
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) { setUserId(session.user.id); setEmail(session.user.email ?? null); }
      else { setUserId(getLocalUserId()); setEmail(null); }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return { userId, email, isCloudUser: Boolean(email) };
}

import { useEffect, useState } from 'react';
import { cloudEnabled, supabase } from '../lib/supabase';

type AuthIdentity = {
  loading: boolean;
  signedIn: boolean;
  userId: string | null;
  email: string | null;
  username: string | null;
  displayName: string | null;
};

const initialState: AuthIdentity = {
  loading: true,
  signedIn: false,
  userId: null,
  email: null,
  username: null,
  displayName: null
};

export function useAuthIdentity() {
  const [identity, setIdentity] = useState<AuthIdentity>(initialState);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      if (!cloudEnabled || !supabase) {
        if (alive) setIdentity({ ...initialState, loading: false });
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user ?? null;
      if (!user) {
        if (alive) setIdentity({ ...initialState, loading: false });
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('username,display_name')
        .eq('id', user.id)
        .maybeSingle();

      if (alive) {
        setIdentity({
          loading: false,
          signedIn: true,
          userId: user.id,
          email: user.email ?? null,
          username: (data?.username as string | undefined) ?? null,
          displayName: (data?.display_name as string | undefined) ?? null
        });
      }
    };

    void load();

    if (!supabase) return () => { alive = false; };

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      window.setTimeout(() => { void load(); }, 0);
    });

    const onProfileUpdated = () => { void load(); };
    window.addEventListener('studyflow:profile-updated', onProfileUpdated);

    return () => {
      alive = false;
      authListener.subscription.unsubscribe();
      window.removeEventListener('studyflow:profile-updated', onProfileUpdated);
    };
  }, []);

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  return { ...identity, cloudEnabled, signOut };
}

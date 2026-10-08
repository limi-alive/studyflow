import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import HomePage from '../pages/Home';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useAuthIdentity } from '../hooks/useAuthIdentity';
import { db } from '../lib/db';
import { isAccountOnboarded, setAccountOnboarded } from '../lib/accountPreferences';
import { syncAll } from '../lib/sync';

export function HomeGate(){
  const { userId } = useCurrentUser();
  const identity = useAuthIdentity();
  const [ready, setReady] = useState(false);
  const [onboarded, setOnboarded] = useState(false);

  useEffect(() => {
    let alive = true;
    if (identity.loading) return () => { alive = false; };
    void (async () => {
      setReady(false);
      if (!identity.signedIn) {
        const legacy = localStorage.getItem('studyflow.onboarded') === '1';
        const own = isAccountOnboarded(userId);
        if (legacy && !own) {
          localStorage.setItem(`studyflow.onboarded.${userId}`, '1');
          const purpose = localStorage.getItem('studyflow.studyPurpose');
          if (purpose) localStorage.setItem(`studyflow.studyPurpose.${userId}`, purpose);
        }
        if (alive) { setOnboarded(legacy || own); setReady(true); }
        return;
      }

      await syncAll(userId);
      const counts = await Promise.all([
        db.subjects.where('userId').equals(userId).count(),
        db.sessions.where('userId').equals(userId).count(),
        db.tasks.where('userId').equals(userId).count(),
        db.goals.where('userId').equals(userId).count(),
        db.exams.where('userId').equals(userId).count()
      ]);
      const hasAccountData = counts.some(count => count > 0);
      if (hasAccountData && !isAccountOnboarded(userId)) setAccountOnboarded(userId);
      if (alive) { setOnboarded(isAccountOnboarded(userId) || hasAccountData); setReady(true); }
    })();
    return () => { alive = false; };
  }, [userId, identity.loading, identity.signedIn]);

  if (!ready || identity.loading) return <div className="page" style={{padding:24}}>Syncing your StudyFlow space…</div>;
  return onboarded ? <HomePage/> : <Navigate to="/onboarding" replace/>;
}

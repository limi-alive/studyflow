import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import HomePage from '../pages/Home';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useAuthIdentity } from '../hooks/useAuthIdentity';
import { db } from '../lib/db';
import { isAccountOnboarded, setAccountOnboarded } from '../lib/accountPreferences';
import { syncAll } from '../lib/sync';

async function hasLocalStudyData(userId: string) {
  const counts = await Promise.all([
    db.subjects.where('userId').equals(userId).count(),
    db.sessions.where('userId').equals(userId).count(),
    db.tasks.where('userId').equals(userId).count(),
    db.goals.where('userId').equals(userId).count(),
    db.exams.where('userId').equals(userId).count()
  ]);
  return counts.some(count => count > 0);
}

export function HomeGate(){
  const { userId } = useCurrentUser();
  const identity = useAuthIdentity();
  const [offlineReady, setOfflineReady] = useState(false);
  const [offlineOnboarded, setOfflineOnboarded] = useState(false);
  const accountUserId = identity.signedIn && identity.userId ? identity.userId : userId;

  useEffect(() => {
    let alive = true;
    if (identity.loading) return () => { alive = false; };

    if (!identity.signedIn) {
      const legacy = localStorage.getItem('studyflow.onboarded') === '1';
      const own = isAccountOnboarded(accountUserId);
      if (legacy && !own) {
        localStorage.setItem(`studyflow.onboarded.${accountUserId}`, '1');
        const purpose = localStorage.getItem('studyflow.studyPurpose');
        if (purpose) localStorage.setItem(`studyflow.studyPurpose.${accountUserId}`, purpose);
      }
      setOfflineOnboarded(legacy || own);
      setOfflineReady(true);
      return () => { alive = false; };
    }

    // Signed-in users should never stare at a blocking sync page. Render the
    // cached dashboard immediately and reconcile cloud data in the background.
    void (async () => {
      const localData = await hasLocalStudyData(accountUserId);
      if (localData && !isAccountOnboarded(accountUserId)) setAccountOnboarded(accountUserId);
      if (!alive) return;
      void syncAll(accountUserId).then(async result => {
        if (!alive || !result.ok) return;
        const hasDataAfterSync = await hasLocalStudyData(accountUserId);
        if (hasDataAfterSync && !isAccountOnboarded(accountUserId)) setAccountOnboarded(accountUserId);
      });
    })();

    return () => { alive = false; };
  }, [accountUserId, identity.loading, identity.signedIn]);

  if (identity.loading || identity.signedIn) return <HomePage/>;
  if (!offlineReady) return <HomePage/>;
  return offlineOnboarded ? <HomePage/> : <Navigate to="/onboarding" replace/>;
}

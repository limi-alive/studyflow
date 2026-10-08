import { useEffect, useState } from 'react';
import { markAccountPreferencesDirty } from '../lib/accountPreferences';

export type FocusSystemPreferences = {
  showSessionSummary: boolean;
  autoZen: boolean;
  promptIntent: boolean;
  showShortcutHints: boolean;
};

const DEFAULTS: FocusSystemPreferences = {
  showSessionSummary: true,
  autoZen: false,
  promptIntent: true,
  showShortcutHints: true
};

function key(userId: string) { return `studyflow.focusSystem.${userId}`; }
function read(userId: string): FocusSystemPreferences {
  try { return {...DEFAULTS, ...(JSON.parse(localStorage.getItem(key(userId)) || '{}') as Partial<FocusSystemPreferences>)}; }
  catch { return DEFAULTS; }
}

export function useFocusSystemPreferences(userId: string) {
  const [preferences, setPreferences] = useState<FocusSystemPreferences>(() => read(userId));
  useEffect(() => setPreferences(read(userId)), [userId]);
  useEffect(() => {
    const applied=(event:Event)=>{const detail=(event as CustomEvent<{userId?:string}>).detail;if(!detail?.userId||detail.userId===userId)setPreferences(read(userId));};
    window.addEventListener('studyflow:account-preferences-applied',applied);
    return()=>window.removeEventListener('studyflow:account-preferences-applied',applied);
  },[userId]);
  const patchPreferences = (patch: Partial<FocusSystemPreferences>) => {
    const next = {...preferences, ...patch};
    localStorage.setItem(key(userId), JSON.stringify(next));
    markAccountPreferencesDirty(userId);
    setPreferences(next);
  };
  return { preferences, patchPreferences };
}

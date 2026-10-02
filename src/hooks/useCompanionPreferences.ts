import { useEffect, useState } from 'react';

export type FocusCompanionId = 'dash' | 'teddy' | 'avatar' | 'star';
export type CompanionMotion = 'calm' | 'balanced' | 'lively';

const VALID_COMPANIONS: FocusCompanionId[] = ['dash', 'teddy', 'avatar', 'star'];
const VALID_MOTION: CompanionMotion[] = ['calm', 'balanced', 'lively'];
const LEGACY_COMPANIONS = new Set(['mochi', 'bunni', 'moss', 'orbit']);

function companionKey(userId: string) { return `studyflow.companion.${userId}`; }
function motionKey(userId: string) { return `studyflow.companionMotion.${userId}`; }

function readCompanion(userId: string): FocusCompanionId {
  const raw = localStorage.getItem(companionKey(userId));
  if (raw && VALID_COMPANIONS.includes(raw as FocusCompanionId)) return raw as FocusCompanionId;
  if (raw && LEGACY_COMPANIONS.has(raw)) localStorage.setItem(companionKey(userId), 'dash');
  return 'dash';
}

function readMotion(userId: string): CompanionMotion {
  const value = localStorage.getItem(motionKey(userId)) as CompanionMotion | null;
  return value && VALID_MOTION.includes(value) ? value : 'balanced';
}

export function useCompanionPreferences(userId: string) {
  const [companion, setCompanionState] = useState<FocusCompanionId>(() => readCompanion(userId));
  const [motion, setMotionState] = useState<CompanionMotion>(() => readMotion(userId));

  useEffect(() => {
    setCompanionState(readCompanion(userId));
    setMotionState(readMotion(userId));
  }, [userId]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === companionKey(userId)) setCompanionState(readCompanion(userId));
      if (event.key === motionKey(userId)) setMotionState(readMotion(userId));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [userId]);

  const setCompanion = (value: FocusCompanionId) => {
    localStorage.setItem(companionKey(userId), value);
    setCompanionState(value);
  };
  const setMotion = (value: CompanionMotion) => {
    localStorage.setItem(motionKey(userId), value);
    setMotionState(value);
  };

  return { companion, motion, setCompanion, setMotion };
}

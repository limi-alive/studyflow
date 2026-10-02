import { useEffect, useState } from 'react';

export type FocusCompanionId = 'mochi' | 'bunni' | 'moss' | 'orbit';
export type CompanionMotion = 'calm' | 'balanced' | 'lively';

const VALID_COMPANIONS: FocusCompanionId[] = ['mochi', 'bunni', 'moss', 'orbit'];
const VALID_MOTION: CompanionMotion[] = ['calm', 'balanced', 'lively'];

function companionKey(userId: string) { return `studyflow.companion.${userId}`; }
function motionKey(userId: string) { return `studyflow.companionMotion.${userId}`; }

function readCompanion(userId: string): FocusCompanionId {
  const value = localStorage.getItem(companionKey(userId)) as FocusCompanionId | null;
  return value && VALID_COMPANIONS.includes(value) ? value : 'bunni';
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

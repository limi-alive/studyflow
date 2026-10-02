import { useEffect, useState } from 'react';

export type FocusCompanionId = 'kuromi' | 'buttercup' | 'tom-jerry';
export type CompanionMotion = 'calm' | 'balanced' | 'lively';

const VALID_COMPANIONS: FocusCompanionId[] = ['kuromi', 'buttercup', 'tom-jerry'];
const VALID_MOTION: CompanionMotion[] = ['calm', 'balanced', 'lively'];

function companionKey(userId: string) { return `studyflow.companion.${userId}`; }
function motionKey(userId: string) { return `studyflow.companionMotion.${userId}`; }

function readCompanion(userId: string): FocusCompanionId {
  const raw = localStorage.getItem(companionKey(userId));
  if (raw && VALID_COMPANIONS.includes(raw as FocusCompanionId)) return raw as FocusCompanionId;
  localStorage.setItem(companionKey(userId), 'kuromi');
  return 'kuromi';
}

function readMotion(userId: string): CompanionMotion {
  const raw = localStorage.getItem(motionKey(userId)) as CompanionMotion | null;
  return raw && VALID_MOTION.includes(raw) ? raw : 'balanced';
}

export function useCompanionPreferences(userId: string) {
  const [companion, setCompanionState] = useState<FocusCompanionId>(() => readCompanion(userId));
  const [motion, setMotionState] = useState<CompanionMotion>(() => readMotion(userId));

  useEffect(() => {
    setCompanionState(readCompanion(userId));
    setMotionState(readMotion(userId));
  }, [userId]);

  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === companionKey(userId)) setCompanionState(readCompanion(userId));
      if (event.key === motionKey(userId)) setMotionState(readMotion(userId));
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
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

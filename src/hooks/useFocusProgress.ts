import { useEffect, useMemo, useState } from 'react';
import { markAccountPreferencesDirty } from '../lib/accountPreferences';

export type FocusInsight = {
  id: string;
  endedAt: string;
  studySeconds: number;
  pauseSeconds: number;
  distractions: number;
  distractionReasons: string[];
  completedTarget: boolean;
  focusScore: number;
  xpEarned: number;
  coinsEarned: number;
  subjectId?: string | null;
  timerType: string;
  intent?: string;
  rating?: number;
  note?: string;
};

type FocusProgressStore = {
  xp: number;
  coins: number;
  sessions: FocusInsight[];
};

type RecordFocusInput = {
  id: string;
  endedAt: string;
  studySeconds: number;
  pauseSeconds: number;
  distractions: number;
  distractionReasons: string[];
  completedTarget: boolean;
  targetSeconds?: number | null;
  subjectId?: string | null;
  timerType: string;
  intent?: string;
};

const EMPTY: FocusProgressStore = { xp: 0, coins: 0, sessions: [] };
const MAX_HISTORY = 180;

function key(userId: string) { return `studyflow.focusProgress.${userId}`; }
function clamp(value: number, min: number, max: number) { return Math.max(min, Math.min(max, value)); }

function read(userId: string): FocusProgressStore {
  try {
    const raw = localStorage.getItem(key(userId));
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<FocusProgressStore>;
    return {
      xp: Number.isFinite(parsed.xp) ? Number(parsed.xp) : 0,
      coins: Number.isFinite(parsed.coins) ? Number(parsed.coins) : 0,
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions.slice(0, MAX_HISTORY) as FocusInsight[] : []
    };
  } catch {
    return EMPTY;
  }
}

function write(userId: string, next: FocusProgressStore) {
  localStorage.setItem(key(userId), JSON.stringify(next));
  markAccountPreferencesDirty(userId);
  window.dispatchEvent(new CustomEvent('studyflow-focus-progress', { detail: { userId } }));
}

function dayKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function shiftDay(date: Date, days: number) {
  const copy = new Date(date);
  copy.setHours(12,0,0,0);
  copy.setDate(copy.getDate() + days);
  return `${copy.getFullYear()}-${String(copy.getMonth()+1).padStart(2,'0')}-${String(copy.getDate()).padStart(2,'0')}`;
}

function streakFrom(sessions: FocusInsight[]) {
  const days = new Set(sessions.filter(s=>s.studySeconds >= 60).map(s=>dayKey(s.endedAt)));
  if (!days.size) return 0;
  const today = new Date();
  let cursor = days.has(shiftDay(today,0)) ? 0 : days.has(shiftDay(today,-1)) ? -1 : -999;
  if (cursor === -999) return 0;
  let streak = 0;
  while (days.has(shiftDay(today,cursor))) { streak += 1; cursor -= 1; }
  return streak;
}

function scoreSession(input: RecordFocusInput) {
  const studyMinutes = input.studySeconds / 60;
  const targetRatio = input.targetSeconds && input.targetSeconds > 0
    ? clamp(input.studySeconds / input.targetSeconds, 0, 1)
    : clamp(studyMinutes / 25, 0, 1);
  const completion = input.targetSeconds ? 25 * targetRatio : 12 + 13 * targetRatio;
  const duration = Math.min(12, studyMinutes / 2.5);
  const pauseRatio = input.pauseSeconds / Math.max(input.studySeconds + input.pauseSeconds, 1);
  const pausePenalty = Math.min(18, pauseRatio * 50);
  const distractionPenalty = Math.min(24, input.distractions * 6);
  const finishBonus = input.completedTarget ? 6 : 0;
  return clamp(Math.round(57 + completion + duration + finishBonus - pausePenalty - distractionPenalty), 0, 100);
}

function levelFromXp(xp: number) {
  return Math.max(1, Math.floor(Math.sqrt(Math.max(0,xp) / 180)) + 1);
}

function levelFloor(level: number) { return Math.pow(Math.max(0, level - 1), 2) * 180; }
function nextLevelFloor(level: number) { return Math.pow(level, 2) * 180; }

export function useFocusProgress(userId: string) {
  const [store, setStore] = useState<FocusProgressStore>(() => read(userId));

  useEffect(() => setStore(read(userId)), [userId]);
  useEffect(() => {
    const onStorage = (event: StorageEvent) => { if (event.key === key(userId)) setStore(read(userId)); };
    const onCustom = (event: Event) => {
      const detail = (event as CustomEvent<{userId?:string}>).detail;
      if (!detail?.userId || detail.userId === userId) setStore(read(userId));
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('studyflow-focus-progress', onCustom);
    return () => { window.removeEventListener('storage', onStorage); window.removeEventListener('studyflow-focus-progress', onCustom); };
  }, [userId]);

  const recordSession = (input: RecordFocusInput) => {
    const focusScore = scoreSession(input);
    const studyMinutes = input.studySeconds / 60;
    const xpEarned = Math.max(1, Math.round(studyMinutes * 2 + focusScore * .35 + (input.completedTarget ? 20 : 0)));
    const coinsEarned = Math.max(1, Math.floor(xpEarned / 12));
    const insight: FocusInsight = { ...input, focusScore, xpEarned, coinsEarned };
    const current = read(userId);
    const sessions = [insight, ...current.sessions.filter(item=>item.id!==insight.id)].slice(0, MAX_HISTORY);
    const next = { xp: current.xp + xpEarned, coins: current.coins + coinsEarned, sessions };
    write(userId, next);
    setStore(next);
    return insight;
  };

  const updateReflection = (id: string, rating: number, note: string) => {
    const current = read(userId);
    const next = { ...current, sessions: current.sessions.map(item=>item.id===id ? {...item,rating,note} : item) };
    write(userId, next);
    setStore(next);
  };

  const level = levelFromXp(store.xp);
  const floor = levelFloor(level);
  const nextFloor = nextLevelFloor(level);
  const levelProgress = clamp((store.xp - floor) / Math.max(nextFloor - floor, 1), 0, 1);
  const streak = useMemo(() => streakFrom(store.sessions), [store.sessions]);
  const averageScore = store.sessions.length
    ? Math.round(store.sessions.reduce((sum,item)=>sum+item.focusScore,0) / store.sessions.length)
    : 0;

  return {
    xp: store.xp,
    coins: store.coins,
    sessions: store.sessions,
    level,
    levelProgress,
    xpToNextLevel: Math.max(0, nextFloor - store.xp),
    streak,
    averageScore,
    recordSession,
    updateReflection
  };
}

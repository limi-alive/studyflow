import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { markAccountPreferencesDirty } from '../lib/accountPreferences';
import { calculateMonthlyReward, HOURS_PER_REWARD, REWARD_TOMAN } from '../utils/reward';

type RewardLedger = Record<string, number>;

function ledgerKey(userId: string) { return `studyflow.rewardLedger.${userId}`; }

function readLedger(userId: string): RewardLedger {
  try { return JSON.parse(localStorage.getItem(ledgerKey(userId)) || '{}') as RewardLedger; }
  catch { return {}; }
}

function monthKey(date: Date, calendarType: 'gregorian' | 'jalali') {
  const locale = calendarType === 'jalali' ? 'en-US-u-ca-persian-nu-latn' : 'en-CA';
  const parts = new Intl.DateTimeFormat(locale, { year: 'numeric', month: '2-digit' }).formatToParts(date);
  const year = parts.find(part => part.type === 'year')?.value ?? String(date.getFullYear());
  const month = parts.find(part => part.type === 'month')?.value ?? String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function monthLabel(date: Date, calendarType: 'gregorian' | 'jalali') {
  const locale = calendarType === 'jalali' ? 'en-US-u-ca-persian-nu-latn' : 'en-US';
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long' }).format(date);
}

export function useMonthlyReward(userId: string, calendarType: 'gregorian' | 'jalali' = 'gregorian') {
  const sessionsQuery = useLiveQuery(() => db.sessions.where('userId').equals(userId).filter(row => !row.deletedAt).toArray(), [userId]);
  const sessions = useMemo(() => sessionsQuery ?? [], [sessionsQuery]);
  const [ledger, setLedger] = useState<RewardLedger>(() => readLedger(userId));
  const now = new Date();
  const key = monthKey(now, calendarType);

  useEffect(() => setLedger(readLedger(userId)), [userId]);
  useEffect(() => {
    const refresh = (event: Event) => {
      const detail = (event as CustomEvent<{userId?: string}>).detail;
      if (!detail?.userId || detail.userId === userId) setLedger(readLedger(userId));
    };
    window.addEventListener('studyflow:account-preferences-applied', refresh);
    return () => window.removeEventListener('studyflow:account-preferences-applied', refresh);
  }, [userId]);

  const monthlySeconds = useMemo(() => sessions.reduce((sum, session) => {
    const ended = new Date(session.endTime || session.startTime);
    return monthKey(ended, calendarType) === key ? sum + Math.max(0, session.studySeconds || 0) : sum;
  }, 0), [sessions, calendarType, key]);

  const rewardMath = calculateMonthlyReward(monthlySeconds);
  const earnedBlocks = rewardMath.earnedBlocks;
  const paidBlocks = Math.min(earnedBlocks, Math.max(0, ledger[key] ?? 0));
  const unpaidBlocks = Math.max(0, earnedBlocks - paidBlocks);
  const progress = rewardMath.progress;
  const nextMilestoneSeconds = rewardMath.nextMilestoneSeconds;
  const nextRewardSeconds = unpaidBlocks > 0 ? 0 : nextMilestoneSeconds;
  const tomanPerHour = rewardMath.tomanPerHour;
  const studyValueToman = rewardMath.studyValueToman;
  const earnedToman = rewardMath.earnedToman;
  const paidToman = paidBlocks * REWARD_TOMAN;
  const outstandingToman = unpaidBlocks * REWARD_TOMAN;

  const setPaidBlocks = (count: number) => {
    const next = { ...readLedger(userId), [key]: Math.max(0, Math.min(earnedBlocks, count)) };
    localStorage.setItem(ledgerKey(userId), JSON.stringify(next));
    markAccountPreferencesDirty(userId);
    setLedger(next);
  };

  return {
    monthKey: key,
    monthLabel: monthLabel(now, calendarType),
    hoursPerReward: HOURS_PER_REWARD,
    rewardToman: REWARD_TOMAN,
    tomanPerHour,
    studyValueToman,
    monthlySeconds,
    monthlyHours: monthlySeconds / 3600,
    earnedBlocks,
    paidBlocks,
    unpaidBlocks,
    earnedToman,
    paidToman,
    outstandingToman,
    progress,
    nextRewardSeconds,
    nextMilestoneSeconds,
    markOnePaid: () => setPaidBlocks(paidBlocks + 1),
    undoOnePaid: () => setPaidBlocks(paidBlocks - 1)
  };
}

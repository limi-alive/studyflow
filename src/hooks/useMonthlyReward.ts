import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';

const HOURS_PER_REWARD = 28;
const REWARD_TOMAN = 5_000_000;

type RewardLedger = Record<string, number>;

function ledgerKey(userId: string) { return `studyflow.rewardLedger.${userId}`; }

function readLedger(userId: string): RewardLedger {
  try { return JSON.parse(localStorage.getItem(ledgerKey(userId)) || '{}') as RewardLedger; }
  catch { return {}; }
}

function monthKey(date: Date, calendarType: 'gregorian' | 'jalali') {
  const locale = calendarType === 'jalali' ? 'fa-IR-u-ca-persian-nu-latn' : 'en-CA';
  const parts = new Intl.DateTimeFormat(locale, { year: 'numeric', month: '2-digit' }).formatToParts(date);
  const year = parts.find(part => part.type === 'year')?.value ?? String(date.getFullYear());
  const month = parts.find(part => part.type === 'month')?.value ?? String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function monthLabel(date: Date, calendarType: 'gregorian' | 'jalali') {
  const locale = calendarType === 'jalali' ? 'fa-IR-u-ca-persian' : 'en-US';
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long' }).format(date);
}

export function useMonthlyReward(userId: string, calendarType: 'gregorian' | 'jalali' = 'gregorian') {
  const sessionsQuery = useLiveQuery(() => db.sessions.where('userId').equals(userId).filter(row => !row.deletedAt).toArray(), [userId]);
  const sessions = useMemo(() => sessionsQuery ?? [], [sessionsQuery]);
  const [ledger, setLedger] = useState<RewardLedger>(() => readLedger(userId));
  const now = new Date();
  const key = monthKey(now, calendarType);

  useEffect(() => setLedger(readLedger(userId)), [userId]);

  const monthlySeconds = useMemo(() => sessions.reduce((sum, session) => {
    const ended = new Date(session.endTime || session.startTime);
    return monthKey(ended, calendarType) === key ? sum + Math.max(0, session.studySeconds || 0) : sum;
  }, 0), [sessions, calendarType, key]);

  const milestoneSeconds = HOURS_PER_REWARD * 3600;
  const earnedBlocks = Math.floor(monthlySeconds / milestoneSeconds);
  const paidBlocks = Math.min(earnedBlocks, Math.max(0, ledger[key] ?? 0));
  const unpaidBlocks = Math.max(0, earnedBlocks - paidBlocks);
  const remainderSeconds = monthlySeconds % milestoneSeconds;
  const progress = remainderSeconds / milestoneSeconds;
  const nextMilestoneSeconds = remainderSeconds === 0 ? milestoneSeconds : milestoneSeconds - remainderSeconds;
  const nextRewardSeconds = unpaidBlocks > 0 ? 0 : nextMilestoneSeconds;
  const earnedToman = earnedBlocks * REWARD_TOMAN;
  const paidToman = paidBlocks * REWARD_TOMAN;
  const outstandingToman = unpaidBlocks * REWARD_TOMAN;

  const setPaidBlocks = (count: number) => {
    const next = { ...readLedger(userId), [key]: Math.max(0, Math.min(earnedBlocks, count)) };
    localStorage.setItem(ledgerKey(userId), JSON.stringify(next));
    setLedger(next);
  };

  return {
    monthKey: key,
    monthLabel: monthLabel(now, calendarType),
    hoursPerReward: HOURS_PER_REWARD,
    rewardToman: REWARD_TOMAN,
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

import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useTimePulse } from './useTimePulse';
import { db } from '../lib/db';
import { markAccountPreferencesDirty } from '../lib/accountPreferences';
import { getUiLanguage } from '../lib/uiLanguage';
import { calculateMonthlyReward, reservedPaidBlocks, HOURS_PER_REWARD, REWARD_TOMAN } from '../utils/reward';
import { monthlyPeriodAt, creditedSecondsInPeriod } from '../utils/monthlyAccounting';

type RewardLedger = Record<string, number>;

function ledgerKey(userId: string) { return `studyflow.rewardLedger.${userId}`; }

function readLedger(userId: string): RewardLedger {
  try { const value: unknown = JSON.parse(localStorage.getItem(ledgerKey(userId)) || '{}');
    return value && typeof value === 'object' && !Array.isArray(value) ? value as RewardLedger : {}; }
  catch { return {}; }
}

function monthLabel(date: Date, calendarType: 'gregorian' | 'jalali') {
  const fa=getUiLanguage()==='fa';
  const bounds = monthlyPeriodAt(date);
  const label = (value: Date) => new Intl.DateTimeFormat(calendarType==='gregorian' ? (fa?'fa-IR-u-ca-gregory':'en-US-u-ca-gregory') : (fa?'fa-IR-u-ca-persian':'en-US-u-ca-persian'), {year:'numeric',month:'long',day:'numeric',timeZone:'Asia/Tehran'}).format(value);
  if (calendarType === 'gregorian') {
    // The period is Tehran Jalali; only its displayed dates use Gregorian formatting.
    const begin = new Date(bounds.start);
    const end = new Date(new Date(bounds.end).getTime() - 1);
    return `${label(begin)} ${fa?'تا':'to'} ${label(end)}`;
  }
  return new Intl.DateTimeFormat(fa?'fa-IR-u-ca-persian':'en-US-u-ca-persian-nu-latn',{year:'numeric',month:'long',timeZone:'Asia/Tehran'}).format(date);
}

export function useMonthlyReward(userId: string, calendarType: 'gregorian' | 'jalali' = 'gregorian') {
  const sessionsQuery = useLiveQuery(() => db.sessions.where('userId').equals(userId).filter(row => !row.deletedAt).toArray(), [userId]);
  const sessions = useMemo(() => sessionsQuery ?? [], [sessionsQuery]);
  const [ledger, setLedger] = useState<RewardLedger>(() => readLedger(userId));
  const now = new Date(useTimePulse());
  const bounds = monthlyPeriodAt(now);
  const key = bounds.monthKey;

  useEffect(() => setLedger(readLedger(userId)), [userId]);
  useEffect(() => {
    const refresh = (event: Event) => {
      const detail = (event as CustomEvent<{userId?: string}>).detail;
      if (!detail?.userId || detail.userId === userId) setLedger(readLedger(userId));
    };
    window.addEventListener('studyflow:account-preferences-applied', refresh);
    return () => window.removeEventListener('studyflow:account-preferences-applied', refresh);
  }, [userId]);

  const monthlySeconds = useMemo(() => creditedSecondsInPeriod(sessions, bounds.start, bounds.end), [sessions, bounds.start, bounds.end]);

  const rewardMath = calculateMonthlyReward(monthlySeconds);
  const earnedBlocks = rewardMath.earnedBlocks;
  // Existing Gregorian payout entries cannot safely be re-attributed to individual sessions.
  // Conservatively reserve them in every overlapping Jalali month; never pay twice automatically.
  const { legacy: priorPaid, paid: paidBlocks } = reservedPaidBlocks(ledger, key, bounds.start, bounds.end, earnedBlocks);
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
    const next = { ...readLedger(userId), [key]: Math.max(0, Math.min(earnedBlocks, count - priorPaid)) };
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

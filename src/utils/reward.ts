export const HOURS_PER_REWARD = 28;
export const REWARD_TOMAN = 5_000_000;
export const TOMAN_PER_HOUR = REWARD_TOMAN / HOURS_PER_REWARD;

// Historical Gregorian payout entries have no session-to-payment mapping. Reserve all
// overlapping entries without modifying the original ledger or automatically paying them.
export function reservedPaidBlocks(ledger: Record<string, number>, jalaliKey: string, start: string, end: string, earnedBlocks: number) {
  const gregorianKeys = [start, new Date(Date.parse(end) - 1).toISOString()].map(value => value.slice(0, 7));
  const safeCount = (key: string) => Number.isSafeInteger(ledger[key]) ? Math.max(0, ledger[key]) : 0;
  const legacy = [...new Set(gregorianKeys)].reduce((sum, key) => sum + safeCount(key), 0);
  return { legacy, paid: Math.min(Math.max(0, earnedBlocks), safeCount(jalaliKey) + legacy) };
}

export function calculateMonthlyReward(monthlySeconds: number) {
  const safeSeconds = Math.max(0, Number.isFinite(monthlySeconds) ? monthlySeconds : 0);
  const milestoneSeconds = HOURS_PER_REWARD * 3600;
  const earnedBlocks = Math.floor(safeSeconds / milestoneSeconds);
  const remainderSeconds = safeSeconds % milestoneSeconds;
  const progress = remainderSeconds / milestoneSeconds;
  const nextMilestoneSeconds = remainderSeconds === 0 ? milestoneSeconds : milestoneSeconds - remainderSeconds;
  const monthlyHours = safeSeconds / 3600;
  return {
    monthlySeconds: safeSeconds,
    monthlyHours,
    earnedBlocks,
    remainderSeconds,
    progress,
    nextMilestoneSeconds,
    tomanPerHour: TOMAN_PER_HOUR,
    studyValueToman: Math.round(monthlyHours * TOMAN_PER_HOUR),
    earnedToman: earnedBlocks * REWARD_TOMAN
  };
}

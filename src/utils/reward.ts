export const HOURS_PER_REWARD = 28;
export const REWARD_TOMAN = 5_000_000;
export const TOMAN_PER_HOUR = REWARD_TOMAN / HOURS_PER_REWARD;

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

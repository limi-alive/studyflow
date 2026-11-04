import { describe, expect, it } from 'vitest';
import { calculateMonthlyReward, reservedPaidBlocks, REWARD_TOMAN, TOMAN_PER_HOUR } from './reward';

describe('monthly reward math', () => {
  it('uses exactly 5,000,000 Toman per 28 study hours', () => {
    expect(TOMAN_PER_HOUR).toBeCloseTo(5_000_000 / 28, 8);
    expect(calculateMonthlyReward(28 * 3600).earnedToman).toBe(REWARD_TOMAN);
    expect(calculateMonthlyReward(28 * 3600).earnedBlocks).toBe(1);
  });

  it('shows proportional study value before a reward unlocks', () => {
    const tenHours = calculateMonthlyReward(10 * 3600);
    expect(tenHours.earnedToman).toBe(0);
    expect(tenHours.studyValueToman).toBe(1_785_714);
    expect(tenHours.nextMilestoneSeconds).toBe(18 * 3600);
  });

  it('reserves historical Gregorian payments without editing ledger entries',()=>{
    const ledger={'2026-10':1,'2026-11':1,'1405-08':1};
    const before=JSON.stringify(ledger);
    expect(reservedPaidBlocks(ledger,'1405-08','2026-10-22T20:30:00Z','2026-11-21T20:30:00Z',2)).toEqual({legacy:2,paid:2});
    expect(reservedPaidBlocks({},'1405-08','2026-10-22T20:30:00Z','2026-11-21T20:30:00Z',1)).toEqual({legacy:0,paid:0});
    expect(JSON.stringify(ledger)).toBe(before);
  });
  it('keeps reward blocks cumulative within the month', () => {
    const result = calculateMonthlyReward(56 * 3600);
    expect(result.earnedBlocks).toBe(2);
    expect(result.earnedToman).toBe(10_000_000);
  });
});

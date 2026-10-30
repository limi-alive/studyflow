import { describe, expect, it } from 'vitest';
import { jalaliLeaderboardBoundsAt } from './leaderboardPeriod';

describe('public league: Jalali month beginning at Tehran midnight', () => {
  it('uses the complete Aban 1405 and not Gregorian October', () => {
    const period = jalaliLeaderboardBoundsAt(new Date('2026-10-30T12:00:00Z'));
    expect(period.monthKey).toBe('1405-08');
    expect(period.start).toBe('2026-10-22T20:30:00.000Z');
    expect(period.end).toBe('2026-11-21T20:30:00.000Z');
  });
  it('rolls over at Tehran midnight, not device local time or UTC midnight', () => {
    const before = jalaliLeaderboardBoundsAt(new Date('2026-11-21T20:29:59.999Z'));
    const after = jalaliLeaderboardBoundsAt(new Date('2026-11-21T20:30:00.000Z'));
    expect(before.monthKey).toBe('1405-08');
    expect(after.monthKey).toBe('1405-09');
    expect(before.end).toBe(after.start);
  });
  it('rolls over Nouruz with zero rollover deletions', () => {
    const before = jalaliLeaderboardBoundsAt(new Date('2026-03-20T20:29:59Z'));
    const after = jalaliLeaderboardBoundsAt(new Date('2026-03-20T20:30:00Z'));
    expect(before.monthKey).toBe('1404-12');
    expect(after.monthKey).toBe('1405-01');
    expect(before.end).toBe(after.start);
  });
  it('takes Date and epoch consistently and rejects NaN', () => {
    const date = new Date('2026-10-30T12:00:00Z');
    expect(jalaliLeaderboardBoundsAt(date)).toEqual(jalaliLeaderboardBoundsAt(date.getTime()));
    expect(() => jalaliLeaderboardBoundsAt(NaN)).toThrow(RangeError);
  });
});

import { describe, expect, it } from 'vitest';
import { utcMonthBoundsAt } from './leaderboardPeriod';

describe('public monthly leaderboard UTC rollover', () => {
  it('resets at the November boundary without deleting October data', () => {
    const before = utcMonthBoundsAt(new Date('2026-10-31T23:59:59.999Z'));
    const after = utcMonthBoundsAt(new Date('2026-11-01T00:00:00.000Z'));
    expect(before.monthKey).toBe('2026-10');
    expect(before.end).toBe(after.start);
    expect(after.monthKey).toBe('2026-11');
    expect(after.remainingMs).toBeGreaterThan(0);
  });
  it('rolls over correctly on New Year', () => {
    expect(utcMonthBoundsAt(new Date('2026-12-31T23:59:59.999Z')).end).toBe('2027-01-01T00:00:00.000Z');
  });
  it('handles February and leap years', () => {
    expect(utcMonthBoundsAt(new Date('2028-02-15T11:00:00Z')).end).toBe('2028-03-01T00:00:00.000Z');
    expect(utcMonthBoundsAt(new Date('2027-02-15T11:00:00Z')).end).toBe('2027-03-01T00:00:00.000Z');
  });
  it('uses UTC rather than the device timezone to avoid regional drift', () => {
    expect(utcMonthBoundsAt(new Date('2026-10-31T20:30:00-03:30')).monthKey).toBe('2026-11');
    expect(utcMonthBoundsAt(new Date('2026-11-01T01:30:00+02:00')).monthKey).toBe('2026-10');
  });
  it('accepts numeric timestamps and Date objects consistently', () => {
    const instant = new Date('2026-10-31T23:30:00.000Z');
    expect(utcMonthBoundsAt(instant.getTime())).toEqual(utcMonthBoundsAt(instant));
  });
  it('rejects invalid dates', () => {
    expect(() => utcMonthBoundsAt(NaN)).toThrow(RangeError);
    expect(() => utcMonthBoundsAt(new Date('invalid'))).toThrow(RangeError);
  });
});

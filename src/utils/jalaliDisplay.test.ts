import { describe, expect, it } from 'vitest';
import { jalaliLabel, jalaliRange, localDayFromKey } from './jalaliDisplay';

describe('Jalali presentation for Iranian users', () => {
  it('formats 2026-10-30 as Aban 1405 in Persian digits', () => {
    const label = jalaliLabel('2026-10-30');
    expect(label).toMatch(/آبان/);
    expect(label).toMatch(/۱۴۰۵/);
    expect(label).not.toMatch(/2026/);
  });
  it('respects Nowruz rollover, without changing ISO stored keys', () => {
    expect(jalaliLabel('2026-03-20')).toMatch(/اسفند/);
    expect(jalaliLabel('2026-03-21')).toMatch(/فروردین/);
    expect(jalaliRange(['2026-03-20','2026-03-21'])).toMatch(/تا/);
  });
  it('uses a local noon date and rejects impossible dates', () => {
    expect(localDayFromKey('2026-10-30').getHours()).toBe(12);
    expect(() => localDayFromKey('2026-02-30')).toThrow(RangeError);
  });
  it('can show a day and weekday using the Persian calendar', () => {
    expect(jalaliLabel('2026-10-30',{weekday:'long'})).toBe('جمعه');
    expect(jalaliLabel('2026-10-30',{day:'numeric'})).toMatch(/۸/);
  });
});

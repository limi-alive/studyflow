import { describe, expect, it } from 'vitest';
import { formatDuration, splitSessionByLocalDay, timerElapsedSeconds } from './time';

describe('timer utilities', () => {
  it('formats duration', () => expect(formatDuration(3661)).toBe('1:01:01'));
  it('uses timestamps rather than interval counts', () => {
    const start = '2026-01-01T10:00:00.000Z';
    expect(timerElapsedSeconds(start, 60_000, null, new Date('2026-01-01T10:11:00.000Z').getTime())).toBe(600);
  });
  it('subtracts an active pause', () => {
    const start = '2026-01-01T10:00:00.000Z';
    const paused = '2026-01-01T10:05:00.000Z';
    expect(timerElapsedSeconds(start, 0, paused, new Date('2026-01-01T10:20:00.000Z').getTime())).toBe(300);
  });
  it('splits a session that crosses midnight', () => {
    const parts = splitSessionByLocalDay('2026-01-01T23:30:00', '2026-01-02T00:30:00');
    expect(parts).toHaveLength(2);
    expect(parts.reduce((a,p)=>a+p.seconds,0)).toBe(3600);
  });
});

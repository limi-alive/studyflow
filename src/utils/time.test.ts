import { describe, expect, it } from 'vitest';
import { checkpointLimit, checkpointPauseAt, completedActiveSegments, creditableTimerSeconds, formatDuration, splitSessionByLocalDay, timerElapsedSeconds } from './time';
import type { ActiveTimer } from '../types';

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
  it('caps a suspended timer at a persisted checkpoint including pauses and reload', () => {
    const timer = { startedAt: '2026-01-01T10:00:00.000Z', totalPausedMs: 60_000,
      pausedAt: null, checkpointSeconds: 7200, state: 'running' } as ActiveTimer;
    expect(checkpointLimit(timer)).toBe(7200);
    expect(checkpointPauseAt(timer)).toBe('2026-01-01T12:01:00.000Z');
    expect(creditableTimerSeconds(timer, Date.parse('2026-01-02T10:00:00Z'))).toBe(7200);
    const reloaded = { ...timer, state: 'paused' as const, pausedAt: checkpointPauseAt(timer), awaitingConfirmation: true };
    expect(creditableTimerSeconds(reloaded, Date.parse('2026-01-03T10:00:00Z'))).toBe(7200);
    expect(creditableTimerSeconds({ ...reloaded, nextCheckpointSeconds: 14400 }, Date.parse('2026-01-03T10:00:00Z'))).toBe(7200);
  });
  it('preserves confirmed work through clock rollback and clips adjusted duration', () => {
    const timer = {startedAt:'2026-01-01T10:00:00Z',totalPausedMs:0,state:'paused',pausedAt:'2026-01-01T10:10:00Z',
      activeSegments:[{start:'2026-01-01T10:00:00Z',end:'2026-01-01T10:10:00Z'}]} as ActiveTimer;
    expect(creditableTimerSeconds(timer,Date.parse('2025-12-31T10:00:00Z'))).toBe(600);
    expect(completedActiveSegments(timer,'2026-01-01T10:10:00Z',120)).toEqual([{start:'2026-01-01T10:00:00Z',end:'2026-01-01T10:02:00.000Z'}]);
  });
  it('splits a session that crosses midnight', () => {
    const parts = splitSessionByLocalDay('2026-01-01T23:30:00', '2026-01-02T00:30:00');
    expect(parts).toHaveLength(2);
    expect(parts.reduce((a,p)=>a+p.seconds,0)).toBe(3600);
  });
});

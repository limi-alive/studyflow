import { describe, expect, it } from 'vitest';
import type { StudySession } from '../types';
import { shareSummaryText, studySprint } from './studySprint';

const session = (started: string, ended: string, seconds: number, deletedAt?: string): StudySession => ({
  id: started, userId: 'test', createdAt: started, updatedAt: ended,
  syncStatus: 'synced', deviceId: 'test-device', startTime: started, endTime: ended,
  studySeconds: seconds, breakSeconds: 0, pauseSeconds: 0, timerType: 'stopwatch',
  ...(deletedAt ? { deletedAt } : {})
});

// Use local date constructors: tests remain valid in different time zones.
const localIso = (y: number, m: number, d: number, h: number, min = 0) => new Date(y, m - 1, d, h, min).toISOString();

describe('7-day study sprint', () => {
  const now = new Date(2026, 9, 30, 18);
  it('shows seven local days across a month boundary', () => {
    const report = studySprint([], now);
    expect(report.days).toHaveLength(7);
    expect(report.days[0].key).toBe('2026-10-24');
    expect(report.days[6].key).toBe('2026-10-30');
    expect(report.completedDays).toBe(0);
  });
  it('counts a 25 minute focus day exactly once with multiple sessions', () => {
    const report = studySprint([
      session(localIso(2026,10,30,10), localIso(2026,10,30,10,12), 720),
      session(localIso(2026,10,30,11), localIso(2026,10,30,11,13), 780),
    ], now);
    expect(report.completedDays).toBe(1);
    expect(report.totalSeconds).toBe(1500);
    expect(report.completedSessions).toBe(2);
  });
  it('ignores deleted sessions and those from previous periods', () => {
    const report = studySprint([
      session(localIso(2026,10,20,10),localIso(2026,10,20,11),3600),
      session(localIso(2026,10,30,12),localIso(2026,10,30,13),3600,localIso(2026,10,30,14)),
    ], now);
    expect(report.totalSeconds).toBe(0);
  });
  it('splits a cross-midnight session by local date', () => {
    const report = studySprint([
      session(localIso(2026,10,29,23,40),localIso(2026,10,30,0,20),2400),
    ], now);
    expect(report.days[5].seconds).toBe(1200);
    expect(report.days[6].seconds).toBe(1200);
    expect(report.completedDays).toBe(0);
  });
  it('ignores invalid or future sessions rather than inventing progress', () => {
    const report = studySprint([
      session('oops','invalid',1500),
      session(localIso(2026,10,31,11),localIso(2026,10,31,12),3600),
    ], now);
    expect(report.totalSeconds).toBe(0);
  });
  it('generates Persian share text with Jalali dates on request', () => {
    const summary = studySprint([session(localIso(2026,10,30,10), localIso(2026,10,30,11),3600)], now);
    const text = shareSummaryText(summary,'fa');
    expect(text).toContain('آبان ۱۴۰۵');
    expect(text).toContain('شمسی');
    expect(text).not.toContain('2026-10-30');
  });
  it('never includes email, study notes, reward amount, or subject names in share text', () => {
    const summary = studySprint([session(localIso(2026,10,30,10), localIso(2026,10,30,11),3600)], now);
    const text = shareSummaryText(summary);
    expect(text).toContain('1h 0m');
    expect(text).toContain('https://limi-alive.github.io/studyflow/');
    expect(text).not.toMatch(/email|Tom[a-z]*|notes|subject/i);
  });
});

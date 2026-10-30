import { describe, expect, it } from 'vitest';
import type { StudySession } from '../types';
import { aggregateStudySessions, dailyStudyCsv, solarYearDays, tehranDayKey, tehranPersianYear } from './studyInsights';

function session(id: string, startTime: string, endTime: string, studySeconds: number, extra: Partial<StudySession> = {}): StudySession {
  return {id, userId:'user-a', startTime, endTime, studySeconds, timerType:'stopwatch', subjectId:'math',
    breakSeconds:0, pauseSeconds:0, deviceId:'d1', createdAt:startTime, updatedAt:endTime,
    syncStatus:'synced', ...extra};
}

describe('Study Insights private read-model', () => {
  it('splits a session over midnight Tehran without creating or losing seconds', () => {
    const rows = [session('s1','2026-10-21T20:20:00.000Z','2026-10-21T20:50:00.000Z',1800)];
    const result = aggregateStudySessions(rows,'user-a');
    expect(result.get('2026-10-21')?.seconds).toBe(600);
    expect(result.get('2026-10-22')?.seconds).toBe(1200);
    for (const day of result.values()) expect(day.cells.reduce((sum,cell)=>sum+cell.seconds,0)).toBe(day.seconds);
  });
  it('proportionally places net focus time when a session contains pauses', () => {
    const result=aggregateStudySessions([session('s1','2026-10-21T20:25:00Z','2026-10-21T20:50:00Z',900)],'user-a');
    expect(result.get('2026-10-21')?.seconds).toBe(180);
    expect(result.get('2026-10-22')?.seconds).toBe(720);
    expect([...result.values()].reduce((sum,day)=>sum+day.seconds,0)).toBe(900);
  });
  it('does not leak another account, deleted sessions or invalid dates', () => {
    const rows=[session('good','2026-10-23T00:00:00Z','2026-10-23T00:30:00Z',1200),
      session('other','2026-10-23T00:00:00Z','2026-10-23T00:30:00Z',1000,{userId:'user-b'}),
      session('deleted','2026-10-23T00:00:00Z','2026-10-23T00:30:00Z',1000,{deletedAt:'2026-10-24'}),
      session('invalid','missing','2026-10-23T00:30:00Z',1000)];
    expect([...aggregateStudySessions(rows,'user-a').values()].reduce((s,d)=>s+d.seconds,0)).toBe(1200);
  });
  it('separates manual entries from timer focus without changing underlying sessions', () => {
    const rows=[session('timer','2026-10-23T00:00:00Z','2026-10-23T00:30:00Z',900),session('manual','2026-10-23T01:00:00Z','2026-10-23T01:30:00Z',1800,{timerType:'manual'})];
    const all=aggregateStudySessions(rows,'user-a');
    expect([...all.values()].reduce((sum,d)=>sum+d.seconds,0)).toBe(2700);
    expect([...aggregateStudySessions(rows,'user-a','timer').values()].reduce((sum,d)=>sum+d.seconds,0)).toBe(900);
    expect([...aggregateStudySessions(rows,'user-a','manual').values()].reduce((sum,d)=>sum+d.seconds,0)).toBe(1800);
    expect(rows.length).toBe(2);
  });
  it('builds actual Jalali year months including Esfand and leap rules', () => {
    const months=solarYearDays(1405);
    expect(months).toHaveLength(12);
    expect(months[0]).toHaveLength(31);
    expect(months[6]).toHaveLength(30);
    expect([29,30]).toContain(months[11].length);
    expect(months[0][0].key).toBe('2026-03-21');
    expect(months[7][0].key).toBe('2026-10-23');
    const keys=months.flat().map(day=>day.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
  it('uses Iran timezone even when device TZ differs', () => {
    expect(tehranDayKey(new Date('2026-10-22T20:45:00Z'))).toBe('2026-10-23');
    expect(tehranPersianYear(new Date('2026-03-20T22:00:00Z'))).toBe(1405);
  });
  it('exports numeric-only daily CSV with no user notes or formulas', () => {
    const model=aggregateStudySessions([session('one','2026-10-23T00:00:00Z','2026-10-23T00:10:00Z',600,{note:'=HYPERLINK("bad")'})],'user-a');
    const csv=dailyStudyCsv(solarYearDays(1405),model);
    expect(csv).toContain('2026-10-23,600,600,0');
    expect(csv).not.toContain('HYPERLINK');
    expect(csv).toContain('date_iso,study_seconds,timer_seconds,manual_seconds');
  });
});

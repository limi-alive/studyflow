import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { StudySession } from '../types';
import { accountedAttribution, creditedSecondsBySubject, creditedSecondsInPeriod, monthlyPeriodAt } from './monthlyAccounting';

const row = (id: string, userId: string, start: string, end: string, segments?: StudySession['activeSegments']): StudySession => ({
  id,userId,createdAt:start,updatedAt:end,syncStatus:'pending',startTime:start,endTime:end,
  studySeconds:segments ? segments.reduce((sum,s)=>sum+(Date.parse(s.end)-Date.parse(s.start))/1000,0) : 3600,
  activeSegments:segments,breakSeconds:0,pauseSeconds:0,timerType:'stopwatch',deviceId:'device'
});

describe('canonical Tehran Jalali monthly accounting', () => {
  beforeEach(()=>{vi.useFakeTimers();vi.setSystemTime(new Date('2027-01-01T12:00:00Z'));});
  afterEach(()=>vi.useRealTimers());
  it('has contiguous exclusive bounds for every month including Nowruz and leap-year Esfand', () => {
    let instant = new Date('2024-03-20T20:30:00Z');
    for (let i=0;i<36;i++) {
      const current=monthlyPeriodAt(instant);
      expect(Date.parse(current.start)).toBeLessThanOrEqual(instant.getTime());
      expect(Date.parse(current.end)).toBeGreaterThan(instant.getTime());
      const next=monthlyPeriodAt(new Date(current.end));
      expect(next.start).toBe(current.end);
      instant=new Date(current.end);
    }
    expect(monthlyPeriodAt(new Date('2025-03-19T20:29:59Z')).monthKey).toBe('1403-12');
  });
  it('splits actual work, not paused time, across the month boundary and preserves legacy end attribution', () => {
    const before=monthlyPeriodAt(new Date('2026-11-21T20:29:00Z'));
    const after=monthlyPeriodAt(new Date(before.end));
    const center=Date.parse(before.end);
    const iso=(offset:number)=>new Date(center+offset*1000).toISOString();
    const segments=[{start:iso(-120),end:iso(-60)},{start:iso(-30),end:iso(90)}];
    const session=row('one','alice',iso(-120),iso(90),segments);
    const overlap=row('two','alice',iso(0),iso(60),[{start:iso(0),end:iso(60)}]);
    expect(creditedSecondsInPeriod([session],before.start,before.end)).toBe(90);
    expect(creditedSecondsInPeriod([session,overlap],after.start,after.end)).toBe(90);
    expect(creditedSecondsInPeriod([session,overlap],before.start,before.end)).toBe(90);
    expect(creditedSecondsInPeriod([session,overlap,row('other','bob',iso(0),iso(60),[{start:iso(0),end:iso(60)}])],after.start,after.end)).toBe(150);
    expect(creditedSecondsInPeriod([row('old','alice',iso(-120),iso(60))],before.start,before.end)).toBe(0);
    expect(creditedSecondsInPeriod([row('old','alice',iso(-120),iso(60))],after.start,after.end)).toBe(3600);
  });
  it('converges after two offline devices reconnect without deleting either history row',()=>{
    const period=monthlyPeriodAt(new Date('2026-11-01T12:00:00Z'));
    const first={...row('device-a','alice','2026-11-01T10:00:00Z','2026-11-01T11:00:00Z',
      [{start:'2026-11-01T10:00:00Z',end:'2026-11-01T11:00:00Z'}]),subjectId:'math'};
    const second={...row('device-b','alice','2026-11-01T10:30:00Z','2026-11-01T11:30:00Z',
      [{start:'2026-11-01T10:30:00Z',end:'2026-11-01T11:30:00Z'}]),subjectId:'math'};
    expect(creditedSecondsInPeriod([first],period.start,period.end)).toBe(3600);
    expect(creditedSecondsInPeriod([first,second],period.start,period.end)).toBe(5400);
    expect(creditedSecondsInPeriod([first,second,first],period.start,period.end)).toBe(5400);
    expect([first,second].map(item=>item.id)).toHaveLength(2);
    expect(accountedAttribution([first,second],period.start,period.end).conflictSeconds).toBe(0);
  });
  it('retains suspicious source rows but excludes invalid/future/duplicated segments from local accounting',()=>{
    const bounds=monthlyPeriodAt(new Date('2026-11-01T12:00:00Z'));
    const base='2026-11-01T10:00:00Z', end='2026-11-01T10:01:00Z';
    const valid=row('ok','alice',base,end,[{start:base,end}]);
    const duplicate={...row('duplicate','alice',base,end,[{start:base,end},{start:base,end}]),studySeconds:120};
    const negative={...row('negative','alice',base,end,[{start:end,end:base}]),studySeconds:-60};
    const inflated={...valid,id:'inflated',studySeconds:86400};
    const future={...row('future','alice','2028-11-01T10:00:00Z','2028-11-01T11:00:00Z',
      [{start:'2028-11-01T10:00:00Z',end:'2028-11-01T11:00:00Z'}])};
    expect(creditedSecondsInPeriod([valid,duplicate,negative,inflated,future],bounds.start,bounds.end)).toBe(60);
    expect(creditedSecondsInPeriod([duplicate,negative,inflated,future],bounds.start,bounds.end)).toBe(0);
  });
  it('unions identical, partial and adjacent sessions per user and flags different-subject overlap',()=>{
    const bounds=monthlyPeriodAt(new Date('2026-11-01T12:00:00Z'));
    const base=Date.parse('2026-11-01T10:00:00Z');
    const iso=(s:number)=>new Date(base+s*1000).toISOString();
    const first={...row('a','alice',iso(0),iso(120),[{start:iso(0),end:iso(120)}]),subjectId:'math'};
    const duplicate={...row('b','alice',iso(0),iso(120),[{start:iso(0),end:iso(120)}]),subjectId:'science'};
    const partial={...row('c','alice',iso(60),iso(180),[{start:iso(60),end:iso(180)}]),subjectId:'science'};
    const adjacent={...row('d','alice',iso(180),iso(240),[{start:iso(180),end:iso(240)}]),subjectId:'math'};
    const other={...row('e','bob',iso(0),iso(120),[{start:iso(0),end:iso(120)}]),subjectId:'science'};
    const all=[first,duplicate,partial,adjacent,other];
    expect(creditedSecondsInPeriod(all,bounds.start,bounds.end)).toBe(360);
    const subjects=creditedSecondsBySubject(all,bounds.start,bounds.end);
    expect(subjects.get('math')).toBe(60);
    expect(subjects.get('science')).toBe(180);
    const attribution=accountedAttribution(all,bounds.start,bounds.end);
    expect(attribution.conflictSeconds).toBe(120);
    expect([...subjects.values()].reduce((a,b)=>a+b,0)+attribution.conflictSeconds).toBe(360);
  });
});

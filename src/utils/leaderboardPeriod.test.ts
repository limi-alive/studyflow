import {describe,expect,it} from 'vitest';
import {monthlyPeriodAt} from './monthlyAccounting';

describe('canonical monthly period',()=>{
  it('is Tehran Jalali even for a Gregorian display setting',()=>{
    const instant=new Date('2026-11-21T20:29:59.999Z');
    expect(monthlyPeriodAt(instant).monthKey).toBe('1405-08');
    expect(monthlyPeriodAt(new Date('2026-11-21T20:30:00Z')).monthKey).toBe('1405-09');
    expect(monthlyPeriodAt(instant).end).toBe(monthlyPeriodAt(new Date('2026-11-21T20:30:00Z')).start);
  });
});

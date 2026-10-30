import {describe, expect, it} from 'vitest';
import {persianToGregorian, toPersianParts, persianLocalToIso, startOfPersianMonth, parsePersianDigits} from './persianCalendar';

describe('Persian calendar end-to-end date logic',()=>{
  it('shows 30 October 2026 as 8 Aban 1405',()=>expect(toPersianParts(new Date('2026-10-30T12:00:00Z'))).toEqual({year:1405,month:8,day:8}));
  it('reverses Nowruz exactly',()=>expect(persianToGregorian(1405,1,1)).toEqual({year:2026,month:3,day:21}));
  it('does not accept nonexistent Esfand 30',()=>expect(()=>persianToGregorian(1404,12,30)).toThrow(RangeError));
  it('handles rollover from year 1404 to 1405',()=>{
    expect(persianToGregorian(1404,12,29)).toEqual({year:2026,month:3,day:20});
    expect(persianToGregorian(1405,1,1)).toEqual({year:2026,month:3,day:21});
  });
  it('parses native Persian digits without changing dates',()=>expect(parsePersianDigits('۱۴۰۵/۰۸/۰۸')).toBe('1405/08/08'));
  it('converts a local date and time to ISO and back',()=>{
    const date=new Date(persianLocalToIso(1405,8,8,12,45));
    expect(toPersianParts(new Date(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate(),12)))).toEqual({year:1405,month:8,day:8});
    expect(date.getHours()).toBe(12);
    expect(date.getMinutes()).toBe(45);
  });
  it('returns first day of current Persian month',()=>{
    const result=startOfPersianMonth(new Date(2026,9,30));
    expect(toPersianParts(new Date(Date.UTC(result.getFullYear(),result.getMonth(),result.getDate(),12)))).toEqual({year:1405,month:8,day:1});
  });
});

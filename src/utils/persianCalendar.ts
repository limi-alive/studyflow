/** StudyFlow Persian calendar boundary. Stored dates remain ISO/Gregorian UTC. */
export const PERSIAN_MONTHS = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'] as const;
const digits = new Intl.NumberFormat('fa-IR', {useGrouping: false});
const persianParts = new Intl.DateTimeFormat('en-US-u-ca-persian-nu-latn', {
  year: 'numeric', month: 'numeric', day: 'numeric', timeZone: 'UTC'
});

export type PersianYmd = {year: number; month: number; day: number};

export function toPersianParts(value: Date): PersianYmd {
  if (Number.isNaN(value.getTime())) throw new RangeError('Invalid date');
  const parts = persianParts.formatToParts(value);
  const read = (type: string) => Number(parts.find(part => part.type === type)?.value);
  return {year: read('year'), month: read('month'), day: read('day')};
}

export function toPersianLocal(value: Date): PersianYmd {
  // Noon UTC on the local calendar day prevents timezone shifts near midnight.
  return toPersianParts(new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate(), 12)));
}

export function parsePersianDigits(text: string): string {
  return text.replace(/[\u06f0-\u06f9\u0660-\u0669]/g, ch => String(ch.charCodeAt(0) - (ch.charCodeAt(0) >= 0x6f0 ? 0x6f0 : 0x660)));
}

export function persianDateLabel(value: Date | string, options: Intl.DateTimeFormatOptions = {day:'numeric',month:'long',year:'numeric'}) {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-arabext', options).format(date);
}

export function formatPersianNumber(value: number) { return digits.format(value); }

/** A valid YYYY-MM-DD key for a local calendar day; not a timestamp. */
export function persianDateKey(date: Date): string {
  const {year,month,day} = toPersianLocal(date);
  return `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
}

function compare(a: PersianYmd, b: PersianYmd) {
  return a.year - b.year || a.month - b.month || a.day - b.day;
}

/** Reverse Persian calendar date using Intl ICU; no third-party calendar library. */
export function persianToGregorian(year: number, month: number, day: number): {year:number;month:number;day:number} {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day) || year < 1300 || year > 1550 || month < 1 || month > 12 || day < 1 || day > 31) {
    throw new RangeError('Invalid Jalali date');
  }
  const desired={year,month,day};
  // Binary-search a fixed UTC-day range that contains the entire Persian year.
  let lo=Math.floor(Date.UTC(year+620,0,1)/86400000);
  let hi=Math.floor(Date.UTC(year+622,11,31)/86400000);
  while(lo<=hi){
    const mid=Math.floor((lo+hi)/2);
    const date=new Date(mid*86400000);
    const part=toPersianParts(date);
    const cmp=compare(part,desired);
    if(cmp===0) return {year:date.getUTCFullYear(),month:date.getUTCMonth()+1,day:date.getUTCDate()};
    if(cmp<0)lo=mid+1;else hi=mid-1;
  }
  throw new RangeError('Day is not valid in this Persian month');
}

/** Converts user-entered Jalali date + local wall-clock time to canonical ISO. */
export function persianLocalToIso(year:number, month:number, day:number, hh=0, mm=0) {
  if(!Number.isInteger(hh)||!Number.isInteger(mm)||hh<0||hh>23||mm<0||mm>59)throw new RangeError('Invalid time');
  const g=persianToGregorian(year,month,day);
  const d=new Date(g.year,g.month-1,g.day,hh,mm,0,0);
  if(d.getFullYear()!==g.year||d.getMonth()!==g.month-1||d.getDate()!==g.day||d.getHours()!==hh||d.getMinutes()!==mm)throw new RangeError('Local time does not exist');
  return d.toISOString();
}

export function startOfPersianMonth(now: Date): Date {
  const {year,month}=toPersianLocal(now);
  const g=persianToGregorian(year,month,1);
  return new Date(g.year,g.month-1,g.day,0,0,0,0);
}

export function startOfPersianYear(now: Date): Date {
  const {year}=toPersianLocal(now);
  const g=persianToGregorian(year,1,1);
  return new Date(g.year,g.month-1,g.day,0,0,0,0);
}

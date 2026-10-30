import type { StudySession } from '../types';
import { persianToGregorian } from './persianCalendar';

/**
 * Private read-model of existing StudySession records. No DB writes, no network.
 * All civil days use Asia/Tehran regardless of device timezone or UI language.
 * Each 10-minute cell is an ESTIMATE: pause timestamps are not stored per event.
 */
const TEN_MINUTES_MS = 600_000;
const MAX_BUCKETS_PER_SESSION = 7 * 24 * 6;
const tehranClock = new Intl.DateTimeFormat('en-GB-u-ca-gregory-nu-latn', {
  timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});
const tehranPersian = new Intl.DateTimeFormat('en-US-u-ca-persian-nu-latn', {
  timeZone: 'Asia/Tehran', year: 'numeric', month: 'numeric', day: 'numeric',
});

function readParts(formatter: Intl.DateTimeFormat, date: Date) {
  const parts = formatter.formatToParts(date);
  const field = (type: string) => Number(parts.find(part => part.type === type)?.value);
  return { year: field('year'), month: field('month'), day: field('day'), hour: field('hour'), minute: field('minute') };
}
function dateKey(p: {year: number; month: number; day: number}) {
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}
export function tehranDayKey(date: Date) { return dateKey(readParts(tehranClock, date)); }
export function tehranPersianYear(date: Date) { return readParts(tehranPersian, date).year; }
export function tehranPersianLabel(date: Date, english = false) {
  return new Intl.DateTimeFormat(english ? 'en-US-u-ca-persian-nu-latn' : 'fa-IR-u-ca-persian-nu-arabext', {
    timeZone: 'Asia/Tehran', year: 'numeric', month: 'long', day: 'numeric',
  }).format(date);
}
export type StudySource = 'all' | 'timer' | 'manual';
export interface StudyCell { seconds: number; manualSeconds: number; bySubject: Record<string, number> }
export type StudyDay = { seconds: number; manualSeconds: number; cells: StudyCell[] };
export type StudyReadModel = Map<string, StudyDay>;
const emptyCell = (): StudyCell => ({ seconds: 0, manualSeconds: 0, bySubject: {} });
export function emptyStudyDay(): StudyDay { return { seconds: 0, manualSeconds: 0, cells: Array.from({length: 144}, emptyCell) }; }

export function aggregateStudySessions(sessions: StudySession[], userId: string, source: StudySource = 'all'): StudyReadModel {
  const days: StudyReadModel = new Map();
  const ensure = (key: string) => {
    let day = days.get(key);
    if (!day) { day = emptyStudyDay(); days.set(key, day); }
    return day;
  };
  for (const s of sessions) {
    if (s.userId !== userId || s.deletedAt || (source === 'manual' && s.timerType !== 'manual') ||
        (source === 'timer' && s.timerType === 'manual')) continue;
    const start = Date.parse(s.startTime), end = Date.parse(s.endTime);
    const total = Math.round(s.studySeconds);
    if (!Number.isFinite(start) || !Number.isFinite(end) || !Number.isFinite(total) || total <= 0 || end <= start) continue;
    const first = Math.floor(start / TEN_MINUTES_MS), last = Math.floor((end - 1) / TEN_MINUTES_MS);
    const count = last - first + 1;
    // Corrupt multi-week timestamps must not lock the browser. Keep the study
    // seconds visible on the ending day, but mark the single bucket as estimated.
    if (count > MAX_BUCKETS_PER_SESSION) {
      const date = new Date(end - 1);
      const part = readParts(tehranClock, date);
      const day = ensure(dateKey(part));
      const cell = day.cells[Math.floor((part.hour * 60 + part.minute) / 10)];
      day.seconds += total; cell.seconds += total;
      if (s.timerType === 'manual') { day.manualSeconds += total; cell.manualSeconds += total; }
      const subject = s.subjectId ?? 'general';
      cell.bySubject[subject] = (cell.bySubject[subject] ?? 0) + total;
      continue;
    }
    for (let bucket = first; bucket <= last; bucket++) {
      const from = Math.max(start, bucket * TEN_MINUTES_MS);
      const to = Math.min(end, (bucket + 1) * TEN_MINUTES_MS);
      // Cumulative rounding makes the sum of all cells equal studySeconds exactly.
      const seconds = Math.round(total * (to - start) / (end - start)) -
        Math.round(total * (from - start) / (end - start));
      if (seconds <= 0) continue;
      const midpoint = new Date(from + Math.floor((to - from) / 2));
      const part = readParts(tehranClock, midpoint);
      const day = ensure(dateKey(part));
      const cell = day.cells[Math.floor((part.hour * 60 + part.minute) / 10)];
      day.seconds += seconds; cell.seconds += seconds;
      if (s.timerType === 'manual') { day.manualSeconds += seconds; cell.manualSeconds += seconds; }
      const subject = s.subjectId ?? 'general';
      cell.bySubject[subject] = (cell.bySubject[subject] ?? 0) + seconds;
    }
  }
  return days;
}

export interface SolarDay { key: string; day: number; weekdayIndex: number; year: number; month: number; }
export function solarYearDays(year: number): SolarDay[][] {
  return Array.from({length: 12}, (_, monthIndex) => {
    const month = monthIndex + 1;
    const days: SolarDay[] = [];
    for (let day = 1; day <= 31; day++) {
      try {
        const g = persianToGregorian(year, month, day);
        const gregorian = new Date(Date.UTC(g.year, g.month - 1, g.day, 12));
        days.push({ key: `${g.year}-${String(g.month).padStart(2, '0')}-${String(g.day).padStart(2, '0')}`,
          day, weekdayIndex: (gregorian.getUTCDay() + 1) % 7, year, month });
      } catch (error) {
        if (error instanceof RangeError) break;
        throw error;
      }
    }
    return days;
  });
}
export function insightLevel(seconds: number) {
  return seconds <= 0 ? 0 : seconds < 20 * 60 ? 1 : seconds < 45 * 60 ? 2 : seconds < 90 * 60 ? 3 : 4;
}
/** Safe private export: fixed numeric/date columns only; no user content or notes. */
export function dailyStudyCsv(days: SolarDay[][], totals: StudyReadModel): string {
  const rows = ['date_iso,study_seconds,timer_seconds,manual_seconds'];
  for (const month of days) for (const day of month) {
    const value = totals.get(day.key);
    const total = value?.seconds ?? 0, manual = value?.manualSeconds ?? 0;
    rows.push(`${day.key},${total},${total - manual},${manual}`);
  }
  return '\uFEFF' + rows.join('\r\n') + '\r\n';
}

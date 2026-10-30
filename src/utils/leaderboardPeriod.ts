/** Monthly public leaderboard uses a single UTC calendar for every account.
 *  Boundaries are start-inclusive, end-exclusive. No study history is deleted.
 */
export function utcMonthBoundsAt(time: number | Date) {
  const date = new Date(time);
  if (!Number.isFinite(date.getTime())) throw new RangeError('Invalid leaderboard date');
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const startMs = Date.UTC(year, month, 1);
  const endMs = Date.UTC(year, month + 1, 1);
  return {
    start: new Date(startMs).toISOString(),
    end: new Date(endMs).toISOString(),
    monthKey: `${year}-${String(month + 1).padStart(2, '0')}`,
    nextResetAt: new Date(endMs).toISOString(),
    remainingMs: Math.max(0, endMs - date.getTime())
  };
}


import { persianToGregorian, PERSIAN_MONTHS } from './persianCalendar';

// Every player shares one Iran calendar month, regardless of their device timezone.
// RPC boundaries remain ISO UTC instants, start inclusive / end exclusive.
const tehranDateTime = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Tehran', year: 'numeric', month: 'numeric', day: 'numeric',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
});
const tehranPersian = new Intl.DateTimeFormat('en-US-u-ca-persian-nu-latn', {
  timeZone: 'Asia/Tehran', year: 'numeric', month: 'numeric', day: 'numeric'
});
function readParts(formatter: Intl.DateTimeFormat, value: Date) {
  const parts = formatter.formatToParts(value);
  const number = (type: string) => Number(parts.find(part => part.type === type)?.value);
  return { year: number('year'), month: number('month'), day: number('day'),
    hour: number('hour'), minute: number('minute'), second: number('second') };
}
function tehranMidnight(gregorian: {year: number; month: number; day: number}): Date {
  const midnightAsUtc = Date.UTC(gregorian.year, gregorian.month - 1, gregorian.day);
  // Resolve timezone offset using IANA rules (also works for past Iranian DST).
  let candidate = midnightAsUtc - 3.5 * 3600_000;
  for (let i = 0; i < 4; i++) {
    const local = readParts(tehranDateTime, new Date(candidate));
    const localAsUtc = Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute, local.second);
    const difference = localAsUtc - midnightAsUtc;
    if (difference === 0) return new Date(candidate);
    candidate -= difference;
  }
  const check = readParts(tehranDateTime, new Date(candidate));
  if (check.year !== gregorian.year || check.month !== gregorian.month || check.day !== gregorian.day || check.hour !== 0) {
    throw new RangeError('Could not resolve Tehran calendar midnight');
  }
  return new Date(candidate);
}

export function jalaliLeaderboardBoundsAt(time: number | Date) {
  const now = new Date(time);
  if (!Number.isFinite(now.getTime())) throw new RangeError('Invalid leaderboard date');
  const {year, month} = readParts(tehranPersian, now);
  const next = month === 12 ? {year: year + 1, month: 1} : {year, month: month + 1};
  const startMs = tehranMidnight(persianToGregorian(year, month, 1)).getTime();
  const endMs = tehranMidnight(persianToGregorian(next.year, next.month, 1)).getTime();
  if (startMs > now.getTime() || endMs <= now.getTime()) throw new RangeError('Invalid Jalali leaderboard bounds');
  return {
    start: new Date(startMs).toISOString(), end: new Date(endMs).toISOString(),
    monthKey: `${year}-${String(month).padStart(2, '0')}`,
    persianMonthLabel: `${PERSIAN_MONTHS[month - 1]} ${year}`,
    nextResetAt: new Date(endMs).toISOString(),
    remainingMs: Math.max(0, endMs - now.getTime())
  };
}

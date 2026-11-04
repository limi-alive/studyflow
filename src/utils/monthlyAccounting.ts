import type { StudySession } from '../types';
import { jalaliLeaderboardBoundsAt } from './leaderboardPeriod';

export function monthlyPeriodAt(time: number | Date) {
  return jalaliLeaderboardBoundsAt(time);
}

/** All accounts use Tehran Jalali months, regardless of display preference.
 * Legacy sessions have no pause timeline and remain attributed entirely to their end month.
 * Never infer active intervals from a historical start/end pair with unknown pauses.
 */
export function creditedSecondsBySubject(sessions: StudySession[], start: string, end: string) {
  const from = Date.parse(start), to = Date.parse(end);
  if (!Number.isFinite(from) || !Number.isFinite(to) || from >= to) throw new RangeError('Invalid period');
  const result = new Map<string, number>();
  const byUser = new Map<string, Array<{start: number; end: number; id: string; subject: string}>>();
  for (const session of sessions) {
    if (session.deletedAt) continue;
    const subject = session.subjectId ?? 'none';
    if (!session.activeSegments) {
      const ended = Date.parse(session.endTime);
      if (ended >= from && ended < to && Number.isFinite(session.studySeconds))
        result.set(subject, (result.get(subject) ?? 0) + Math.max(0, session.studySeconds));
      continue;
    }
    let remaining = Math.max(0, Number.isFinite(session.studySeconds) ? session.studySeconds : 0) * 1000;
    const intervals = byUser.get(session.userId) ?? [];
    for (const segment of session.activeSegments) {
      const a = Date.parse(segment.start), b = Date.parse(segment.end);
      if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a || remaining <= 0) continue;
      const actualEnd = a + Math.min(b - a, remaining);
      remaining -= actualEnd - a;
      if (actualEnd > from && a < to) intervals.push({ start: Math.max(a, from), end: Math.min(actualEnd, to), id: session.id, subject });
    }
    byUser.set(session.userId, intervals);
  }
  for (const intervals of byUser.values()) {
    intervals.sort((a, b) => a.start - b.start || a.end - b.end || a.id.localeCompare(b.id));
    let covered = from;
    const milliseconds = new Map<string, number>();
    for (const interval of intervals) {
      milliseconds.set(interval.subject, (milliseconds.get(interval.subject) ?? 0) + Math.max(0, interval.end - Math.max(interval.start, covered)));
      covered = Math.max(covered, interval.end);
    }
    for (const [subject, ms] of milliseconds) result.set(subject, (result.get(subject) ?? 0) + ms / 1000);
  }
  return result;
}

export function creditedSecondsInPeriod(sessions: StudySession[], start: string, end: string) {
  return Math.floor([...creditedSecondsBySubject(sessions, start, end).values()].reduce((a, b) => a + b, 0));
}

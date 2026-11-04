import type { StudySession } from '../types';
import { jalaliLeaderboardBoundsAt } from './leaderboardPeriod';

export function monthlyPeriodAt(time: number | Date) { return jalaliLeaderboardBoundsAt(time); }

type Interval = { start: number; end: number; subject: string };
export type Attribution = { bySubject: Map<string, number>; conflictSeconds: number; totalSeconds: number; provisional: boolean };

/** Legacy rows have no reliable pause timeline: retain their original end-month attribution.
 * New active intervals are unioned per account. Different-subject concurrent time is
 * globally credited once, but excluded from every subject until reviewed.
 * Local values remain provisional until the cloud accepts the source segments.
 */
export function accountedAttribution(sessions: StudySession[], start: string, end: string, now = Date.now()): Attribution {
  const from = Date.parse(start), to = Date.parse(end);
  if (!Number.isFinite(from) || !Number.isFinite(to) || from >= to) throw new RangeError('Invalid period');
  const milliseconds = new Map<string, number>();
  const byUser = new Map<string, Interval[]>();
  let provisional = false;
  for (const session of sessions) {
    if (session.deletedAt) continue;
    const subject = session.subjectId ?? 'none';
    if (!session.activeSegments) {
      const ended = Date.parse(session.endTime);
      if (ended >= from && ended < to && Number.isSafeInteger(session.studySeconds) && session.studySeconds >= 0) {
        milliseconds.set(subject,(milliseconds.get(subject)??0)+session.studySeconds*1000);
        provisional ||= session.syncStatus !== 'synced';
      }
      continue;
    }
    if (!Number.isSafeInteger(session.studySeconds) || session.studySeconds < 0 || session.studySeconds > 86400 ||
        session.activeSegments.length > 500 || Date.parse(session.endTime) > now + 300_000) continue;
    const intervals = byUser.get(session.userId) ?? [];
    let duration = 0, previous = -Infinity;
    const proposed: Interval[] = [];
    for (const segment of session.activeSegments) {
      const a=Date.parse(segment.start), b=Date.parse(segment.end);
      if (!Number.isFinite(a) || !Number.isFinite(b) || a < Date.parse(session.startTime) || b > Date.parse(session.endTime) ||
          b <= a || a < previous || b > now + 300_000) { duration = -1; break; }
      duration += b-a; previous=b;
      if (b>from && a<to) proposed.push({start:Math.max(a,from),end:Math.min(b,to),subject});
    }
    if (duration !== session.studySeconds*1000) continue;
    intervals.push(...proposed);
    if (proposed.length) provisional ||= session.syncStatus !== 'synced';
    byUser.set(session.userId,intervals);
  }
  let conflictMs = 0;
  for (const intervals of byUser.values()) {
    const points=[...new Set(intervals.flatMap(item=>[item.start,item.end]))].sort((a,b)=>a-b);
    for (let i=0;i<points.length-1;i++) {
      const subjects=new Set(intervals.filter(item=>item.start<points[i+1]&&item.end>points[i]).map(item=>item.subject));
      if (!subjects.size) continue;
      const amount=points[i+1]-points[i];
      if (subjects.size>1) conflictMs+=amount;
      else { const only=subjects.values().next().value as string; milliseconds.set(only,(milliseconds.get(only)??0)+amount); }
    }
  }
  const bySubject=new Map([...milliseconds].map(([subject,ms])=>[subject,ms/1000]));
  return {bySubject,conflictSeconds:conflictMs/1000,totalSeconds:Math.floor((conflictMs+[...milliseconds.values()].reduce((a,b)=>a+b,0))/1000),provisional};
}

export function creditedSecondsBySubject(sessions: StudySession[], start: string, end: string) {
  return accountedAttribution(sessions,start,end).bySubject;
}
export function creditedSecondsInPeriod(sessions: StudySession[], start: string, end: string) {
  return accountedAttribution(sessions,start,end).totalSeconds;
}

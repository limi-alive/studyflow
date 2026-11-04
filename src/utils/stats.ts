import type { StudySession } from '../types';
import { splitSessionByLocalDay } from './time';

export function totalStudySeconds(sessions: StudySession[]) { return sessions.reduce((a, s) => a + s.studySeconds, 0); }
export function averageSessionSeconds(sessions: StudySession[]) { return sessions.length ? Math.round(totalStudySeconds(sessions) / sessions.length) : 0; }

function allocateSessionByDay(session: StudySession) {
  if (!session.activeSegments) return [{date: new Date(session.endTime).toLocaleDateString('en-CA'), seconds: session.studySeconds}];
  return session.activeSegments.flatMap(segment => splitSessionByLocalDay(segment.start, segment.end));
}

export function dailySeries(sessions: StudySession[], days = 7) {
  const map = new Map<string, number>();
  for (const session of sessions) {
    for (const part of allocateSessionByDay(session)) map.set(part.date, (map.get(part.date) ?? 0) + part.seconds);
  }
  const out: { date: string; seconds: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString('en-CA');
    out.push({ date: key, seconds: map.get(key) ?? 0 });
  }
  return out;
}

export function currentStreak(sessions: StudySession[]) {
  const days = new Set(sessions.map(s => new Date(s.startTime).toLocaleDateString('en-CA')));
  const cursor = new Date();
  let key = cursor.toLocaleDateString('en-CA');
  if (!days.has(key)) { cursor.setDate(cursor.getDate() - 1); key = cursor.toLocaleDateString('en-CA'); }
  let streak = 0;
  while (days.has(key)) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
    key = cursor.toLocaleDateString('en-CA');
  }
  return streak;
}

export function longestStreak(sessions: StudySession[]) {
  const days = [...new Set(sessions.map(s => new Date(s.startTime).toLocaleDateString('en-CA')))].sort();
  let best = 0, run = 0, previous: Date | null = null;
  for (const key of days) {
    const d = new Date(`${key}T12:00:00`);
    if (!previous) run = 1;
    else {
      const diff = Math.round((d.getTime() - previous.getTime()) / 86400000);
      run = diff === 1 ? run + 1 : 1;
    }
    best = Math.max(best, run); previous = d;
  }
  return best;
}

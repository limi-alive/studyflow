import type { StudySession } from '../types';
import { jalaliRange } from './jalaliDisplay';

export const SPRINT_MINUTES_PER_DAY = 25;
export const SPRINT_DAYS = 7;
export type SprintDay = { key: string; weekday: string; seconds: number; complete: boolean };
export type SprintSummary = {
  days: SprintDay[];
  completedDays: number;
  totalSeconds: number;
  completedSessions: number;
  targetSeconds: number;
};

function dateKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** A rolling local-calendar 7-day challenge. No data is uploaded or stored. */
export function studySprint(sessions: ReadonlyArray<StudySession>, now: Date = new Date()): SprintSummary {
  const days: SprintDay[] = [];
  const byDate = new Map<string, number>();
  const targetSeconds = SPRINT_MINUTES_PER_DAY * 60;
  const nowMs = now.getTime();

  for (let offset = SPRINT_DAYS - 1; offset >= 0; offset--) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset, 12);
    const key = dateKey(date);
    days.push({ key, weekday: date.toLocaleDateString('en-US', { weekday: 'short' }), seconds: 0, complete: false });
    byDate.set(key, 0);
  }
  const windowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (SPRINT_DAYS - 1), 0).getTime();
  let completedSessions = 0;

  for (const session of sessions) {
    if (session.deletedAt || !Number.isFinite(session.studySeconds) || session.studySeconds <= 0) continue;
    const start = Date.parse(session.startTime);
    const end = Date.parse(session.endTime);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || end <= windowStart || start > nowMs) continue;
    completedSessions++;

    // Allocate verified study seconds across the local days spanned by a session.
    // The duration is clipped to 'now' to avoid counting future timestamps.
    const clippedEnd = Math.min(end, nowMs);
    const wallSeconds = (end - start) / 1000;
    let cursor = Math.max(start, windowStart);
    while (cursor < clippedEnd) {
      const at = new Date(cursor);
      const nextMidnight = new Date(at.getFullYear(), at.getMonth(), at.getDate() + 1, 0).getTime();
      const until = Math.min(nextMidnight, clippedEnd);
      const key = dateKey(at);
      if (byDate.has(key)) {
        const chunkSeconds = session.studySeconds * ((until - cursor) / 1000) / wallSeconds;
        byDate.set(key, (byDate.get(key) ?? 0) + chunkSeconds);
      }
      cursor = until;
    }
  }

  let completedDays = 0;
  let totalSeconds = 0;
  for (const day of days) {
    day.seconds = Math.max(0, Math.floor(byDate.get(day.key) ?? 0));
    day.complete = day.seconds >= targetSeconds;
    totalSeconds += day.seconds;
    if (day.complete) completedDays++;
  }
  return { days, completedDays, totalSeconds, completedSessions, targetSeconds };
}

export function shareSummaryText(summary: SprintSummary, language: 'en' | 'fa' = 'en') {
  const h = Math.floor(summary.totalSeconds / 3600);
  const m = Math.floor((summary.totalSeconds % 3600) / 60);
  const period = jalaliRange(summary.days.map(day => day.key));
  if (language === 'fa') return `گزارش تمرکز من در StudyFlow ✨\n${h} ساعت و ${m} دقیقه مطالعه در هفت روز اخیر\n${summary.completedDays} روز با حداقل ۲۵ دقیقه تمرکز\n${period} (شمسی)\nStudyFlow: https://limi-alive.github.io/studyflow/`;
  return `My StudyFlow focus recap ✨\n${h}h ${m}m of focus in the last 7 days\n${summary.completedDays}/7 days with at least 25 minutes of study\nJalali dates: ${period}\nJoin me on StudyFlow: https://limi-alive.github.io/studyflow/`;
}

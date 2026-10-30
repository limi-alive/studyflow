import type { Exam, StudySession, StudyTask, Subject } from '../types';

export type StudyOSItem = {
  id: string;
  kind: 'task' | 'review' | 'exam';
  title: string;
  subtitle: string;
  subjectId: string | null;
  taskId?: string;
  minutes: number;
  score: number;
  dueAt?: string;
};

export type ExamForecast = {
  id: string;
  title: string;
  date: string;
  subjectId: string | null;
  daysLeft: number;
  remainingMinutes: number | null;
  dailyMinutes: number | null;
  studiedMinutes: number;
};

export type StudyOSInput = {
  userId: string;
  tasks: StudyTask[];
  subjects: Subject[];
  exams: Exam[];
  sessions: StudySession[];
  now: Date;
  capacityMinutes: number;
};

const DAY = 86_400_000;
const safe = (n: number, fallback = 0) => Number.isFinite(n) ? n : fallback;
const countMinutes = (n: number) => Math.max(0, Math.round(safe(n)));

// Local calendar-day boundaries; avoid DST-sensitive milliseconds/24h rounding.
export function localDayNumber(date: Date): number {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY);
}
export function daysUntil(value: string, now: Date): number {
  const timestamp = new Date(value);
  return Number.isNaN(timestamp.getTime()) ? Number.POSITIVE_INFINITY : localDayNumber(timestamp) - localDayNumber(now);
}
export function dayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function sessionDays(sessions: StudySession[], now: Date, days = 14): number[] {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = localDayNumber(today) - days + 1;
  const totals = Array.from({ length: days }, () => 0);
  for (const session of sessions) {
    if (session.deletedAt || session.studySeconds <= 0) continue;
    // Split by local midnight; allocate only actual focus seconds (excludes pauses).
    let cursor = new Date(session.startTime).getTime();
    const end = new Date(session.endTime).getTime();
    if (!Number.isFinite(cursor) || !Number.isFinite(end) || end <= cursor) continue;
    const wall = end - cursor;
    let assigned = 0;
    const segments: {day: number; wall: number}[] = [];
    let guard = 0;
    while (cursor < end && guard++ < 400) {
      const date = new Date(cursor);
      const next = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).getTime();
      const stop = Math.min(end, next);
      segments.push({day: localDayNumber(date), wall: stop - cursor});
      cursor = stop;
    }
    segments.forEach((part, index) => {
      const seconds = index === segments.length - 1 ? Math.max(0, session.studySeconds - assigned) : Math.floor(session.studySeconds * part.wall / wall);
      assigned += seconds;
      const offset = part.day - start;
      if (offset >= 0 && offset < days) totals[offset] += seconds;
    });
  }
  return totals;
}

export function buildStudyOS(input: StudyOSInput) {
  const {now, capacityMinutes, userId} = input;
  const capacity = Math.max(15, Math.min(360, countMinutes(capacityMinutes) || 90));
  const tasks = input.tasks.filter(t => t.userId === userId && !t.deletedAt && !['completed', 'archived', 'skipped'].includes(t.status));
  const subjects = input.subjects.filter(s => s.userId === userId && !s.deletedAt && !s.archived);
  const sessions = input.sessions.filter(s => s.userId === userId && !s.deletedAt && s.studySeconds > 0 && Number.isFinite(new Date(s.endTime).getTime()));
  const exams = input.exams.filter(e => e.userId === userId && !e.deletedAt && Number.isFinite(new Date(e.date).getTime()));
  const studiedBySubject = new Map<string, {last: number; count: number; minutes: number}>();
  const recentBySubject = new Map<string, number>();
  for (const session of sessions) {
    if (!session.subjectId) continue;
    const previous = studiedBySubject.get(session.subjectId) ?? {last: 0, count: 0, minutes: 0};
    const end = new Date(session.endTime).getTime();
    previous.last = Math.max(previous.last, end);
    previous.count++;
    previous.minutes += session.studySeconds / 60;
    studiedBySubject.set(session.subjectId, previous);
    if (end >= now.getTime() - 30 * DAY && end <= now.getTime()) recentBySubject.set(session.subjectId, (recentBySubject.get(session.subjectId) ?? 0) + session.studySeconds / 60);
  }
  const subjectNames = new Map(subjects.map(s => [s.id, s.name]));
  const upcoming = exams.map(exam => {
    const daysLeft = daysUntil(exam.date, now);
    const studiedMinutes = exam.subjectId ? countMinutes(recentBySubject.get(exam.subjectId) ?? 0) : 0;
    const remainingMinutes = exam.targetHours === undefined || exam.targetHours === null ? null : Math.max(0, countMinutes(exam.targetHours * 60 - studiedMinutes));
    return {
      id: exam.id, title: exam.name, date: exam.date, subjectId: exam.subjectId ?? null,
      daysLeft, studiedMinutes, remainingMinutes,
      dailyMinutes: remainingMinutes === null ? null : Math.ceil(remainingMinutes / Math.max(1, daysLeft))
    } satisfies ExamForecast;
  }).filter(x => x.daysLeft >= 0).sort((a,b) => a.daysLeft - b.daysLeft).slice(0, 8);

  const items: StudyOSItem[] = [];
  for (const task of tasks) {
    const days = task.deadline ? daysUntil(task.deadline, now) : Number.POSITIVE_INFINITY;
    const urgent = days <= 0 ? 80 : days <= 2 ? 55 : days <= 7 ? 25 : 0;
    const examBoost = upcoming.some(e => e.subjectId && e.subjectId === task.subjectId && e.daysLeft <= 7) ? 18 : 0;
    items.push({
      id: `task:${task.id}`, kind: 'task', taskId: task.id, subjectId: task.subjectId ?? null,
      title: task.title,
      subtitle: Number.isFinite(days) ? (days < 0 ? 'مهلت گذشته' : days === 0 ? 'موعد امروز' : `${days} روز تا موعد`) : (task.subjectId ? subjectNames.get(task.subjectId) ?? 'تکلیف' : 'تکلیف بدون موعد'),
      minutes: Math.max(10, Math.min(60, countMinutes(task.estimatedMinutes ?? 30) || 30)),
      score: 30 + urgent + Math.min(10, safe(task.priority, 1) * 3) + examBoost,
      dueAt: task.deadline ?? undefined
    });
  }
  for (const subject of subjects) {
    const record = studiedBySubject.get(subject.id);
    const daysSince = record ? Math.max(0, daysUntil(now.toISOString(), new Date(record.last))) : Number.POSITIVE_INFINITY;
    const hasTask = tasks.some(t => t.subjectId === subject.id);
    // Review suggestion is based on inactivity only; it does not claim to estimate memory retention.
    if (record && daysSince < 3) continue;
    if (!record && hasTask) continue;
    items.push({id:`review:${subject.id}`,kind:'review',title:`مرور ${subject.name}`,subjectId:subject.id,
      subtitle: record ? `${daysSince} روز از آخرین مطالعه` : 'این درس هنوز جلسه ثبت‌شده ندارد',
      minutes: 20, score: record ? Math.min(88, 24 + daysSince * 5) : 32 + Math.min(10, Math.max(0, subject.priority) * 2)});
  }
  for (const exam of upcoming.filter(e => e.daysLeft <= 14 && e.subjectId && !tasks.some(t => t.subjectId === e.subjectId))) {
    if (items.some(item => item.kind === 'review' && item.subjectId === exam.subjectId)) continue;
    items.push({id:`exam:${exam.id}`,kind:'exam',title:`آمادگی ${exam.title}`,subjectId:exam.subjectId,
      subtitle: `${exam.daysLeft} روز تا آزمون`, minutes:Math.max(20,Math.min(45,exam.dailyMinutes ?? 30)),score:exam.daysLeft<=3?105:67});
  }
  items.sort((a,b) => b.score-a.score || a.id.localeCompare(b.id));
  const plan: StudyOSItem[] = [];
  let remaining = capacity;
  for (const item of items) {
    if (remaining < 10 || plan.length === 5) break;
    const minutes = Math.min(item.minutes, remaining);
    if (minutes < 10) break;
    plan.push({...item,minutes});
    remaining -= minutes;
  }
  const days = sessionDays(sessions,now,14);
  const weeklySeconds = days.slice(7).reduce((sum,value)=>sum+value,0);
  const previousSeconds = days.slice(0,7).reduce((sum,value)=>sum+value,0);
  const activeDays = days.slice(7).filter(x=>x>0).length;
  const peak = [...recentBySubject.entries()].sort((a,b)=>b[1]-a[1])[0];
  return {plan, backlog: items.length,capacity, allocated: capacity-remaining, remaining,
    upcoming, weeklySeconds, previousSeconds, activeDays, days:days.slice(7),
    topSubject: peak ? subjectNames.get(peak[0]) ?? null : null,
    sessionsLast30: sessions.filter(s => new Date(s.endTime).getTime() >= now.getTime() - 30*DAY).length};
}

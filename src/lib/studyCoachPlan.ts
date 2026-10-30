import { db, nowIso } from './db';
import { requestSync } from './sync';
import type { StudyTask, Subject } from '../types';

/** StudyFlow AI proposes changes but never writes without an explicit review and confirmation. */
export type CoachPlanItem = {
  kind: 'study' | 'break';
  title: string;
  subject: string;
  minutes: number;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  notes: string;
};

const isDate = (v: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const [y, m, d] = v.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
};
const isTime = (v: string): boolean => /^([01]\d|2[0-3]):[0-5]\d$/.test(v);

export function parseCoachPlan(raw: unknown): CoachPlanItem[] {
  if (!raw || typeof raw !== 'object' || !('tasks' in raw)) throw new Error('invalid_plan');
  const tasks = (raw as {tasks?:unknown}).tasks;
  if (!Array.isArray(tasks) || tasks.length < 1 || tasks.length > 12) throw new Error('invalid_plan');
  const result: CoachPlanItem[] = tasks.map(row => {
    if (!row || typeof row !== 'object') throw new Error('invalid_plan');
    const x = row as Record<string, unknown>;
    const title = typeof x.title === 'string' ? x.title.trim() : '';
    const subject = typeof x.subject === 'string' ? x.subject.trim() : '';
    const notes = typeof x.notes === 'string' ? x.notes.trim() : '';
    if (!['study','break'].includes(String(x.kind)) || !title || title.length > 100 ||
      subject.length > 70 || notes.length > 160 || typeof x.minutes !== 'number' || !Number.isInteger(x.minutes) ||
      Number(x.minutes) < 5 || Number(x.minutes) > 240) throw new Error('invalid_plan');
    const date = x.date == null || x.date === '' ? null : x.date;
    const startTime = x.startTime == null || x.startTime === '' ? null : x.startTime;
    const endTime = x.endTime == null || x.endTime === '' ? null : x.endTime;
    if (date !== null && (typeof date !== 'string' || !isDate(date))) throw new Error('invalid_plan');
    if (startTime !== null && (typeof startTime !== 'string' || !isTime(startTime))) throw new Error('invalid_plan');
    if (endTime !== null && (typeof endTime !== 'string' || !isTime(endTime))) throw new Error('invalid_plan');
    if (!date && (startTime || endTime)) throw new Error('invalid_plan');
    return {kind:x.kind as 'study' | 'break',title,subject,notes,
      minutes:Number(x.minutes),date,startTime,endTime};
  });
  if (!result.some(x=>x.kind === 'study')) throw new Error('invalid_plan');
  return result;
}

export function coachPlanDeadline(item: CoachPlanItem): string | null {
  if (!item.date) return null;
  const time = item.endTime ?? item.startTime;
  if (!time) return null;
  const local = new Date(`${item.date}T${time}:00`);
  if (Number.isNaN(local.getTime())) throw new Error('invalid_plan');
  // Reject nonexistent local wall-clock times (e.g. DST spring forward).
  const pad = (n:number) => String(n).padStart(2, '0');
  if (`${local.getFullYear()}-${pad(local.getMonth()+1)}-${pad(local.getDate())}` !== item.date ||
      `${pad(local.getHours())}:${pad(local.getMinutes())}` !== time) throw new Error('invalid_plan');
  return local.toISOString();
}

function normalizeSubject(s: string) {
  return s.toLowerCase().replace(/[\s‌\u0640]+/g,'').replace(/ي/g,'ی').replace(/ك/g,'ک');
}

export function buildCoachPlanTasks(items: CoachPlanItem[], userId: string, subjects: Subject[]): StudyTask[] {
  if (!userId) throw new Error('invalid_user');
  const timestamp = nowIso();
  const active = subjects.filter(s => !s.deletedAt && !s.archived);
  return items.filter(x => x.kind === 'study').map((x): StudyTask => {
    const subject = x.subject && active.find(s => normalizeSubject(s.name) === normalizeSubject(x.subject));
    const title = subject || !x.subject ? x.title : `${x.subject}: ${x.title}`.slice(0,150);
    const detail = [x.date && x.startTime && `${x.date} ${x.startTime}${x.endTime ? `–${x.endTime}` : ''}`, x.notes].filter(Boolean).join(' · ');
    return {
      id:crypto.randomUUID(), userId, subjectId:subject ? subject.id : null, topicId:null,
      title, description:detail || undefined, estimatedMinutes:x.minutes,
      deadline:coachPlanDeadline(x), priority:1, status:'todo',
      createdAt:timestamp, updatedAt:timestamp, syncStatus:'pending'
    };
  });
}

export async function saveCoachPlan(items: CoachPlanItem[], userId: string): Promise<number> {
  const subjects = await db.subjects.where('userId').equals(userId).toArray();
  const tasks = buildCoachPlanTasks(items, userId, subjects);
  if (!tasks.length || tasks.length > 12) throw new Error('invalid_plan');
  // Single IndexedDB transaction ensures no partial import. No history, rewards, or sessions modified.
  await db.transaction('rw', db.tasks, async () => { await db.tasks.bulkAdd(tasks); });
  try { requestSync(userId); } catch { /* saved locally; sync can recover on the next app cycle */ }
  return tasks.length;
}

export function todayLocalIso(): string {
  const d = new Date();
  const pad = (n:number) => String(n).padStart(2,'0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}

import type { StudyTask } from '../types';

/** Show only this user's open Planner tasks, including AI-imported tasks. */
export function selectablePlannerTasks(tasks: StudyTask[], userId: string): StudyTask[] {
  return tasks
    .filter(task => task.userId === userId && !task.deletedAt &&
      (task.status === 'todo' || task.status === 'in_progress'))
    .sort((a,b) => (a.deadline ?? '9999').localeCompare(b.deadline ?? '9999') ||
      a.createdAt.localeCompare(b.createdAt));
}

export function focusTaskDefaults(task: StudyTask) {
  const raw = task.estimatedMinutes;
  const duration = typeof raw === 'number' && Number.isFinite(raw)
    ? Math.min(240, Math.max(1, Math.round(raw))) : 25;
  return {
    subjectId: task.subjectId || '',
    duration,
    intent: task.title.slice(0, 90)
  };
}

export type FocusTaskBucket = 'today' | 'upcoming' | 'unscheduled';

/** Work with calendar dates without shifting YYYY-MM-DD-only deadlines across timezones. */
export function focusTaskLocalDate(deadline?: string | null): string | null {
  if (!deadline) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
    const parsed = new Date(`${deadline}T12:00:00`);
    return !Number.isNaN(parsed.getTime()) && `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}` === deadline ? deadline : null;
  }
  const parsed = new Date(deadline);
  if (Number.isNaN(parsed.getTime())) return null;
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
}

export function focusTaskBucket(task: StudyTask, today: string): FocusTaskBucket {
  const date = focusTaskLocalDate(task.deadline);
  return !date ? 'unscheduled' : date <= today ? 'today' : 'upcoming';
}

/** Display-only cleanup. Never edit task.title stored in IndexedDB or Supabase. */
export function focusTaskDisplayTitle(title: string, subjectName?: string, estimatedMinutes?: number): string {
  let result = String(title ?? '').replace(/\s+/g, ' ').trim();
  if (subjectName?.trim()) {
    const safe = subjectName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Remove only exact subject labels separated by a colon/dash; don't strip mixed-subject titles.
    const prefix = new RegExp(`^(?:${safe})\\s*[:：|–—-]\\s*`, 'iu');
    for (let i = 0; i < 2 && prefix.test(result); i++) result = result.replace(prefix, '').trim();
  }
  const minutes = typeof estimatedMinutes === 'number' && Number.isFinite(estimatedMinutes)
    ? Math.round(estimatedMinutes) : null;
  if (minutes !== null && minutes > 0) {
    // Only remove a duration repeated at the edge of the title and matching the task's own duration.
    const value = String(minutes);
    result = result.replace(new RegExp(`^${value}\\s*(?:min|minutes|دقیقه)\\s*[:：|·•–—-]?\\s*`, 'iu'), '').trim();
    result = result.replace(new RegExp(`\\s*(?:[·•|–—-]\\s*)?${value}\\s*(?:min|minutes|دقیقه)\\s*$`, 'iu'), '').trim();
  }
  return result || String(title ?? '').trim() || 'Untitled task';
}

function normalizedSearch(value: string): string {
  return value.toLocaleLowerCase().replace(/[يى]/g, 'ی').replace(/ك/g, 'ک')
    .replace(/[\u064b-\u065f\u0670\u200c]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function focusTaskSearchMatch(task: StudyTask, subjectName: string, query: string): boolean {
  const tokens = normalizedSearch(query).split(' ').filter(Boolean);
  if (!tokens.length) return true;
  const text = normalizedSearch([task.title, subjectName, task.description ?? ''].join(' '));
  return tokens.every(token => text.includes(token));
}

export function focusTaskDueLabel(deadline: string, fa: boolean): string {
  const date = focusTaskLocalDate(deadline);
  if (!date) return '';
  const year = Number(date.slice(0, 4)), month = Number(date.slice(5, 7)), day = Number(date.slice(8, 10));
  return new Intl.DateTimeFormat(fa ? 'fa-IR' : 'en-GB', { month: 'short', day: 'numeric' })
    .format(new Date(year, month - 1, day, 12));
}

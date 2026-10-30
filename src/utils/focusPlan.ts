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

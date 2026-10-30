import { describe, expect, it } from 'vitest';
import { focusTaskDefaults, selectablePlannerTasks } from './focusPlan';
import type { StudyTask } from '../types';

const task = (id: string, extra: Partial<StudyTask> = {}): StudyTask => ({
  id, userId:'user-a', title:`درس ${id}`, subjectId:null, status:'todo', priority:1, syncStatus:'pending',
  estimatedMinutes:50, createdAt:'2026-10-30T12:00:00Z', updatedAt:'2026-10-30T12:00:00Z',
  ...extra
});

describe('Planner tasks available in Focus', () => {
  it('includes imported and manual tasks, excludes completed/deleted/other-user tasks', () => {
    const rows = [task('imported'),task('manual',{status:'in_progress'}),task('completed',{status:'completed'}),
      task('deleted',{deletedAt:'2026-10-30T14:00:00Z'}),task('other',{userId:'user-b'})];
    expect(selectablePlannerTasks(rows,'user-a').map(t=>t.id)).toEqual(['imported','manual']);
  });
  it('sorts scheduled tasks first and does not mutate database rows', () => {
    const rows = [task('later'),task('earlier',{deadline:'2026-10-31T09:00:00Z'})];
    expect(selectablePlannerTasks(rows,'user-a').map(t=>t.id)).toEqual(['earlier','later']);
    expect(rows[0].id).toBe('later');
  });
  it('uses chosen task subject, safe countdown and intent defaults', () => {
    expect(focusTaskDefaults(task('x',{subjectId:'math',estimatedMinutes:300,title:'ریاضی'})))
      .toEqual({subjectId:'math',duration:240,intent:'ریاضی'});
    expect(focusTaskDefaults(task('x',{estimatedMinutes:undefined})).duration).toBe(25);
  });
});

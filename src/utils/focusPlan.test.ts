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

describe('Focus task picker data and display', () => {
  it('groups overdue and today separately from future / no date', async () => {
    const { focusTaskBucket } = await import('./focusPlan');
    expect(focusTaskBucket(task('a',{deadline:'2026-10-30'}), '2026-10-31')).toBe('today');
    expect(focusTaskBucket(task('b',{deadline:'2026-10-31'}), '2026-10-31')).toBe('today');
    expect(focusTaskBucket(task('c',{deadline:'2026-11-01'}), '2026-10-31')).toBe('upcoming');
    expect(focusTaskBucket(task('d'), '2026-10-31')).toBe('unscheduled');
    expect(focusTaskBucket(task('e',{deadline:'not-a-date'}), '2026-10-31')).toBe('unscheduled');
  });
  it('keeps local-only dates stable and rejects invalid calendar dates', async () => {
    const { focusTaskLocalDate } = await import('./focusPlan');
    expect(focusTaskLocalDate('2026-10-31')).toBe('2026-10-31');
    expect(focusTaskLocalDate('2026-02-30')).toBeNull();
    expect(focusTaskLocalDate(null)).toBeNull();
  });
  it('removes duplicated subject and duration only from DISPLAY title', async () => {
    const { focusTaskDisplayTitle } = await import('./focusPlan');
    const original = 'ریاضی: ریاضی: حل تمرین · 45 min';
    expect(focusTaskDisplayTitle(original, 'ریاضی', 45)).toBe('حل تمرین');
    expect(original).toBe('ریاضی: ریاضی: حل تمرین · 45 min');
    expect(focusTaskDisplayTitle('زیست، شیمی: مرور', 'زیست', 45)).toBe('زیست، شیمی: مرور');
    expect(focusTaskDisplayTitle('ریاضی: حل 20 تست', 'ریاضی', 25)).toBe('حل 20 تست');
  });
  it('searches both Persian/Arabic character variants and subject names', async () => {
    const { focusTaskSearchMatch } = await import('./focusPlan');
    expect(focusTaskSearchMatch(task('x',{title:'مرور کتاب'}), 'رياضي', 'ریاضی مرور')).toBe(true);
    expect(focusTaskSearchMatch(task('x',{title:'مرور زیست'}), 'زیست', 'فیزیک')).toBe(false);
  });
  it('does not leak other accounts or closed tasks to picker', () => {
    const items = [task('safe'),task('other',{userId:'other-user'}),task('done',{status:'completed'})];
    expect(selectablePlannerTasks(items,'user-a').map(item=>item.id)).toEqual(['safe']);
  });
});

import type { Table } from 'dexie';
import { db } from './db';
import { cloudEnabled, supabase } from './supabase';
import type { BaseRecord } from '../types';

const snake = (key: string) => key.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`);
const camel = (key: string) => key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
function toCloud(row: Record<string, unknown>) { return Object.fromEntries(Object.entries(row).filter(([k]) => k !== 'syncStatus').map(([k,v]) => [snake(k),v])); }
function fromCloud(row: Record<string, unknown>) { return Object.fromEntries(Object.entries(row).map(([k,v]) => [camel(k),v])); }

async function syncTable<T extends BaseRecord>(cloudName: string, table: Table<T, string>, userId: string) {
  if (!supabase) return { ok: false as const, count: 0, error: 'cloud-disabled' };
  let count = 0;
  const dirty = await table.where('userId').equals(userId).filter(r => r.syncStatus !== 'synced').toArray();
  for (const row of dirty) {
    const { error } = await supabase.from(cloudName).upsert(toCloud(row as unknown as Record<string, unknown>), { onConflict: 'id' });
    if (error) { await table.update(row.id, { syncStatus: 'failed' } as Partial<T>); return { ok:false as const,count,error:error.message }; }
    await table.update(row.id, { syncStatus: 'synced' } as Partial<T>); count++;
  }
  const { data, error } = await supabase.from(cloudName).select('*').eq('user_id', userId);
  if (error) return { ok:false as const,count,error:error.message };
  for (const raw of data ?? []) {
    const incoming = { ...fromCloud(raw as Record<string, unknown>), syncStatus:'synced' } as unknown as T;
    const local = await table.get(incoming.id);
    if (!local || new Date(incoming.updatedAt).getTime() > new Date(local.updatedAt).getTime()) { await table.put(incoming); count++; }
  }
  return { ok:true as const,count };
}

export async function syncPending(userId: string): Promise<{ ok: boolean; count: number; error?: string }> {
  if (!cloudEnabled || !supabase || !navigator.onLine) return { ok:false,count:0,error:'offline-or-cloud-disabled' };
  let count = 0;
  const jobs = [
    () => syncTable('subjects', db.subjects, userId),
    () => syncTable('topics', db.topics, userId),
    () => syncTable('tasks', db.tasks, userId),
    () => syncTable('study_sessions', db.sessions, userId),
    () => syncTable('goals', db.goals, userId),
    () => syncTable('exams', db.exams, userId)
  ];
  for (const job of jobs) { const r = await job(); count += r.count; if (!r.ok) return { ok:false,count,error:r.error }; }

  const localSettings = await db.settings.get(userId);
  if (localSettings) {
    const payload = { user_id:userId, language:localSettings.language, calendar_type:localSettings.calendarType, number_format:localSettings.numberFormat,
      week_start:localSettings.weekStart, theme_id:localSettings.themeId, default_timer:localSettings.defaultTimer, pomodoro_focus:localSettings.pomodoroFocus,
      pomodoro_short_break:localSettings.pomodoroShortBreak, pomodoro_long_break:localSettings.pomodoroLongBreak, notifications:localSettings.notifications,
      haptics:localSettings.haptics, sounds:localSettings.sounds, reduce_motion:localSettings.reduceMotion, updated_at:localSettings.updatedAt };
    const { error } = await supabase.from('user_settings').upsert(payload, { onConflict:'user_id' });
    if (error) return { ok:false,count,error:error.message };
  }
  return { ok:true,count };
}

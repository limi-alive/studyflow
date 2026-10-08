import type { Table } from 'dexie';
import { db } from './db';
import { cloudEnabled, supabase } from './supabase';
import { syncAccountPreferences } from './accountPreferences';
import type { BaseRecord, UserSettings } from '../types';
import { localIsNewer, remoteShouldReplaceLocal, updatedAtMs } from '../utils/syncConflict';

const snake = (key: string) => key.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`);
const camel = (key: string) => key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
function toCloud(row: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(row).filter(([k]) => k !== 'syncStatus').map(([k, v]) => [snake(k), v]));
}
function fromCloud(row: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(row).map(([k, v]) => [camel(k), v]));
}
async function authenticatedFor(userId: string) {
  if (!supabase) return false;
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id === userId;
}

async function syncTable<T extends BaseRecord>(cloudName: string, table: Table<T, string>, userId: string) {
  if (!supabase) return { ok: false as const, count: 0, error: 'cloud-disabled' };
  let count = 0;

  // Pull first. This prevents a stale phone from overwriting a newer cloud row.
  const { data, error } = await supabase.from(cloudName).select('*').eq('user_id', userId);
  if (error) return { ok: false as const, count, error: error.message };

  const remoteById = new Map<string, T>();
  for (const raw of data ?? []) {
    const incoming = { ...fromCloud(raw as Record<string, unknown>), syncStatus: 'synced' } as unknown as T;
    remoteById.set(incoming.id, incoming);
    const local = await table.get(incoming.id);
    if (!local) {
      await table.put(incoming);
      count++;
      continue;
    }
    if (remoteShouldReplaceLocal(local.updatedAt, incoming.updatedAt, local.syncStatus)) {
      await table.put(incoming);
      count++;
    }
  }

  // Push only rows that are still locally newer/pending after the pull.
  const dirty = await table.where('userId').equals(userId).filter(row => row.syncStatus !== 'synced').toArray();
  for (const row of dirty) {
    const remote = remoteById.get(row.id);
    if (remote && updatedAtMs(remote.updatedAt) > updatedAtMs(row.updatedAt)) {
      await table.put({ ...remote, syncStatus: 'synced' });
      count++;
      continue;
    }
    const { error: upsertError } = await supabase
      .from(cloudName)
      .upsert(toCloud(row as unknown as Record<string, unknown>), { onConflict: 'id' });
    if (upsertError) {
      row.syncStatus = 'failed';
      await table.put(row);
      return { ok: false as const, count, error: upsertError.message };
    }
    row.syncStatus = 'synced';
    await table.put(row);
    count++;
  }

  return { ok: true as const, count };
}

function cloudSettings(row: UserSettings) {
  return {
    user_id: row.userId,
    language: row.language,
    calendar_type: row.calendarType,
    number_format: row.numberFormat,
    week_start: row.weekStart,
    theme_id: row.themeId,
    default_timer: row.defaultTimer,
    pomodoro_focus: row.pomodoroFocus,
    pomodoro_short_break: row.pomodoroShortBreak,
    pomodoro_long_break: row.pomodoroLongBreak,
    notifications: row.notifications,
    haptics: row.haptics,
    sounds: row.sounds,
    reduce_motion: row.reduceMotion,
    updated_at: row.updatedAt
  };
}

function localSettings(raw: Record<string, unknown>): UserSettings {
  const row = fromCloud(raw) as unknown as UserSettings;
  return { ...row, syncStatus: 'synced' };
}

async function syncSettings(userId: string) {
  if (!supabase) return { ok: false as const, count: 0, error: 'cloud-disabled' };
  let count = 0;
  const local = await db.settings.get(userId);
  const { data, error } = await supabase.from('user_settings').select('*').eq('user_id', userId).maybeSingle();
  if (error) return { ok: false as const, count, error: error.message };

  if (data && !local) {
    await db.settings.put(localSettings(data as Record<string, unknown>));
    return { ok: true as const, count: 1 };
  }
  if (!data && local) {
    const { error: upsertError } = await supabase.from('user_settings').upsert(cloudSettings(local), { onConflict: 'user_id' });
    if (upsertError) return { ok: false as const, count, error: upsertError.message };
    await db.settings.update(userId, { syncStatus: 'synced' });
    return { ok: true as const, count: 1 };
  }
  if (!data || !local) return { ok: true as const, count };

  const remote = localSettings(data as Record<string, unknown>);
  const localDirty = local.syncStatus === 'pending' || local.syncStatus === 'failed';
  if (localDirty && localIsNewer(local.updatedAt, remote.updatedAt)) {
    const { error: upsertError } = await supabase.from('user_settings').upsert(cloudSettings(local), { onConflict: 'user_id' });
    if (upsertError) return { ok: false as const, count, error: upsertError.message };
    await db.settings.update(userId, { syncStatus: 'synced' });
    count++;
  } else if (updatedAtMs(remote.updatedAt) >= updatedAtMs(local.updatedAt) || !localDirty) {
    await db.settings.put(remote);
    count++;
  }
  return { ok: true as const, count };
}


export function requestSync(userId: string) {
  window.dispatchEvent(new CustomEvent('studyflow:sync-needed', { detail: { userId } }));
}

export async function syncPending(userId: string): Promise<{ ok: boolean; count: number; error?: string }> {
  if (!cloudEnabled || !supabase || !navigator.onLine) return { ok: false, count: 0, error: 'offline-or-cloud-disabled' };
  if (!(await authenticatedFor(userId))) return { ok: false, count: 0, error: 'auth-mismatch' };

  let count = 0;
  const jobs = [
    () => syncTable('subjects', db.subjects, userId),
    () => syncTable('topics', db.topics, userId),
    () => syncTable('tasks', db.tasks, userId),
    () => syncTable('study_sessions', db.sessions, userId),
    () => syncTable('goals', db.goals, userId),
    () => syncTable('exams', db.exams, userId),
    () => syncSettings(userId)
  ];
  for (const job of jobs) {
    const result = await job();
    count += result.count;
    if (!result.ok) return { ok: false, count, error: result.error };
  }
  return { ok: true, count };
}

export async function syncAll(userId: string): Promise<{ ok: boolean; count: number; error?: string }> {
  const dataResult = await syncPending(userId);
  if (!dataResult.ok) return dataResult;
  const preferenceResult = await syncAccountPreferences(userId);
  if (!preferenceResult.ok && preferenceResult.error !== 'offline-or-cloud-disabled') {
    return { ok: false, count: dataResult.count, error: preferenceResult.error };
  }
  return { ok: true, count: dataResult.count + (preferenceResult.changed ? 1 : 0) };
}

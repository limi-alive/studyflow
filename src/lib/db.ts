import Dexie, { type Table } from 'dexie';
import type { BaseRecord, Exam, Goal, StudySession, StudyTask, Subject, Topic, UserSettings } from '../types';

export const LOCAL_USER_KEY = 'studyflow.localUserId';
export const DEVICE_ID_KEY = 'studyflow.deviceId';

export function getLocalUserId() {
  let id = localStorage.getItem(LOCAL_USER_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(LOCAL_USER_KEY, id);
  }
  return id;
}

export function separateOfflineIdentityFromCloudUser(cloudUserId: string) {
  const current = localStorage.getItem(LOCAL_USER_KEY);
  if (!current || current === cloudUserId) {
    const next = crypto.randomUUID();
    localStorage.setItem(LOCAL_USER_KEY, next);
    return next;
  }
  return current;
}

export function getDeviceId() {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

class StudyFlowDB extends Dexie {
  subjects!: Table<Subject, string>;
  topics!: Table<Topic, string>;
  tasks!: Table<StudyTask, string>;
  sessions!: Table<StudySession, string>;
  goals!: Table<Goal, string>;
  exams!: Table<Exam, string>;
  settings!: Table<UserSettings, string>;

  constructor() {
    super('studyflow');
    this.version(1).stores({
      subjects: 'id,userId,name,updatedAt,syncStatus,archived',
      topics: 'id,userId,subjectId,parentId,updatedAt,syncStatus',
      tasks: 'id,userId,subjectId,topicId,status,deadline,updatedAt,syncStatus',
      sessions: 'id,userId,subjectId,taskId,startTime,endTime,updatedAt,syncStatus',
      goals: 'id,userId,type,subjectId,updatedAt,syncStatus',
      exams: 'id,userId,subjectId,date,updatedAt,syncStatus',
      settings: 'userId,updatedAt'
    });
  }
}

export const db = new StudyFlowDB();
export function nowIso() { return new Date().toISOString(); }

export async function ensureSettings(userId: string) {
  const existing = await db.settings.get(userId);
  if (existing) return existing;
  const settings: UserSettings = {
    userId, language: 'en', calendarType: 'gregorian', numberFormat: 'latin', weekStart: 'monday', themeId: 'studio',
    defaultTimer: 'stopwatch', pomodoroFocus: 25, pomodoroShortBreak: 5, pomodoroLongBreak: 15,
    notifications: true, haptics: true, sounds: false, reduceMotion: false, updatedAt: nowIso(), syncStatus: 'pending'
  };
  await db.settings.put(settings);
  return settings;
}

async function reassignTable<T extends BaseRecord>(table: Table<T, string>, oldUserId: string, newUserId: string) {
  const rows = await table.where('userId').equals(oldUserId).toArray();
  for (const row of rows) {
    row.userId = newUserId;
    row.updatedAt = nowIso();
    row.syncStatus = 'pending';
    await table.put(row);
  }
}

export async function migrateOfflineDataToUser(oldUserId: string, newUserId: string) {
  if (oldUserId === newUserId) return;
  await db.transaction('rw', [db.subjects, db.topics, db.tasks, db.sessions, db.goals, db.exams, db.settings], async () => {
    await reassignTable(db.subjects, oldUserId, newUserId);
    await reassignTable(db.topics, oldUserId, newUserId);
    await reassignTable(db.tasks, oldUserId, newUserId);
    await reassignTable(db.sessions, oldUserId, newUserId);
    await reassignTable(db.goals, oldUserId, newUserId);
    await reassignTable(db.exams, oldUserId, newUserId);
    const oldSettings = await db.settings.get(oldUserId);
    const targetSettings = await db.settings.get(newUserId);
    if (oldSettings) {
      // Never let a fresh device's offline defaults overwrite an existing
      // cloud account. Existing account settings are pulled before migration.
      if (!targetSettings) await db.settings.put({ ...oldSettings, userId: newUserId, updatedAt: nowIso(), syncStatus: 'pending' });
      await db.settings.delete(oldUserId);
    }
  });
}

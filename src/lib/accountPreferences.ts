import { cloudEnabled, supabase } from './supabase';

export type AccountPreferencesSnapshot = {
  companion?: string;
  companionMotion?: string;
  focusSystem?: Record<string, unknown>;
  focusProgress?: Record<string, unknown>;
  rewardLedger?: Record<string, number>;
  studyPurpose?: string;
  onboarded?: boolean;
};

const DIRTY_PREFIX = 'studyflow.accountPrefsDirty.';
const UPDATED_PREFIX = 'studyflow.accountPrefsUpdatedAt.';

const companionKey = (userId: string) => `studyflow.companion.${userId}`;
const motionKey = (userId: string) => `studyflow.companionMotion.${userId}`;
const focusSystemKey = (userId: string) => `studyflow.focusSystem.${userId}`;
const focusProgressKey = (userId: string) => `studyflow.focusProgress.${userId}`;
const rewardLedgerKey = (userId: string) => `studyflow.rewardLedger.${userId}`;
const onboardedKey = (userId: string) => `studyflow.onboarded.${userId}`;
const purposeKey = (userId: string) => `studyflow.studyPurpose.${userId}`;

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try { return JSON.parse(value) as T; }
  catch { return fallback; }
}

export function accountOnboardedKey(userId: string) { return onboardedKey(userId); }
export function accountPurposeKey(userId: string) { return purposeKey(userId); }

export function readAccountPreferences(userId: string): AccountPreferencesSnapshot {
  return {
    companion: localStorage.getItem(companionKey(userId)) ?? undefined,
    companionMotion: localStorage.getItem(motionKey(userId)) ?? undefined,
    focusSystem: parseJson<Record<string, unknown> | undefined>(localStorage.getItem(focusSystemKey(userId)), undefined),
    focusProgress: parseJson<Record<string, unknown> | undefined>(localStorage.getItem(focusProgressKey(userId)), undefined),
    rewardLedger: parseJson<Record<string, number> | undefined>(localStorage.getItem(rewardLedgerKey(userId)), undefined),
    studyPurpose: localStorage.getItem(purposeKey(userId)) ?? undefined,
    onboarded: localStorage.getItem(onboardedKey(userId)) === '1' ? true : undefined
  };
}

function setOrRemove(key: string, value: unknown) {
  if (value === undefined || value === null) { localStorage.removeItem(key); return; }
  localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
}

export function applyAccountPreferences(userId: string, payload: AccountPreferencesSnapshot) {
  setOrRemove(companionKey(userId), payload.companion);
  setOrRemove(motionKey(userId), payload.companionMotion);
  setOrRemove(focusSystemKey(userId), payload.focusSystem);
  setOrRemove(focusProgressKey(userId), payload.focusProgress);
  setOrRemove(rewardLedgerKey(userId), payload.rewardLedger);
  setOrRemove(purposeKey(userId), payload.studyPurpose);
  if (payload.onboarded) localStorage.setItem(onboardedKey(userId), '1');
  else localStorage.removeItem(onboardedKey(userId));
  window.dispatchEvent(new CustomEvent('studyflow:account-preferences-applied', { detail: { userId } }));
  window.dispatchEvent(new CustomEvent('studyflow-focus-progress', { detail: { userId } }));
}

export function markAccountPreferencesDirty(userId: string) {
  const now = new Date().toISOString();
  localStorage.setItem(`${DIRTY_PREFIX}${userId}`, '1');
  localStorage.setItem(`${UPDATED_PREFIX}${userId}`, now);
  window.dispatchEvent(new CustomEvent('studyflow:sync-needed', { detail: { userId } }));
}

export function setAccountOnboarded(userId: string, purpose?: string) {
  localStorage.setItem(onboardedKey(userId), '1');
  if (purpose !== undefined) localStorage.setItem(purposeKey(userId), purpose);
  markAccountPreferencesDirty(userId);
}

export function isAccountOnboarded(userId: string) {
  return localStorage.getItem(onboardedKey(userId)) === '1';
}

export function migrateAccountPreferences(oldUserId: string, newUserId: string) {
  if (!oldUserId || oldUserId === newUserId) return;
  const mappings = [
    [companionKey(oldUserId), companionKey(newUserId)],
    [motionKey(oldUserId), motionKey(newUserId)],
    [focusSystemKey(oldUserId), focusSystemKey(newUserId)],
    [focusProgressKey(oldUserId), focusProgressKey(newUserId)],
    [rewardLedgerKey(oldUserId), rewardLedgerKey(newUserId)],
    [purposeKey(oldUserId), purposeKey(newUserId)],
    [onboardedKey(oldUserId), onboardedKey(newUserId)]
  ] as const;
  let changed = false;
  for (const [from, to] of mappings) {
    const value = localStorage.getItem(from);
    if (value !== null) {
      if (localStorage.getItem(to) === null) localStorage.setItem(to, value);
      localStorage.removeItem(from);
      changed = true;
    }
  }
  if (changed) markAccountPreferencesDirty(newUserId);
}

function hasMeaningfulPreferences(payload: AccountPreferencesSnapshot) {
  return Object.values(payload).some(value => value !== undefined && value !== null);
}

export async function syncAccountPreferences(userId: string): Promise<{ ok: boolean; changed: boolean; error?: string }> {
  if (!cloudEnabled || !supabase || !navigator.onLine) return { ok: false, changed: false, error: 'offline-or-cloud-disabled' };

  const localPayload = readAccountPreferences(userId);
  const dirty = localStorage.getItem(`${DIRTY_PREFIX}${userId}`) === '1';
  const localUpdatedAt = localStorage.getItem(`${UPDATED_PREFIX}${userId}`) ?? '1970-01-01T00:00:00.000Z';

  const { data, error } = await supabase
    .from('user_preferences')
    .select('payload,updated_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    if (error.code === '42P01' || error.message.toLowerCase().includes('user_preferences')) return { ok: true, changed: false };
    return { ok: false, changed: false, error: error.message };
  }

  if (!data) {
    if (!hasMeaningfulPreferences(localPayload)) return { ok: true, changed: false };
    const updatedAt = new Date().toISOString();
    const { error: upsertError } = await supabase.from('user_preferences').upsert({
      user_id: userId,
      payload: localPayload,
      updated_at: updatedAt
    }, { onConflict: 'user_id' });
    if (upsertError) return { ok: false, changed: false, error: upsertError.message };
    localStorage.removeItem(`${DIRTY_PREFIX}${userId}`);
    localStorage.setItem(`${UPDATED_PREFIX}${userId}`, updatedAt);
    return { ok: true, changed: true };
  }

  const remoteUpdatedAt = String(data.updated_at ?? '1970-01-01T00:00:00.000Z');
  if (dirty && new Date(localUpdatedAt).getTime() > new Date(remoteUpdatedAt).getTime()) {
    const { error: upsertError } = await supabase.from('user_preferences').upsert({
      user_id: userId,
      payload: localPayload,
      updated_at: localUpdatedAt
    }, { onConflict: 'user_id' });
    if (upsertError) return { ok: false, changed: false, error: upsertError.message };
    localStorage.removeItem(`${DIRTY_PREFIX}${userId}`);
    return { ok: true, changed: true };
  }

  applyAccountPreferences(userId, (data.payload ?? {}) as AccountPreferencesSnapshot);
  localStorage.removeItem(`${DIRTY_PREFIX}${userId}`);
  localStorage.setItem(`${UPDATED_PREFIX}${userId}`, remoteUpdatedAt);
  return { ok: true, changed: true };
}

import type { SyncStatus } from '../types';

export function updatedAtMs(value?: string | null) {
  const parsed = value ? new Date(value).getTime() : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

export function remoteShouldReplaceLocal(localUpdatedAt: string, remoteUpdatedAt: string, localStatus: SyncStatus | undefined) {
  const local = updatedAtMs(localUpdatedAt);
  const remote = updatedAtMs(remoteUpdatedAt);
  return remote > local || (remote === local && localStatus !== 'pending');
}

export function localIsNewer(localUpdatedAt: string, remoteUpdatedAt: string) {
  return updatedAtMs(localUpdatedAt) > updatedAtMs(remoteUpdatedAt);
}

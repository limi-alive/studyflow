import type { SyncStatus } from '../types';

export function sameSessionContent(a: Record<string, unknown>, b: Record<string, unknown>) {
  const sameTime = (left: unknown, right: unknown) => {
    if (left == null || right == null) return left == null && right == null;
    const x = Date.parse(String(left)), y = Date.parse(String(right));
    return Number.isFinite(x) && x === y;
  };
  if (a.userId !== b.userId || a.studySeconds !== b.studySeconds ||
      !sameTime(a.startTime,b.startTime) || !sameTime(a.endTime,b.endTime) || !sameTime(a.deletedAt,b.deletedAt)) return false;
  if (a.activeSegments == null || b.activeSegments == null) return a.activeSegments == null && b.activeSegments == null;
  if (!Array.isArray(a.activeSegments) || !Array.isArray(b.activeSegments) || a.activeSegments.length !== b.activeSegments.length) return false;
  return a.activeSegments.every((segment,index) => {
    const other = b.activeSegments as Array<{start?:string;end?:string}>;
    const current = segment as {start?:string;end?:string};
    return sameTime(current.start,other[index]?.start) && sameTime(current.end,other[index]?.end);
  });
}

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

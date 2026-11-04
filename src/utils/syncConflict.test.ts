import { describe, expect, it } from 'vitest';
import { localIsNewer, remoteShouldReplaceLocal, sameSessionContent } from './syncConflict';

describe('cross-device conflict resolution', () => {
  it('protects a newer cloud row from a stale pending phone', () => {
    expect(remoteShouldReplaceLocal('2026-10-05T08:00:00Z','2026-10-05T08:05:00Z','pending')).toBe(true);
  });
  it('recognizes one saved session despite PostgreSQL timezone serialization and rejects divergent data', () => {
    const local={userId:'u',studySeconds:7200,startTime:'2026-11-01T10:00:00.000Z',endTime:'2026-11-01T12:00:00.000Z',activeSegments:[{start:'2026-11-01T10:00:00.000Z',end:'2026-11-01T12:00:00.000Z'}]};
    const cloud={...local,startTime:'2026-11-01T10:00:00+00:00',endTime:'2026-11-01T15:30:00+03:30',activeSegments:[{start:'2026-11-01T13:30:00+03:30',end:'2026-11-01T15:30:00+03:30'}]};
    expect(sameSessionContent(local,cloud)).toBe(true);
    expect(sameSessionContent(local,{...cloud,studySeconds:86400})).toBe(false);
    expect(sameSessionContent(local,{...cloud,userId:'other'})).toBe(false);
  });
  it('keeps a newer local edit so it can upload', () => {
    expect(localIsNewer('2026-10-05T08:10:00Z','2026-10-05T08:05:00Z')).toBe(true);
    expect(remoteShouldReplaceLocal('2026-10-05T08:10:00Z','2026-10-05T08:05:00Z','pending')).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import { localIsNewer, remoteShouldReplaceLocal } from './syncConflict';

describe('cross-device conflict resolution', () => {
  it('protects a newer cloud row from a stale pending phone', () => {
    expect(remoteShouldReplaceLocal('2026-10-05T08:00:00Z','2026-10-05T08:05:00Z','pending')).toBe(true);
  });
  it('keeps a newer local edit so it can upload', () => {
    expect(localIsNewer('2026-10-05T08:10:00Z','2026-10-05T08:05:00Z')).toBe(true);
    expect(remoteShouldReplaceLocal('2026-10-05T08:10:00Z','2026-10-05T08:05:00Z','pending')).toBe(false);
  });
});

/** Monthly public leaderboard uses a single UTC calendar for every account.
 *  Boundaries are start-inclusive, end-exclusive. No study history is deleted.
 */
export function utcMonthBoundsAt(time: number | Date) {
  const date = new Date(time);
  if (!Number.isFinite(date.getTime())) throw new RangeError('Invalid leaderboard date');
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const startMs = Date.UTC(year, month, 1);
  const endMs = Date.UTC(year, month + 1, 1);
  return {
    start: new Date(startMs).toISOString(),
    end: new Date(endMs).toISOString(),
    monthKey: `${year}-${String(month + 1).padStart(2, '0')}`,
    nextResetAt: new Date(endMs).toISOString(),
    remainingMs: Math.max(0, endMs - date.getTime())
  };
}

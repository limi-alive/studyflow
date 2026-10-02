export function formatDuration(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}` : `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}

export function timerElapsedSeconds(startedAt: string, totalPausedMs: number, pausedAt?: string | null, now = Date.now()) {
  const start = new Date(startedAt).getTime();
  const currentPause = pausedAt ? Math.max(0, now - new Date(pausedAt).getTime()) : 0;
  return Math.max(0, Math.floor((now - start - totalPausedMs - currentPause) / 1000));
}

export function startOfLocalDay(d = new Date()) {
  const x = new Date(d); x.setHours(0,0,0,0); return x;
}

export function endOfLocalDay(d = new Date()) {
  const x = new Date(d); x.setHours(23,59,59,999); return x;
}

export function splitSessionByLocalDay(startIso: string, endIso: string) {
  const result: { date: string; seconds: number }[] = [];
  let cursor = new Date(startIso);
  const end = new Date(endIso);
  while (cursor < end) {
    const nextDay = new Date(cursor); nextDay.setHours(24,0,0,0);
    const segmentEnd = nextDay < end ? nextDay : end;
    result.push({ date: cursor.toLocaleDateString('en-CA'), seconds: Math.max(0, Math.round((segmentEnd.getTime() - cursor.getTime()) / 1000)) });
    cursor = segmentEnd;
  }
  return result;
}

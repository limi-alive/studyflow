import { useEffect, useState } from 'react';

/**
 * Refreshes time-dependent monthly components near the rollover. Timers may be
 * suspended on iOS; resume/focus/visibility events immediately catch up.
 * This is display logic, not a study-session counter.
 */
export function useTimePulse() {
  const [timeMs, setTimeMs] = useState(() => Date.now());
  useEffect(() => {
    let timer: number | null = null;
    let alive = true;
    const tick = () => { if (alive) setTimeMs(Date.now()); };
    const schedule = () => {
      if (!alive) return;
      const now = new Date();
      const nextMonthMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1);
      const remaining = Math.max(0, nextMonthMs - now.getTime());
      // A short check aligns with the exact monthly UTC boundary without
      // risking the browser's 32-bit timeout cap for next month's date.
      const delay = remaining <= 30_000 ? remaining + 15 : 30_000;
      timer = window.setTimeout(() => {
        tick();
        schedule();
      }, Math.max(100, delay));
    };
    const resume = () => tick();
    const visibility = () => { if (document.visibilityState === 'visible') tick(); };
    schedule();
    window.addEventListener('focus', resume);
    window.addEventListener('pageshow', resume);
    window.addEventListener('online', resume);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      alive = false;
      if (timer !== null) window.clearTimeout(timer);
      window.removeEventListener('focus', resume);
      window.removeEventListener('pageshow', resume);
      window.removeEventListener('online', resume);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, []);
  return timeMs;
}

import { useEffect, useMemo, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Pause, Play, RotateCcw, Square } from 'lucide-react';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useSettings } from '../hooks/useSettings';
import { db, getDeviceId, nowIso } from '../lib/db';
import { useTimerStore } from '../stores/timerStore';
import type { TimerType } from '../types';
import { formatDuration, timerElapsedSeconds } from '../utils/time';
import { FocusBuddy } from '../components/FocusBuddy';

export default function TimerPage() {
  const { userId } = useCurrentUser();
  const settings = useSettings(userId);
  const notified = useRef<string | null>(null);
  const subjectRows = useLiveQuery(() => db.subjects.where('userId').equals(userId).filter(x=>!x.archived&&!x.deletedAt).toArray(), [userId]);
  const subjects = useMemo(() => subjectRows ?? [], [subjectRows]);
  const { active, start, pause, resume, addTime, restart, clear } = useTimerStore();
  const [tick, setTick] = useState(Date.now());
  const [mode, setMode] = useState<TimerType>('stopwatch');
  const [subjectId, setSubjectId] = useState<string>('');
  const [duration, setDuration] = useState(25);
  const [startBurst, setStartBurst] = useState(false);

  useEffect(() => { const id = window.setInterval(()=>setTick(Date.now()), 500); return ()=>clearInterval(id); }, []);
  useEffect(() => { if (mode === 'pomodoro' && settings) setDuration(settings.pomodoroFocus); }, [mode, settings]);
  const elapsed = active ? timerElapsedSeconds(active.startedAt, active.totalPausedMs, active.pausedAt, tick) : 0;
  const display = active?.durationSeconds ? Math.max(0, active.durationSeconds - elapsed) : elapsed;
  useEffect(() => {
    if (!active?.durationSeconds || elapsed < active.durationSeconds || notified.current === active.id) return;
    notified.current = active.id;
    if (settings?.haptics && 'vibrate' in navigator) navigator.vibrate([100,80,100]);
    if (settings?.notifications && 'Notification' in window && Notification.permission === 'granted') new Notification('StudyFlow', { body: 'Focus session complete.' });
  }, [active, elapsed, settings]);
  const selected = useMemo(()=>subjects.find(s=>s.id===(active?.subjectId ?? subjectId)),[subjects,active,subjectId]);

  const begin = () => {
    if (settings?.haptics && 'vibrate' in navigator) navigator.vibrate([30, 40, 30]);
    setStartBurst(true);
    window.setTimeout(() => setStartBurst(false), 1250);
    start({ userId, subjectId: subjectId || null, timerType: mode, durationSeconds: mode==='stopwatch'||mode==='deep-focus' ? null : duration*60 });
  };
  const finish = async () => {
    if (!active) return;
    const end = nowIso();
    const rawSeconds = timerElapsedSeconds(active.startedAt, active.totalPausedMs, active.pausedAt);
    const seconds = active.durationSeconds ? Math.min(rawSeconds, active.durationSeconds) : rawSeconds;
    const currentPauseMs = active.pausedAt ? Math.max(0, Date.now() - new Date(active.pausedAt).getTime()) : 0;
    if (seconds > 0) await db.sessions.put({
      id: active.id, userId: active.userId, subjectId: active.subjectId, topicId: active.topicId, taskId: active.taskId,
      startTime: active.startedAt, endTime: end, studySeconds: seconds, breakSeconds: 0, pauseSeconds: Math.round((active.totalPausedMs + currentPauseMs)/1000),
      timerType: active.timerType, deviceId: getDeviceId(), createdAt: active.startedAt, updatedAt: end, syncStatus: 'pending'
    });
    clear();
  };

  const completed = Boolean(active?.durationSeconds && elapsed >= active.durationSeconds);
  const buddyState = completed ? 'celebrate' : active?.state === 'running' ? 'running' : active?.state === 'paused' ? 'paused' : 'idle';

  return <div className={`page timer-stage ${active ? 'timer-active' : ''} ${startBurst ? 'timer-start-burst' : ''}`}>
    <div className="eyebrow">{active ? selected?.name ?? 'Focus session' : 'Choose a mode'}</div>
    <FocusBuddy state={buddyState} intro={startBurst} subject={selected?.name}/>
    {!active && <>
      <div className="pill-row">{(['stopwatch','countdown','pomodoro','deep-focus'] as TimerType[]).map(m=><button key={m} className={`pill ${mode===m?'active':''}`} onClick={()=>setMode(m)}>{m.replace('-',' ')}</button>)}</div>
      <div className="form-grid" style={{width:'min(620px,100%)'}}>
        <select className="input" value={subjectId} onChange={e=>setSubjectId(e.target.value)}><option value="">No subject</option>{subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select>
        {(mode==='countdown'||mode==='pomodoro') && <input className="input" type="number" min="1" max="240" value={duration} onChange={e=>setDuration(Number(e.target.value)||25)} aria-label="Minutes"/>}
      </div>
    </>}
    <div className="timer-display">{formatDuration(display)}</div>
    {active?.durationSeconds && <div className="progress" style={{width:'min(560px,90vw)'}}><div style={{width:`${Math.min(100, elapsed/active.durationSeconds*100)}%`}}/></div>}
    <div className="timer-actions">
      {!active && <button className="button primary" onClick={begin}><Play/> Start</button>}
      {active?.state==='running' && <button className="button" onClick={pause}><Pause/> Pause</button>}
      {active?.state==='paused' && <button className="button primary" onClick={resume}><Play/> Resume</button>}
      {active && <button className="button" onClick={finish}><Square/> Finish</button>}
      {active?.durationSeconds && <button className="button ghost" onClick={()=>addTime(300)}>+5 min</button>}
      {active && <button className="button ghost" onClick={restart}><RotateCcw/> Restart</button>}
      {active && <button className="button ghost" onClick={clear}>Discard</button>}
    </div>
    {active && <div className="subtle">Session state is stored locally and survives refresh or app restart.</div>}
  </div>;
}

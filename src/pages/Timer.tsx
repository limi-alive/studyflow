import { useEffect, useMemo, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Brain, Hourglass, Pause, Play, RotateCcw, Sparkles, Square, TimerReset } from 'lucide-react';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useSettings } from '../hooks/useSettings';
import { db, getDeviceId, nowIso } from '../lib/db';
import { useTimerStore } from '../stores/timerStore';
import type { TimerType } from '../types';
import { formatDuration, timerElapsedSeconds } from '../utils/time';
import { FocusBuddy } from '../components/FocusBuddy';

const modeMeta: Array<{id:TimerType;label:string;hint:string;icon:typeof TimerReset}> = [
  {id:'stopwatch',label:'Stopwatch',hint:'Open-ended focus',icon:TimerReset},
  {id:'countdown',label:'Countdown',hint:'Set an exact block',icon:Hourglass},
  {id:'pomodoro',label:'Pomodoro',hint:'Rhythm + breaks',icon:Sparkles},
  {id:'deep-focus',label:'Deep focus',hint:'Minimal distractions',icon:Brain}
];

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
  const activeMode = active?.timerType ?? mode;

  return <div className={`page timer-stage mode-${activeMode} ${active ? 'timer-active' : ''} ${startBurst ? 'timer-start-burst' : ''}`}>
    <div className="timer-backdrop-orb timer-orb-one"/><div className="timer-backdrop-orb timer-orb-two"/>
    <div className="timer-heading"><div className="eyebrow">{active ? selected?.name ?? 'Focus session' : 'Focus studio'}</div><span className={`focus-state ${buddyState}`}>{completed?'Complete':active?.state==='paused'?'Paused':active?'Focusing':'Ready'}</span></div>
    <FocusBuddy state={buddyState} intro={startBurst} subject={selected?.name}/>

    {!active && <div className="timer-setup">
      <div className="mode-picker">{modeMeta.map(({id,label,hint,icon:Icon})=><button key={id} className={`mode-card ${mode===id?'active':''}`} onClick={()=>setMode(id)}><span className="mode-icon"><Icon size={20}/></span><span><strong>{label}</strong><small>{hint}</small></span></button>)}</div>
      <div className="setup-fields">
        <label><span>Subject</span><select className="input" value={subjectId} onChange={e=>setSubjectId(e.target.value)}><option value="">No subject</option>{subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
        {(mode==='countdown'||mode==='pomodoro') && <label><span>Minutes</span><input className="input" type="number" min="1" max="240" value={duration} onChange={e=>setDuration(Number(e.target.value)||25)} aria-label="Minutes"/></label>}
      </div>
    </div>}

    <div className="timer-core">
      <div className="timer-display">{formatDuration(display)}</div>
      {active?.durationSeconds ? <div className="progress timer-progress"><div style={{width:`${Math.min(100, elapsed/active.durationSeconds*100)}%`}}/></div> : <div className="timer-tickline"><span/><span/><span/><span/><span/></div>}
      <div className="timer-actions">
        {!active && <button className="button primary focus-launch" onClick={begin}><Play/> Start focus</button>}
        {active?.state==='running' && <button className="button pause-button" onClick={pause}><Pause/> Pause</button>}
        {active?.state==='paused' && <button className="button primary" onClick={resume}><Play/> Resume</button>}
        {active && <button className="button" onClick={finish}><Square/> Finish</button>}
        {active?.durationSeconds && <button className="button ghost" onClick={()=>addTime(300)}>+5 min</button>}
        {active && <button className="icon-button" onClick={restart} aria-label="Restart"><RotateCcw size={18}/></button>}
        {active && <button className="button ghost quiet-danger" onClick={clear}>Discard</button>}
      </div>
    </div>
    {active && <div className="session-safety"><span className="status-dot"/> Session is saved locally and survives refresh or app restart.</div>}
  </div>;
}

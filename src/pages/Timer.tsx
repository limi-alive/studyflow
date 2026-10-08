import { useEffect, useMemo, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { AlertTriangle, Brain, Coins, Flame, Hourglass, Keyboard, Maximize2, Minimize2, Pause, Play, RotateCcw, Shield, Sparkles, Square, Target, TimerReset } from 'lucide-react';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useSettings } from '../hooks/useSettings';
import { useCompanionPreferences } from '../hooks/useCompanionPreferences';
import { useFocusProgress, type FocusInsight } from '../hooks/useFocusProgress';
import { useFocusSystemPreferences } from '../hooks/useFocusSystemPreferences';
import { db, getDeviceId, nowIso } from '../lib/db';
import { requestSync } from '../lib/sync';
import { useTimerStore } from '../stores/timerStore';
import type { TimerType } from '../types';
import { formatDuration, timerElapsedSeconds } from '../utils/time';
import { FocusCompanion } from '../components/FocusCompanion';
import { SessionSummary } from '../components/SessionSummary';

const modeMeta: Array<{id:TimerType;label:string;hint:string;icon:typeof TimerReset}> = [
  {id:'stopwatch',label:'Stopwatch',hint:'Open-ended focus',icon:TimerReset},
  {id:'countdown',label:'Countdown',hint:'Set an exact block',icon:Hourglass},
  {id:'pomodoro',label:'Pomodoro',hint:'Rhythm + breaks',icon:Sparkles},
  {id:'deep-focus',label:'Deep focus',hint:'Minimal distractions',icon:Brain}
];

const distractionReasons = ['Phone','Messages','Noise','Thought','Social','Other'] as const;

export default function TimerPage() {
  const { userId } = useCurrentUser();
  const settings = useSettings(userId);
  const { companion, motion } = useCompanionPreferences(userId);
  const { preferences } = useFocusSystemPreferences(userId);
  const focusProgress = useFocusProgress(userId);
  const notified = useRef<string | null>(null);
  const subjectRows = useLiveQuery(() => db.subjects.where('userId').equals(userId).filter(x=>!x.archived&&!x.deletedAt).toArray(), [userId]);
  const subjects = useMemo(() => subjectRows ?? [], [subjectRows]);
  const { active, start, pause, resume, addTime, restart, clear } = useTimerStore();
  const [tick, setTick] = useState(Date.now());
  const [mode, setMode] = useState<TimerType>('stopwatch');
  const [subjectId, setSubjectId] = useState<string>('');
  const [duration, setDuration] = useState(25);
  const [intent, setIntent] = useState('');
  const [startBurst, setStartBurst] = useState(false);
  const [distractions, setDistractions] = useState(0);
  const [reasons, setReasons] = useState<string[]>([]);
  const [distractionOpen, setDistractionOpen] = useState(false);
  const [zen, setZen] = useState(false);
  const [lastSummary, setLastSummary] = useState<FocusInsight | null>(null);

  useEffect(() => { const id = window.setInterval(()=>setTick(Date.now()), 500); return ()=>clearInterval(id); }, []);
  useEffect(() => { if (mode === 'pomodoro' && settings) setDuration(settings.pomodoroFocus); }, [mode, settings]);
  useEffect(() => {
    document.body.classList.toggle('focus-zen', Boolean(active && zen));
    return () => document.body.classList.remove('focus-zen');
  }, [active, zen]);

  const elapsed = active ? timerElapsedSeconds(active.startedAt, active.totalPausedMs, active.pausedAt, tick) : 0;
  const display = active?.durationSeconds ? Math.max(0, active.durationSeconds - elapsed) : elapsed;

  useEffect(() => {
    if (!active?.durationSeconds || elapsed < active.durationSeconds || notified.current === active.id) return;
    notified.current = active.id;
    if (settings?.haptics && 'vibrate' in navigator) navigator.vibrate([100,80,100]);
    if (settings?.notifications && 'Notification' in window && Notification.permission === 'granted') new Notification('StudyFlow', { body: 'Focus session complete.' });
  }, [active, elapsed, settings]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (!active || target?.matches('input, textarea, select, [contenteditable="true"]')) return;
      if (event.code === 'Space') {
        event.preventDefault();
        if (active.state === 'running') pause(); else if (active.state === 'paused') resume();
      }
      if (event.key.toLowerCase() === 'z') setZen(value=>!value);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, pause, resume]);

  const selected = useMemo(()=>subjects.find(s=>s.id===(active?.subjectId ?? subjectId)),[subjects,active,subjectId]);

  const begin = () => {
    if (settings?.haptics && 'vibrate' in navigator) navigator.vibrate([30, 40, 30]);
    setStartBurst(true);
    setDistractions(0);
    setReasons([]);
    setDistractionOpen(false);
    setZen(preferences.autoZen);
    window.setTimeout(() => setStartBurst(false), 1250);
    start({ userId, subjectId: subjectId || null, timerType: mode, durationSeconds: mode==='stopwatch'||mode==='deep-focus' ? null : duration*60 });
  };

  const finish = async () => {
    if (!active) return;
    const end = nowIso();
    const rawSeconds = timerElapsedSeconds(active.startedAt, active.totalPausedMs, active.pausedAt);
    const seconds = active.durationSeconds ? Math.min(rawSeconds, active.durationSeconds) : rawSeconds;
    const currentPauseMs = active.pausedAt ? Math.max(0, Date.now() - new Date(active.pausedAt).getTime()) : 0;
    const pauseSeconds = Math.round((active.totalPausedMs + currentPauseMs)/1000);
    const completedTarget = !active.durationSeconds || rawSeconds >= active.durationSeconds;
    if (seconds <= 0) { clear(); setZen(false); return; }

    await db.sessions.put({
      id: active.id, userId: active.userId, subjectId: active.subjectId, topicId: active.topicId, taskId: active.taskId,
      startTime: active.startedAt, endTime: end, studySeconds: seconds, breakSeconds: 0, pauseSeconds,
      timerType: active.timerType, deviceId: getDeviceId(), createdAt: active.startedAt, updatedAt: end, syncStatus: 'pending'
    });

    const insight = focusProgress.recordSession({
      id: active.id,
      endedAt: end,
      studySeconds: seconds,
      pauseSeconds,
      distractions,
      distractionReasons: reasons,
      completedTarget,
      targetSeconds: active.durationSeconds,
      subjectId: active.subjectId,
      timerType: active.timerType,
      intent: intent.trim() || undefined
    });
    requestSync(userId);
    clear();
    setZen(false);
    setDistractionOpen(false);
    if (preferences.showSessionSummary) setLastSummary(insight);
  };

  const discard = () => {
    clear();
    setZen(false);
    setDistractions(0);
    setReasons([]);
    setDistractionOpen(false);
  };

  const restartSession = () => {
    setDistractions(0);
    setReasons([]);
    setDistractionOpen(false);
    restart();
  };

  const logDistraction = (reason: string) => {
    setDistractions(value=>value+1);
    setReasons(items=>[...items, reason]);
    setDistractionOpen(false);
    if (settings?.haptics && 'vibrate' in navigator) navigator.vibrate(20);
  };

  const completed = Boolean(active?.durationSeconds && elapsed >= active.durationSeconds);
  const companionState = completed ? 'celebrate' : active?.state === 'running' ? 'running' : active?.state === 'paused' ? 'paused' : 'idle';
  const activeMode = active?.timerType ?? mode;

  return <div className={`page timer-stage mode-${activeMode} ${active ? 'timer-active' : ''} ${startBurst ? 'timer-start-burst' : ''}`}>
    <div className="timer-backdrop-orb timer-orb-one"/><div className="timer-backdrop-orb timer-orb-two"/>
    <div className="timer-heading"><div className="eyebrow">{active ? selected?.name ?? 'Focus session' : 'Focus studio'}</div><span className={`focus-state ${companionState}`}>{completed?'Complete':active?.state==='paused'?'Paused':active?'Focusing':'Ready'}</span></div>

    {!active && <div className="focus-progress-hud">
      <div><span className="hud-icon"><Target size={15}/></span><span><small>Level</small><strong>{focusProgress.level}</strong></span></div>
      <div className="hud-xp"><span><small>{focusProgress.xp} XP</small><strong>{focusProgress.xpToNextLevel} to next</strong></span><i><b style={{width:`${focusProgress.levelProgress*100}%`}}/></i></div>
      <div><span className="hud-icon streak"><Flame size={15}/></span><span><small>Streak</small><strong>{focusProgress.streak} days</strong></span></div>
      <div><span className="hud-icon coins"><Coins size={15}/></span><span><small>Coins</small><strong>{focusProgress.coins}</strong></span></div>
    </div>}

    <div className="focus-visual">
      <FocusCompanion variant={companion} state={companionState} motion={motion} intro={startBurst} subject={selected?.name} level={focusProgress.level}/>
    </div>

    {!active && <div className="timer-setup">
      <div className="mode-picker">{modeMeta.map(({id,label,hint,icon:Icon})=><button key={id} className={`mode-card ${mode===id?'active':''}`} onClick={()=>setMode(id)}><span className="mode-icon"><Icon size={20}/></span><span><strong>{label}</strong><small>{hint}</small></span></button>)}</div>
      <div className="setup-fields">
        <label><span>Subject</span><select className="input" value={subjectId} onChange={e=>setSubjectId(e.target.value)}><option value="">No subject</option>{subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
        {(mode==='countdown'||mode==='pomodoro') && <label><span>Minutes</span><input className="input" type="number" min="1" max="240" value={duration} onChange={e=>setDuration(Number(e.target.value)||25)} aria-label="Minutes"/></label>}
        {preferences.promptIntent && <label className="session-intent-field"><span>Session intention</span><input className="input" value={intent} maxLength={90} onChange={event=>setIntent(event.target.value)} placeholder="What will make this session a win?"/></label>}
      </div>
    </div>}

    {active && <div className="focus-active-context">
      <div className="focus-intention"><Target size={14}/><span>{intent.trim() || selected?.name || 'Stay with one thing'}</span></div>
      <div className="focus-live-tools">
        <button className={`focus-tool ${zen?'active':''}`} onClick={()=>setZen(value=>!value)} title="Zen mode (Z)">{zen?<Minimize2 size={15}/>:<Maximize2 size={15}/>}<span>Zen</span></button>
        <div className="distraction-wrap"><button className={`focus-tool ${distractions?'warn':''}`} onClick={()=>setDistractionOpen(value=>!value)}><AlertTriangle size={15}/><span>Distracted {distractions ? `· ${distractions}` : ''}</span></button>{distractionOpen&&<div className="distraction-menu"><strong>What pulled you away?</strong><div>{distractionReasons.map(reason=><button key={reason} onClick={()=>logDistraction(reason)}>{reason}</button>)}</div></div>}</div>
        <span className="focus-score-live"><Shield size={14}/> Score {focusProgress.averageScore || '—'}</span>
      </div>
    </div>}

    <div className="timer-core">
      <div className="timer-display" role="timer" aria-live="off" aria-label="Study timer" dir="ltr">{formatDuration(display)}</div>
      {active?.durationSeconds ? <div className="progress timer-progress"><div style={{width:`${Math.min(100, elapsed/active.durationSeconds*100)}%`}}/></div> : <div className="timer-tickline"><span/><span/><span/><span/><span/></div>}
      <div className="timer-actions">
        <div className="timer-main-actions">
        {!active && <button className="button primary focus-launch" onClick={begin}><Play/> Start focus</button>}
        {active?.state==='running' && <button className="button pause-button" onClick={pause}><Pause/> Pause</button>}
        {active?.state==='paused' && <button className="button primary" onClick={resume}><Play/> Resume</button>}
        {active && <button className="button" onClick={()=>void finish()}><Square/> Finish</button>}
        </div>
        {active && <div className="timer-secondary-actions">
        {active?.durationSeconds && <button className="button ghost" onClick={()=>addTime(300)}>+5 min</button>}
        {active && <button className="icon-button" onClick={restartSession} aria-label="Restart"><RotateCcw size={18}/></button>}
        {active && <button className="button ghost quiet-danger" onClick={discard}>Discard</button>}
        </div>}
      </div>
      {active && preferences.showShortcutHints && <div className="focus-shortcuts"><Keyboard size={13}/><span><kbd>Space</kbd> pause / resume</span><span><kbd>Z</kbd> zen mode</span></div>}
    </div>
    {active && <div className="session-safety"><span className="status-dot"/> Session is saved locally and survives refresh or app restart.</div>}

    {lastSummary && <SessionSummary
      insight={lastSummary}
      streak={focusProgress.streak}
      level={focusProgress.level}
      onSaveReflection={(rating,note)=>focusProgress.updateReflection(lastSummary.id,rating,note)}
      onClose={()=>{setLastSummary(null);setIntent('');setDistractions(0);setReasons([]);}}
      onStartAnother={()=>{setLastSummary(null);setIntent('');setDistractions(0);setReasons([]);}}
    />}
  </div>;
}

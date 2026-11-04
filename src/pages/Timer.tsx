import { useUiText, useUiLanguage } from '../lib/uiLanguage';
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
import { checkpointLimit, checkpointPauseAt, completedActiveSegments, creditableTimerSeconds, formatDuration, timerElapsedSeconds } from '../utils/time';
import { focusTaskDefaults, selectablePlannerTasks } from '../utils/focusPlan';
import { FocusCompanion } from '../components/FocusCompanion';
import { SessionSummary } from '../components/SessionSummary';
import { FocusTaskPicker } from '../components/FocusTaskPicker';

const modeMeta: Array<{id:TimerType;label:string;hint:string;icon:typeof TimerReset}> = [
  {id:'stopwatch',label:'Stopwatch',hint:'Open-ended focus',icon:TimerReset},
  {id:'countdown',label:'Countdown',hint:'Set an exact block',icon:Hourglass},
  {id:'pomodoro',label:'Pomodoro',hint:'Rhythm + breaks',icon:Sparkles},
  {id:'deep-focus',label:'Deep focus',hint:'Minimal distractions',icon:Brain}
];

const distractionReasons = ['Phone','Messages','Noise','Thought','Social','Other'] as const;

export default function TimerPage() {
 const uiText=useUiText();
 const fa = useUiLanguage() === 'fa';
  const { userId } = useCurrentUser();
  const settings = useSettings(userId);
  const { companion, motion } = useCompanionPreferences(userId);
  const { preferences } = useFocusSystemPreferences(userId);
  const focusProgress = useFocusProgress(userId);
  const notified = useRef<string | null>(null);
  const subjectRows = useLiveQuery(() => db.subjects.where('userId').equals(userId).filter(x=>!x.archived&&!x.deletedAt).toArray(), [userId]);
  const subjects = useMemo(() => subjectRows ?? [], [subjectRows]);
  const taskRows = useLiveQuery(() => db.tasks.where('userId').equals(userId).toArray(), [userId]);
  const focusTasks = useMemo(() => selectablePlannerTasks(taskRows ?? [], userId), [taskRows, userId]);
  const { active: storedActive, activateUser, start, pause, resume, confirmContinue, enforceCheckpoint, addTime, restart, clear } = useTimerStore();
  const active = storedActive?.userId === userId ? storedActive : null;
  useEffect(() => { activateUser(userId); }, [userId, activateUser]);
  const finishing = useRef(false);
  const checkpointDialog = useRef<HTMLDivElement>(null);
  const [tick, setTick] = useState(Date.now());
  const [mode, setMode] = useState<TimerType>('stopwatch');
  const [subjectId, setSubjectId] = useState<string>('');
  const [taskId, setTaskId] = useState<string>('');
  const [duration, setDuration] = useState(25);
  const [adjustMinutes, setAdjustMinutes] = useState<number | null>(null);
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

  useEffect(() => { if (active?.state === 'running') enforceCheckpoint(); }, [active, tick, enforceCheckpoint]);
  useEffect(() => { if (active?.awaitingConfirmation) checkpointDialog.current?.focus(); }, [active?.awaitingConfirmation]);
  const elapsed = active ? creditableTimerSeconds(active, tick) : 0;
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
  const chosenTask = useMemo(() => focusTasks.find(task => task.id === (active?.taskId ?? taskId)), [focusTasks, active, taskId]);

  const chooseTask = (id: string) => {
    setTaskId(id);
    const task = focusTasks.find(item => item.id === id);
    if (!task) { setIntent(''); return; }
    const defaults = focusTaskDefaults(task);
    setSubjectId(defaults.subjectId);
    setDuration(defaults.duration);
    setMode('countdown');
    setIntent(defaults.intent);
  };

  useEffect(() => { setTaskId(''); setSubjectId(''); setIntent(''); }, [userId]);
  // A task can become completed/deleted on another device while this screen stays open.
  useEffect(() => {
    if (taskId && taskRows && !focusTasks.some(task => task.id === taskId)) setTaskId('');
  }, [taskId, taskRows, focusTasks]);

  const begin = () => {
    if (settings?.haptics && 'vibrate' in navigator) navigator.vibrate([30, 40, 30]);
    setStartBurst(true);
    setDistractions(0);
    setReasons([]);
    setDistractionOpen(false);
    setZen(preferences.autoZen);
    window.setTimeout(() => setStartBurst(false), 1250);
    const task = focusTasks.find(item => item.id === taskId);
    start({ userId, subjectId: task?.subjectId ?? (subjectId || null), taskId: task?.id ?? null,
      timerType: mode, checkpointSeconds: (settings?.checkpointMinutes ?? 120)*60,
      durationSeconds: mode==='stopwatch'||mode==='deep-focus' ? null : duration*60 });
  };

  const finish = async (adjusted?: number) => {
    if (!active || active.userId !== userId || finishing.current) return;
    finishing.current = true;
    try {
    const overdue = !active.pausedAt && timerElapsedSeconds(active.startedAt, active.totalPausedMs) >= checkpointLimit(active);
    const end = active.pausedAt ?? (overdue ? checkpointPauseAt(active) : nowIso());
    const rawSeconds = creditableTimerSeconds(active);
    const seconds = Math.min(adjusted ?? rawSeconds, active.durationSeconds ?? Infinity);
    const currentPauseMs = active.pausedAt ? Math.max(0, Date.parse(end) - new Date(active.pausedAt).getTime()) : 0;
    const pauseSeconds = Math.round((active.totalPausedMs + currentPauseMs)/1000);
    const completedTarget = !active.durationSeconds || seconds >= active.durationSeconds;
    if (seconds <= 0) { clear(); setZen(false); return; }

    const inserted = await db.transaction('rw', db.sessions, async () => {
      if (await db.sessions.get(active.id)) return false;
      await db.sessions.add({
      id: active.id, userId: active.userId, subjectId: active.subjectId, topicId: active.topicId, taskId: active.taskId,
      startTime: active.startedAt, endTime: end, studySeconds: seconds, activeSegments: completedActiveSegments(active, end, seconds), breakSeconds: 0, pauseSeconds,
      timerType: active.timerType, deviceId: getDeviceId(), createdAt: active.startedAt, updatedAt: nowIso(), syncStatus: 'pending'
      });
      return true;
    });
    // Even when a crash left this ID in Dexie, a pending/failed row must sync.
    requestSync(userId);
    if (!inserted) { clear(); return; }

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
    clear();
    setZen(false);
    setDistractionOpen(false);
    if (preferences.showSessionSummary) setLastSummary(insight);
    } finally { finishing.current = false; }
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
    <div className="timer-heading"><div className="eyebrow">{active ? chosenTask?.title ?? selected?.name ?? 'Focus session' : 'Focus studio'}</div><span className={`focus-state ${companionState}`}>{completed?'Complete':active?.state==='paused'?'Paused':active?'Focusing':'Ready'}</span></div>

    {!active && <div className="focus-progress-hud">
      <div><span className="hud-icon"><Target size={15}/></span><span><small>{uiText("Level")}</small><strong>{focusProgress.level}</strong></span></div>
      <div className="hud-xp"><span><small>{focusProgress.xp} {uiText("XP")}</small><strong>{focusProgress.xpToNextLevel} {uiText("to next")}</strong></span><i><b style={{width:`${focusProgress.levelProgress*100}%`}}/></i></div>
      <div><span className="hud-icon streak"><Flame size={15}/></span><span><small>{uiText("Streak")}</small><strong>{focusProgress.streak} {uiText("days")}</strong></span></div>
      <div><span className="hud-icon coins"><Coins size={15}/></span><span><small>{uiText("Coins")}</small><strong>{focusProgress.coins}</strong></span></div>
    </div>}

    <div className="focus-visual">
      <FocusCompanion variant={companion} state={companionState} motion={motion} intro={startBurst} subject={selected?.name} level={focusProgress.level}/>
    </div>

    {!active && <div className="timer-setup">
      <div className="mode-picker">{modeMeta.map(({id,label,hint,icon:Icon})=><button key={id} className={`mode-card ${mode===id?'active':''}`} onClick={()=>setMode(id)}><span className="mode-icon"><Icon size={20}/></span><span><strong>{label}</strong><small>{hint}</small></span></button>)}</div>
      <div className="setup-fields">
        <FocusTaskPicker tasks={focusTasks} subjects={subjects} selectedTaskId={taskId} onSelect={chooseTask} fa={fa}/>
        <label><span>{uiText("Subject")}</span><select className="input" value={subjectId} onChange={e=>{setSubjectId(e.target.value);setTaskId('');}}><option value="">{uiText("No subject")}</option>{subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
        {(mode==='countdown'||mode==='pomodoro') && <label><span>{uiText("Minutes")}</span><input className="input" type="number" min="1" max="240" value={duration} onChange={e=>setDuration(Number(e.target.value)||25)} aria-label={uiText("Minutes")}/></label>}
        <label><span>{uiText('Confirmation interval (minutes)')}</span><input className="input" type="number" min="1" max="240" value={settings?.checkpointMinutes ?? 120} onChange={e=>{const minutes=Number(e.target.value);if(Number.isInteger(minutes)&&minutes>=1&&minutes<=240) void db.settings.update(userId,{checkpointMinutes:minutes,updatedAt:nowIso(),syncStatus:'pending'}).then(()=>requestSync(userId));}}/></label>
        {preferences.promptIntent && <label className="session-intent-field"><span>{uiText("Session intention")}</span><input className="input" value={intent} maxLength={90} onChange={event=>setIntent(event.target.value)} placeholder={uiText("What will make this session a win?")}/></label>}
      </div>
    </div>}

    {active && <div className="focus-active-context">
      <div className="focus-intention"><Target size={14}/><span>{chosenTask?.title || intent.trim() || selected?.name || 'Stay with one thing'}</span></div>
      <div className="focus-live-tools">
        <button className={`focus-tool ${zen?'active':''}`} onClick={()=>setZen(value=>!value)} title={uiText("Zen mode (Z)")}>{zen?<Minimize2 size={15}/>:<Maximize2 size={15}/>}<span>{uiText("Zen")}</span></button>
        <div className="distraction-wrap"><button className={`focus-tool ${distractions?'warn':''}`} onClick={()=>setDistractionOpen(value=>!value)}><AlertTriangle size={15}/><span>{uiText("Distracted")} {distractions ? `· ${distractions}` : ''}</span></button>{distractionOpen&&<div className="distraction-menu"><strong>{uiText("What pulled you away?")}</strong><div>{distractionReasons.map(reason=><button key={reason} onClick={()=>logDistraction(reason)}>{reason}</button>)}</div></div>}</div>
        <span className="focus-score-live"><Shield size={14}/> {uiText("Score")} {focusProgress.averageScore || '—'}</span>
      </div>
    </div>}

    {active?.awaitingConfirmation && <div ref={checkpointDialog} tabIndex={-1} className="session-safety" role="alertdialog" aria-label={uiText('Are you still studying?')}>
      <strong>{uiText('Are you still studying?')}</strong> {uiText('Timer paused at the confirmation checkpoint.')}
      <button className="button primary" onClick={()=>{setAdjustMinutes(null);confirmContinue();}}>{uiText('Continue')}</button>
      <button className="button" onClick={()=>void finish()}>{uiText('Finish')}</button>
      <label>{uiText('Adjust duration (minutes)')} <input className="input" type="number" min="0" max={Math.ceil(elapsed/60)} value={adjustMinutes ?? ''} onChange={e=>setAdjustMinutes(e.target.value === '' ? null : Number(e.target.value))}/></label>
      <button className="button" disabled={adjustMinutes === null || !Number.isFinite(adjustMinutes) || adjustMinutes < 0 || adjustMinutes*60 > elapsed} onClick={()=>void finish(Math.floor((adjustMinutes ?? 0)*60))}>{uiText('Save adjusted duration')}</button>
    </div>}
    <div className="timer-core">
      <div className="timer-display" role="timer" aria-live="off" aria-label={uiText("Study timer")} dir="ltr">{formatDuration(display)}</div>
      {active?.durationSeconds ? <div className="progress timer-progress"><div style={{width:`${Math.min(100, elapsed/active.durationSeconds*100)}%`}}/></div> : <div className="timer-tickline"><span/><span/><span/><span/><span/></div>}
      <div className="timer-actions">
        <div className="timer-main-actions">
        {!active && <button className="button primary focus-launch" onClick={begin}><Play/> {uiText("Start focus")}</button>}
        {active?.state==='running' && <button className="button pause-button" onClick={pause}><Pause/> {uiText("Pause")}</button>}
        {active?.state==='paused' && !active.awaitingConfirmation && <button className="button primary" onClick={resume}><Play/> {uiText("Resume")}</button>}
        {active && <button className="button" onClick={()=>void finish()}><Square/> {uiText("Finish")}</button>}
        </div>
        {active && <div className="timer-secondary-actions">
        {active?.durationSeconds && <button className="button ghost" onClick={()=>addTime(300)}>{uiText("+5 min")}</button>}
        {active && <button className="icon-button" onClick={restartSession} aria-label={uiText("Restart")}><RotateCcw size={18}/></button>}
        {active && <button className="button ghost quiet-danger" onClick={discard}>{uiText("Discard")}</button>}
        </div>}
      </div>
      {active && preferences.showShortcutHints && <div className="focus-shortcuts"><Keyboard size={13}/><span><kbd>{uiText("Space")}</kbd> {uiText("pause / resume")}</span><span><kbd>{uiText("Z")}</kbd> {uiText("zen mode")}</span></div>}
    </div>
    {active && <div className="session-safety"><span className="status-dot"/> {uiText("Session is saved locally and survives refresh or app restart.")}</div>}

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

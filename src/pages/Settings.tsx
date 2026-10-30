import { useUiText, setUiLanguage, useUiLanguage } from '../lib/uiLanguage';
import { useRef, useState, type ChangeEvent, type CSSProperties } from 'react';
import { Check, Coins, Download, Flame, Gauge, Keyboard, Shield, Sparkles, Target, TimerReset, Trophy, Upload, Bell, Palette, SlidersHorizontal } from 'lucide-react';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useSettings } from '../hooks/useSettings';
import { useCompanionPreferences, type CompanionMotion } from '../hooks/useCompanionPreferences';
import { useFocusProgress } from '../hooks/useFocusProgress';
import { useFocusSystemPreferences } from '../hooks/useFocusSystemPreferences';
import { db, nowIso } from '../lib/db';
import { Card } from '../components/Card';
import { FocusCompanion, type CompanionState } from '../components/FocusCompanion';
import { companionMeta } from '../components/companionMeta';
import { ProgressHub } from '../components/ProgressHub';
import { AccountSecurityPanel } from '../components/AccountSecurityPanel';
import type { Exam, Goal, StudySession, StudyTask, Subject, Topic, UserSettings } from '../types';

const themes=[
  {id:'studio',name:'Studio Noir',tag:'Dashboard',colors:['#07070a','#9a63ff','#f5cf52']},
  {id:'plush',name:'Plush Toy',tag:'Cute',colors:['#fff2f7','#f28ab5','#8ad5cf']},
  {id:'jelly',name:'Jelly Pop',tag:'Expressive',colors:['#fff5e9','#ff7f96','#7a8cff']},
  {id:'matcha',name:'Matcha Milk',tag:'Calm',colors:['#f6f4e8','#89a77a','#d5b98f']},
  {id:'lavender',name:'Lavender Mist',tag:'Dreamy',colors:['#f2efff','#8d7cf4','#e5a3cf']},
  {id:'ocean-glass',name:'Ocean Glass',tag:'Glass',colors:['#071c2d','#28b8c7','#7b8cff']},
  {id:'liquid',name:'Liquid',tag:'Classic',colors:['#171a23','#8a6cff','#35d4a2']},
  {id:'chrome',name:'Chrome',tag:'Y2K',colors:['#f0f2f5','#89909b','#dfe5ee']},
  {id:'pink-chrome',name:'Pink Chrome',tag:'Y2K',colors:['#fff5fa','#d94b9b','#9297b9']},
  {id:'dark-hero',name:'Dark Hero',tag:'Cinematic',colors:['#070707','#e7c84b','#262626']},
  {id:'amoled',name:'AMOLED',tag:'Pure black',colors:['#000000','#ffffff','#222222']},
  {id:'aurora',name:'Aurora',tag:'Glow',colors:['#071c22','#6ee7b7','#60a5fa']},
  {id:'cyber',name:'Cyber',tag:'Neon',colors:['#080611','#d946ef','#22d3ee']},
  {id:'cozy',name:'Cozy Study',tag:'Warm',colors:['#211812','#d99a5d','#9bb475']},
  {id:'sakura',name:'Sakura',tag:'Soft',colors:['#fff2f5','#eb7c9f','#b78bc6']},
  {id:'minimal',name:'Minimal',tag:'Clean',colors:['#f6f6f4','#222222','#a8a8a2']},
  {id:'space',name:'Space',tag:'Deep',colors:['#050813','#7c82ff','#46c6ff']},
  {id:'forest',name:'Forest',tag:'Natural',colors:['#0d1712','#75c98b','#b7cc73']}
];
type Backup = {subjects?:Subject[];topics?:Topic[];tasks?:StudyTask[];sessions?:StudySession[];goals?:Goal[];exams?:Exam[];settings?:UserSettings};

export default function SettingsPage(){
 const uiText=useUiText();
 const uiLanguage=useUiLanguage();
 const {userId}=useCurrentUser(); const s=useSettings(userId); const {companion,motion,setCompanion,setMotion}=useCompanionPreferences(userId); const focusProgress=useFocusProgress(userId); const {preferences:focusPrefs,patchPreferences}=useFocusSystemPreferences(userId); const fileRef=useRef<HTMLInputElement>(null); const [message,setMessage]=useState(''); const [previewState,setPreviewState]=useState<CompanionState>('running'); if(!s)return <div className="page">{uiText("Loading…")}</div>;
 const patch=async(p:Partial<UserSettings>)=>{if(p.language) setUiLanguage(p.language);await db.settings.update(userId,{...p,updatedAt:nowIso(),syncStatus:'pending'});window.dispatchEvent(new CustomEvent('studyflow:sync-needed',{detail:{userId}}));};
 const exportJson=async()=>{const payload={subjects:await db.subjects.where('userId').equals(userId).toArray(),topics:await db.topics.where('userId').equals(userId).toArray(),tasks:await db.tasks.where('userId').equals(userId).toArray(),sessions:await db.sessions.where('userId').equals(userId).toArray(),goals:await db.goals.where('userId').equals(userId).toArray(),exams:await db.exams.where('userId').equals(userId).toArray(),settings:s};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='studyflow-backup.json';a.click();URL.revokeObjectURL(a.href);};
 const exportCsv=async()=>{const sessions=await db.sessions.where('userId').equals(userId).toArray();const esc=(v:unknown)=>`"${String(v??'').replaceAll('"','""')}"`;const csv=['id,start_time,end_time,study_seconds,timer_type,subject_id',...sessions.map(x=>[x.id,x.startTime,x.endTime,x.studySeconds,x.timerType,x.subjectId??''].map(esc).join(','))].join('\n');const blob=new Blob([csv],{type:'text/csv'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='studyflow-sessions.csv';a.click();URL.revokeObjectURL(a.href);};
 const importBackup=async(e:ChangeEvent<HTMLInputElement>)=>{const f=e.target.files?.[0];if(!f)return;try{const raw=JSON.parse(await f.text()) as Backup;const safety={subjects:await db.subjects.where('userId').equals(userId).toArray(),topics:await db.topics.where('userId').equals(userId).toArray(),tasks:await db.tasks.where('userId').equals(userId).toArray(),sessions:await db.sessions.where('userId').equals(userId).toArray(),goals:await db.goals.where('userId').equals(userId).toArray(),exams:await db.exams.where('userId').equals(userId).toArray()};localStorage.setItem('studyflow.lastSafetyBackup',JSON.stringify(safety));const assign=<T extends {userId:string;updatedAt:string;syncStatus?:string}>(rows:T[]|undefined)=>rows?.map(r=>({...r,userId,updatedAt:nowIso(),syncStatus:'pending'}));await db.transaction('rw',[db.subjects,db.topics,db.tasks,db.sessions,db.goals,db.exams],async()=>{if(raw.subjects)await db.subjects.bulkPut(assign(raw.subjects) as Subject[]);if(raw.topics)await db.topics.bulkPut(assign(raw.topics) as Topic[]);if(raw.tasks)await db.tasks.bulkPut(assign(raw.tasks) as StudyTask[]);if(raw.sessions)await db.sessions.bulkPut(assign(raw.sessions) as StudySession[]);if(raw.goals)await db.goals.bulkPut(assign(raw.goals) as Goal[]);if(raw.exams)await db.exams.bulkPut(assign(raw.exams) as Exam[]);});setMessage('Backup imported. A safety snapshot was stored locally before import.');}catch{setMessage('Import failed: invalid StudyFlow backup.');}finally{e.target.value='';}};
 const requestNotifications=async()=>{if(!('Notification'in window)){setMessage('Browser notifications are not supported here.');return;}const result=await Notification.requestPermission();setMessage(`Notification permission: ${result}`);};
 const motionOptions:Array<{id:CompanionMotion;label:string;hint:string}>=[{id:'calm',label:'Calm',hint:'Subtle movement'},{id:'balanced',label:'Balanced',hint:'Recommended'},{id:'lively',label:'Lively',hint:'More character'}];

 return <div className="page settings-page">
  <header className="page-header"><div><div className="eyebrow">{uiText("Make it yours")}</div><h1>{uiText("Settings")}</h1><p className="subtle">{uiText("Personalize the mood without sacrificing focus or readability.")}</p></div></header>

  <Card className="language-setting-hero">
    <div className="language-setting-top"><div><div className="eyebrow">{uiLanguage==='fa'?'زبان برنامه':'App language'}</div><h2>{uiLanguage==='fa'?'یک زبان، در تمام صفحات':'One language across the app'}</h2><p className="subtle">{uiLanguage==='fa'?'با تغییر زبان، منوها، دکمه‌ها، پیام‌ها و تاریخ‌ها تغییر می‌کنند. داده‌های شخصی و سابقه مطالعه دست‌نخورده می‌مانند.':'Menus, buttons, messages and display dates follow your language. Personal data and study history remain unchanged.'}</p></div><div className="language-choice" role="group" aria-label="Language / زبان"><button type="button" aria-pressed={uiLanguage==='fa'} className={uiLanguage==='fa'?'active':''} onClick={()=>void patch({language:'fa',numberFormat:'persian'})}>فارسی</button><button type="button" aria-pressed={uiLanguage==='en'} className={uiLanguage==='en'?'active':''} onClick={()=>void patch({language:'en',numberFormat:'latin'})}>English</button></div></div>
  </Card>
  <details className="settings-fold"><summary><span>{uiLanguage==='fa'?'همراه و تمرکز':'Companion & focus'}</span><small>{uiLanguage==='fa'?'شخصیت، امتیاز و تنظیمات جلسه':'Character, level and session options'}</small></summary>
  <Card className="companion-settings-panel">
    <div className="section-title"><div><div className="eyebrow">{uiText("Focus companion")}</div><strong className="section-heading"><Sparkles size={19}/> {uiText("Character animation studio")}</strong></div><span className="selection-note">{companionMeta.find(item=>item.id===companion)?.name}</span></div>
    <p className="subtle companion-settings-copy">{uiText("Pick the exact character style you want beside the timer. Each one has separate idle, focusing, paused and session-complete motion.")}</p>
    {(()=>{const selected=companionMeta.find(item=>item.id===companion)??companionMeta[0];return <div className="character-showcase" style={{'--companion-accent':selected.accent} as CSSProperties}>
      <FocusCompanion variant={selected.id} state={previewState} motion={motion} preview level={focusProgress.level}/>
      <div className="character-showcase-copy">
        <span className="character-mode-note">{uiText("Live vector character · reactive StudyFlow animation rig")}</span>
        <h3>{selected.emoji} {selected.name}</h3>
        <p>{selected.subtitle}. {selected.vibe}{uiText(". Move your pointer over the scene to see eye tracking and parallax. The timer switches states automatically.")}</p>
        <div className="companion-live-badges"><span>{uiText("Pointer reactive")}</span><span>{uiText("State aware")}</span><span>{uiText("60fps transforms")}</span></div>
        <div className="preview-state-controls" aria-label={uiText("Preview animation state")}>
          {([{id:'idle',label:'Idle'},{id:'running',label:'Focus'},{id:'paused',label:'Pause'},{id:'celebrate',label:'Complete'}] as Array<{id:CompanionState;label:string}>).map(item=><button type="button" key={item.id} className={previewState===item.id?'active':''} onClick={()=>setPreviewState(item.id)}>{uiText(item.label)}</button>)}
        </div>
      </div>
    </div>})()}
    <div className="companion-picker">{companionMeta.map(item=><button type="button" key={item.id} className={`companion-option ${companion===item.id?'selected':''}`} onClick={()=>setCompanion(item.id)} aria-pressed={companion===item.id}>
      <span className="companion-option-emoji">{item.emoji}</span><span className="companion-option-copy"><strong>{item.name}</strong><small>{uiText(item.subtitle)}</small></span>{companion===item.id&&<span className="companion-selected"><Check size={14}/></span>}
    </button>)}</div>
    <div className="motion-settings"><div><strong>{uiText("Animation energy")}</strong><small>{uiText("Calm keeps movement subtle, while Lively increases bounce, hover and chase distance. Reduce Motion still overrides decorative movement.")}</small></div><div className="motion-segments">{motionOptions.map(option=><button type="button" key={option.id} className={motion===option.id?'active':''} onClick={()=>setMotion(option.id)}><strong>{uiText(option.label)}</strong><small>{uiText(option.hint)}</small></button>)}</div></div>
  </Card>

  <Card className="focus-system-settings">
    <div className="section-title"><div><div className="eyebrow">{uiText("Focus system")}</div><strong className="section-heading"><Gauge size={19}/> {uiText("Progress, reflection & flow")}</strong></div><span className="selection-note">{uiText("Level")} {focusProgress.level}</span></div>
    <div className="focus-system-overview">
      <div className="focus-level-card"><span className="focus-system-icon"><Trophy size={18}/></span><div><small>{uiText("Companion level")}</small><strong>{uiText("Level")} {focusProgress.level}</strong><span>{focusProgress.xp} {uiText("XP ·")} {focusProgress.xpToNextLevel} {uiText("to next")}</span></div><i><b style={{width:`${focusProgress.levelProgress*100}%`}}/></i></div>
      <div className="focus-system-stat"><span><Flame size={17}/></span><div><small>{uiText("Current streak")}</small><strong>{focusProgress.streak} {uiText("days")}</strong></div></div>
      <div className="focus-system-stat"><span><Shield size={17}/></span><div><small>{uiText("Average focus score")}</small><strong>{focusProgress.averageScore || '—'}{focusProgress.averageScore ? '/100' : ''}</strong></div></div>
      <div className="focus-system-stat"><span><Coins size={17}/></span><div><small>{uiText("Study coins")}</small><strong>{focusProgress.coins}</strong></div></div>
    </div>
    <div className="focus-system-toggles">
      <label className="switch-row"><span><strong>{uiText("Session summary")}</strong><small>{uiText("Show Focus Score, XP and reflection after finishing.")}</small></span><input type="checkbox" checked={focusPrefs.showSessionSummary} onChange={e=>patchPreferences({showSessionSummary:e.target.checked})}/></label>
      <label className="switch-row"><span><strong>{uiText("Auto Zen mode")}</strong><small>{uiText("Quiet the navigation automatically when focus starts.")}</small></span><input type="checkbox" checked={focusPrefs.autoZen} onChange={e=>patchPreferences({autoZen:e.target.checked})}/></label>
      <label className="switch-row"><span><strong>{uiText("Session intention")}</strong><small>{uiText("Ask for one clear outcome before each session.")}</small></span><input type="checkbox" checked={focusPrefs.promptIntent} onChange={e=>patchPreferences({promptIntent:e.target.checked})}/></label>
      <label className="switch-row"><span><strong>{uiText("Shortcut hints")}</strong><small><Keyboard size={13}/> {uiText("Show Space and Z controls below the timer.")}</small></span><input type="checkbox" checked={focusPrefs.showShortcutHints} onChange={e=>patchPreferences({showShortcutHints:e.target.checked})}/></label>
    </div>
    <div className="focus-system-note"><Target size={15}/><span>{uiText("Focus Score uses completion, pause time, distractions, duration and consistency — matching the StudyFlow product model.")}</span></div>
  </Card>

  </details>
  <details className="settings-fold"><summary><span>{uiLanguage==='fa'?'حساب و پیشرفت':'Account & progress'}</span><small>{uiLanguage==='fa'?'پاداش، امنیت و اطلاعات حساب':'Rewards, security and account data'}</small></summary>
  <ProgressHub userId={userId} calendarType={s.calendarType}/><AccountSecurityPanel userId={userId}/>
  </details>

  <details className="settings-fold"><summary><span>{uiLanguage==='fa'?'پوسته‌ها و رنگ‌ها':'Themes & colors'}</span><small>{uiLanguage==='fa'?'گالری پوسته‌های برنامه':'App theme gallery'}</small></summary><Card className="theme-panel">
    <div className="section-title"><div><div className="eyebrow">{uiText("Appearance")}</div><strong className="section-heading"><Palette size={19}/> {uiText("Theme studio")}</strong></div><span className="selection-note">{themes.find(t=>t.id===s.themeId)?.name ?? s.themeId}</span></div>
    <div className="theme-gallery" role="list" aria-label={uiText("Themes")}>{themes.map(theme=><button key={theme.id} className={`theme-tile ${s.themeId===theme.id?'selected':''}`} onClick={()=>void patch({themeId:theme.id})} role="listitem" aria-pressed={s.themeId===theme.id}>
      <span className="theme-preview" style={{background:`linear-gradient(135deg,${theme.colors[0]} 0 52%,${theme.colors[1]} 52% 72%,${theme.colors[2]} 72%)`}}><i/><b/><em/></span>
      <span className="theme-tile-copy"><strong>{theme.name}</strong><small>{uiText(theme.tag)}</small></span>{s.themeId===theme.id&&<span className="theme-check"><Check size={14}/></span>}
    </button>)}</div>
  </Card>

  </details>
  <div className="settings-grid">
    <Card className="settings-card"><div className="settings-card-title"><SlidersHorizontal size={18}/><div><strong>{uiText("Locale & comfort")}</strong><small>{uiText("Language, calendar and motion")}</small></div></div><div className="form-row settings-form">
      <label><span>{uiText("Language")}</span><select className="input" value={s.language} onChange={e=>void patch({language:e.target.value as 'en'|'fa'})}><option value="en">{uiText("English")}</option><option value="fa">{uiText("فارسی")}</option></select></label>
      <label><span>{uiText("Calendar")}</span><select className="input" value={s.calendarType} onChange={e=>void patch({calendarType:e.target.value as 'gregorian'|'jalali'})}><option value="gregorian">{uiText("میلادی (دوره محاسبه قبلی)")}</option><option value="jalali">{uiText("شمسی / جلالی")}</option></select></label>
      <label><span>{uiText("Number format")}</span><select className="input" value={s.numberFormat} onChange={e=>void patch({numberFormat:e.target.value as 'latin'|'persian'})}><option value="latin">123</option><option value="persian">۱۲۳</option></select></label>
      <label><span>{uiText("Week starts")}</span><select className="input" value={s.weekStart} onChange={e=>void patch({weekStart:e.target.value as 'saturday'|'sunday'|'monday'})}><option value="saturday">{uiText("Saturday")}</option><option value="sunday">{uiText("Sunday")}</option><option value="monday">{uiText("Monday")}</option></select></label>
      <label className="switch-row"><span><strong>{uiText("Reduce motion")}</strong><small>{uiText("Quiet down decorative animation")}</small></span><input type="checkbox" checked={s.reduceMotion} onChange={e=>void patch({reduceMotion:e.target.checked})}/></label>
    </div></Card>

    <Card className="settings-card"><div className="settings-card-title"><TimerReset size={18}/><div><strong>{uiText("Pomodoro")}</strong><small>{uiText("Set your default focus rhythm")}</small></div></div><div className="form-row settings-form">
      <label><span>{uiText("Focus minutes")}</span><input className="input" type="number" min="1" value={s.pomodoroFocus} onChange={e=>void patch({pomodoroFocus:Number(e.target.value)})}/></label>
      <label><span>{uiText("Short break")}</span><input className="input" type="number" min="1" value={s.pomodoroShortBreak} onChange={e=>void patch({pomodoroShortBreak:Number(e.target.value)})}/></label>
      <label><span>{uiText("Long break")}</span><input className="input" type="number" min="1" value={s.pomodoroLongBreak} onChange={e=>void patch({pomodoroLongBreak:Number(e.target.value)})}/></label>
    </div></Card>

    <Card className="settings-card"><div className="settings-card-title"><Bell size={18}/><div><strong>{uiText("Feedback")}</strong><small>{uiText("Choose how StudyFlow responds")}</small></div></div><div className="form-row settings-form">
      <label className="switch-row"><span><strong>{uiText("Notifications")}</strong><small>{uiText("Focus and break completion")}</small></span><input type="checkbox" checked={s.notifications} onChange={e=>void patch({notifications:e.target.checked})}/></label>
      <label className="switch-row"><span><strong>{uiText("Haptics")}</strong><small>{uiText("Gentle vibration on actions")}</small></span><input type="checkbox" checked={s.haptics} onChange={e=>void patch({haptics:e.target.checked})}/></label>
      <label className="switch-row"><span><strong>{uiText("Focus sounds")}</strong><small>{uiText("Remember ambient sound preference")}</small></span><input type="checkbox" checked={s.sounds} onChange={e=>void patch({sounds:e.target.checked})}/></label>
      <button className="button" onClick={()=>void requestNotifications()}>{uiText("Request notification permission")}</button>
    </div></Card>

    <Card className="settings-card"><div className="settings-card-title"><Download size={18}/><div><strong>{uiText("Data & backup")}</strong><small>{uiText("Keep a portable copy of your study history")}</small></div></div><p className="subtle">{uiText("JSON contains the full local dataset. CSV exports study sessions. Import creates a safety snapshot before merging.")}</p><div className="data-actions"><button className="button" onClick={()=>void exportJson()}><Download size={17}/> {uiText("JSON")}</button><button className="button" onClick={()=>void exportCsv()}><Download size={17}/> {uiText("CSV")}</button><button className="button" onClick={()=>fileRef.current?.click()}><Upload size={17}/> {uiText("Import")}</button></div><input ref={fileRef} type="file" accept="application/json" hidden onChange={e=>void importBackup(e)}/>{message&&<p className="settings-message">{uiText(message)}</p>}</Card>
  </div>
 </div>;
}

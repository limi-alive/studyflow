import { ChangeEvent, useRef, useState } from 'react';
import { Check, Download, Upload, Bell, Palette, TimerReset, SlidersHorizontal, Sparkles } from 'lucide-react';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useSettings } from '../hooks/useSettings';
import { useCompanionPreferences, type CompanionMotion } from '../hooks/useCompanionPreferences';
import { db, nowIso } from '../lib/db';
import { Card } from '../components/Card';
import { FocusCompanion } from '../components/FocusCompanion';
import { companionMeta } from '../components/companionMeta';
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
 const {userId}=useCurrentUser(); const s=useSettings(userId); const {companion,motion,setCompanion,setMotion}=useCompanionPreferences(userId); const fileRef=useRef<HTMLInputElement>(null); const [message,setMessage]=useState(''); if(!s)return <div className="page">Loading…</div>;
 const patch=async(p:Partial<UserSettings>)=>{await db.settings.update(userId,{...p,updatedAt:nowIso()});};
 const exportJson=async()=>{const payload={subjects:await db.subjects.where('userId').equals(userId).toArray(),topics:await db.topics.where('userId').equals(userId).toArray(),tasks:await db.tasks.where('userId').equals(userId).toArray(),sessions:await db.sessions.where('userId').equals(userId).toArray(),goals:await db.goals.where('userId').equals(userId).toArray(),exams:await db.exams.where('userId').equals(userId).toArray(),settings:s};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='studyflow-backup.json';a.click();URL.revokeObjectURL(a.href);};
 const exportCsv=async()=>{const sessions=await db.sessions.where('userId').equals(userId).toArray();const esc=(v:unknown)=>`"${String(v??'').replaceAll('"','""')}"`;const csv=['id,start_time,end_time,study_seconds,timer_type,subject_id',...sessions.map(x=>[x.id,x.startTime,x.endTime,x.studySeconds,x.timerType,x.subjectId??''].map(esc).join(','))].join('\n');const blob=new Blob([csv],{type:'text/csv'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='studyflow-sessions.csv';a.click();URL.revokeObjectURL(a.href);};
 const importBackup=async(e:ChangeEvent<HTMLInputElement>)=>{const f=e.target.files?.[0];if(!f)return;try{const raw=JSON.parse(await f.text()) as Backup;const safety={subjects:await db.subjects.where('userId').equals(userId).toArray(),topics:await db.topics.where('userId').equals(userId).toArray(),tasks:await db.tasks.where('userId').equals(userId).toArray(),sessions:await db.sessions.where('userId').equals(userId).toArray(),goals:await db.goals.where('userId').equals(userId).toArray(),exams:await db.exams.where('userId').equals(userId).toArray()};localStorage.setItem('studyflow.lastSafetyBackup',JSON.stringify(safety));const assign=<T extends {userId:string;updatedAt:string;syncStatus?:string}>(rows:T[]|undefined)=>rows?.map(r=>({...r,userId,updatedAt:nowIso(),syncStatus:'pending'}));await db.transaction('rw',[db.subjects,db.topics,db.tasks,db.sessions,db.goals,db.exams],async()=>{if(raw.subjects)await db.subjects.bulkPut(assign(raw.subjects) as Subject[]);if(raw.topics)await db.topics.bulkPut(assign(raw.topics) as Topic[]);if(raw.tasks)await db.tasks.bulkPut(assign(raw.tasks) as StudyTask[]);if(raw.sessions)await db.sessions.bulkPut(assign(raw.sessions) as StudySession[]);if(raw.goals)await db.goals.bulkPut(assign(raw.goals) as Goal[]);if(raw.exams)await db.exams.bulkPut(assign(raw.exams) as Exam[]);});setMessage('Backup imported. A safety snapshot was stored locally before import.');}catch{setMessage('Import failed: invalid StudyFlow backup.');}finally{e.target.value='';}};
 const requestNotifications=async()=>{if(!('Notification'in window)){setMessage('Browser notifications are not supported here.');return;}const result=await Notification.requestPermission();setMessage(`Notification permission: ${result}`);};
 const motionOptions:Array<{id:CompanionMotion;label:string;hint:string}>=[{id:'calm',label:'Calm',hint:'Subtle movement'},{id:'balanced',label:'Balanced',hint:'Recommended'},{id:'lively',label:'Lively',hint:'More character'}];

 return <div className="page settings-page">
  <header className="page-header"><div><div className="eyebrow">Make it yours</div><h1>Settings</h1><p className="subtle">Personalize the mood without sacrificing focus or readability.</p></div></header>

  <Card className="companion-settings-panel">
    <div className="section-title"><div><div className="eyebrow">Focus companion</div><strong className="section-heading"><Sparkles size={19}/> Rive animation library</strong></div><span className="selection-note">{companionMeta.find(item=>item.id===companion)?.name}</span></div>
    <p className="subtle companion-settings-copy">These are interactive Rive community animations rather than the hand-drawn StudyFlow SVGs. Only the selected companion runs a live preview to keep Settings light.</p>
    {(()=>{const selected=companionMeta.find(item=>item.id===companion)??companionMeta[0];return <div className="rive-showcase">
      <FocusCompanion variant={selected.id} state="running" motion={motion} preview/>
      <div className="rive-showcase-copy"><span className="rive-license">{selected.license} · Rive Community</span><h3>{selected.emoji} {selected.name}</h3><p>{selected.subtitle}. The animation reacts to focus state where the original Rive state machine exposes compatible inputs.</p><a className="rive-source-link" href={selected.sourceUrl} target="_blank" rel="noreferrer">View original by {selected.author} ↗</a></div>
    </div>})()}
    <div className="companion-picker">{companionMeta.map(item=><button type="button" key={item.id} className={`companion-option ${companion===item.id?'selected':''}`} onClick={()=>setCompanion(item.id)} aria-pressed={companion===item.id}>
      <span className="companion-option-emoji">{item.emoji}</span><span className="companion-option-copy"><strong>{item.name}</strong><small>{item.subtitle}</small></span>{companion===item.id&&<span className="companion-selected"><Check size={14}/></span>}
    </button>)}</div>
    <div className="motion-settings"><div><strong>Animation energy</strong><small>Controls StudyFlow's surrounding motion. Reduce Motion still overrides all decorative movement.</small></div><div className="motion-segments">{motionOptions.map(option=><button type="button" key={option.id} className={motion===option.id?'active':''} onClick={()=>setMotion(option.id)}><strong>{option.label}</strong><small>{option.hint}</small></button>)}</div></div>
  </Card>

  <Card className="theme-panel">
    <div className="section-title"><div><div className="eyebrow">Appearance</div><strong className="section-heading"><Palette size={19}/> Theme studio</strong></div><span className="selection-note">{themes.find(t=>t.id===s.themeId)?.name ?? s.themeId}</span></div>
    <div className="theme-gallery" role="list" aria-label="Themes">{themes.map(theme=><button key={theme.id} className={`theme-tile ${s.themeId===theme.id?'selected':''}`} onClick={()=>void patch({themeId:theme.id})} role="listitem" aria-pressed={s.themeId===theme.id}>
      <span className="theme-preview" style={{background:`linear-gradient(135deg,${theme.colors[0]} 0 52%,${theme.colors[1]} 52% 72%,${theme.colors[2]} 72%)`}}><i/><b/><em/></span>
      <span className="theme-tile-copy"><strong>{theme.name}</strong><small>{theme.tag}</small></span>{s.themeId===theme.id&&<span className="theme-check"><Check size={14}/></span>}
    </button>)}</div>
  </Card>

  <div className="settings-grid">
    <Card className="settings-card"><div className="settings-card-title"><SlidersHorizontal size={18}/><div><strong>Locale & comfort</strong><small>Language, calendar and motion</small></div></div><div className="form-row settings-form">
      <label><span>Language</span><select className="input" value={s.language} onChange={e=>void patch({language:e.target.value as 'en'|'fa'})}><option value="en">English</option><option value="fa">فارسی</option></select></label>
      <label><span>Calendar</span><select className="input" value={s.calendarType} onChange={e=>void patch({calendarType:e.target.value as 'gregorian'|'jalali'})}><option value="gregorian">Gregorian</option><option value="jalali">Jalali / Persian</option></select></label>
      <label><span>Number format</span><select className="input" value={s.numberFormat} onChange={e=>void patch({numberFormat:e.target.value as 'latin'|'persian'})}><option value="latin">123</option><option value="persian">۱۲۳</option></select></label>
      <label><span>Week starts</span><select className="input" value={s.weekStart} onChange={e=>void patch({weekStart:e.target.value as 'saturday'|'sunday'|'monday'})}><option value="saturday">Saturday</option><option value="sunday">Sunday</option><option value="monday">Monday</option></select></label>
      <label className="switch-row"><span><strong>Reduce motion</strong><small>Quiet down decorative animation</small></span><input type="checkbox" checked={s.reduceMotion} onChange={e=>void patch({reduceMotion:e.target.checked})}/></label>
    </div></Card>

    <Card className="settings-card"><div className="settings-card-title"><TimerReset size={18}/><div><strong>Pomodoro</strong><small>Set your default focus rhythm</small></div></div><div className="form-row settings-form">
      <label><span>Focus minutes</span><input className="input" type="number" min="1" value={s.pomodoroFocus} onChange={e=>void patch({pomodoroFocus:Number(e.target.value)})}/></label>
      <label><span>Short break</span><input className="input" type="number" min="1" value={s.pomodoroShortBreak} onChange={e=>void patch({pomodoroShortBreak:Number(e.target.value)})}/></label>
      <label><span>Long break</span><input className="input" type="number" min="1" value={s.pomodoroLongBreak} onChange={e=>void patch({pomodoroLongBreak:Number(e.target.value)})}/></label>
    </div></Card>

    <Card className="settings-card"><div className="settings-card-title"><Bell size={18}/><div><strong>Feedback</strong><small>Choose how StudyFlow responds</small></div></div><div className="form-row settings-form">
      <label className="switch-row"><span><strong>Notifications</strong><small>Focus and break completion</small></span><input type="checkbox" checked={s.notifications} onChange={e=>void patch({notifications:e.target.checked})}/></label>
      <label className="switch-row"><span><strong>Haptics</strong><small>Gentle vibration on actions</small></span><input type="checkbox" checked={s.haptics} onChange={e=>void patch({haptics:e.target.checked})}/></label>
      <label className="switch-row"><span><strong>Focus sounds</strong><small>Remember ambient sound preference</small></span><input type="checkbox" checked={s.sounds} onChange={e=>void patch({sounds:e.target.checked})}/></label>
      <button className="button" onClick={()=>void requestNotifications()}>Request notification permission</button>
    </div></Card>

    <Card className="settings-card"><div className="settings-card-title"><Download size={18}/><div><strong>Data & backup</strong><small>Keep a portable copy of your study history</small></div></div><p className="subtle">JSON contains the full local dataset. CSV exports study sessions. Import creates a safety snapshot before merging.</p><div className="data-actions"><button className="button" onClick={()=>void exportJson()}><Download size={17}/> JSON</button><button className="button" onClick={()=>void exportCsv()}><Download size={17}/> CSV</button><button className="button" onClick={()=>fileRef.current?.click()}><Upload size={17}/> Import</button></div><input ref={fileRef} type="file" accept="application/json" hidden onChange={e=>void importBackup(e)}/>{message&&<p className="settings-message">{message}</p>}</Card>
  </div>
 </div>;
}

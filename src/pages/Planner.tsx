import { FormEvent, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Check, Plus, Trash2 } from 'lucide-react';
import { Card } from '../components/Card';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useSettings } from '../hooks/useSettings';
import { formatAppDate } from '../lib/locale';
import { db, nowIso } from '../lib/db';

export default function PlannerPage() {
  const { userId } = useCurrentUser();
  const settings = useSettings(userId);
  const tasks = useLiveQuery(() => db.tasks.where('userId').equals(userId).filter(x=>!x.deletedAt&&x.status!=='archived').sortBy('deadline'), [userId]) ?? [];
  const subjects = useLiveQuery(() => db.subjects.where('userId').equals(userId).filter(x=>!x.deletedAt&&!x.archived).toArray(), [userId]) ?? [];
  const goals = useLiveQuery(() => db.goals.where('userId').equals(userId).filter(x=>!x.deletedAt).toArray(), [userId]) ?? [];
  const exams = useLiveQuery(() => db.exams.where('userId').equals(userId).filter(x=>!x.deletedAt).sortBy('date'), [userId]) ?? [];
  const [title,setTitle]=useState(''); const [subjectId,setSubjectId]=useState(''); const [deadline,setDeadline]=useState(''); const [minutes,setMinutes]=useState(45);
  const [goalMinutes,setGoalMinutes]=useState(300); const [goalPeriod,setGoalPeriod]=useState<'daily'|'weekly'|'monthly'>('daily');
  const [examName,setExamName]=useState(''); const [examDate,setExamDate]=useState(''); const [examSubject,setExamSubject]=useState('');
  const add = async (e:FormEvent) => { e.preventDefault(); if(!title.trim())return; const now=nowIso(); await db.tasks.add({id:crypto.randomUUID(),userId,subjectId:subjectId||null,topicId:null,title:title.trim(),priority:1,deadline:deadline||null,estimatedMinutes:minutes,status:'todo',createdAt:now,updatedAt:now,syncStatus:'pending'});setTitle(''); };
  const addGoal=async(e:FormEvent)=>{e.preventDefault();const now=nowIso();await db.goals.add({id:crypto.randomUUID(),userId,type:goalPeriod==='daily'?'daily_time':goalPeriod==='weekly'?'weekly_time':'monthly_time',target:goalMinutes,period:goalPeriod,createdAt:now,updatedAt:now,syncStatus:'pending'});};
  const addExam=async(e:FormEvent)=>{e.preventDefault();if(!examName||!examDate)return;const now=nowIso();await db.exams.add({id:crypto.randomUUID(),userId,subjectId:examSubject||null,name:examName,date:new Date(examDate).toISOString(),priority:1,createdAt:now,updatedAt:now,syncStatus:'pending'});setExamName('');};
  const toggle = async (id:string,status:string) => db.tasks.update(id,{status:status==='completed'?'todo':'completed',completedAt:status==='completed'?null:nowIso(),updatedAt:nowIso(),syncStatus:'pending'});
  const remove = async (id:string) => db.tasks.update(id,{deletedAt:nowIso(),updatedAt:nowIso(),syncStatus:'pending'});
  return <div className="page"><header className="page-header"><div><div className="eyebrow">Daily, weekly & monthly</div><h1>Planner</h1></div></header>
    <div className="grid grid-2"><Card><strong>Add task</strong><form className="form-row" style={{marginTop:16}} onSubmit={add}><input className="input" value={title} onChange={e=>setTitle(e.target.value)} placeholder="What needs to be done?"/><div className="form-grid"><select className="input" value={subjectId} onChange={e=>setSubjectId(e.target.value)}><option value="">No subject</option>{subjects.map(s=><option value={s.id} key={s.id}>{s.name}</option>)}</select><input className="input" type="number" min="1" value={minutes} onChange={e=>setMinutes(Number(e.target.value)||1)}/></div><input className="input" type="datetime-local" value={deadline} onChange={e=>setDeadline(e.target.value)}/><button className="button primary"><Plus size={18}/> Add task</button></form></Card>
    <Card><strong>Open plan</strong><div className="list" style={{marginTop:16}}>{tasks.length?tasks.map(t=><div className="list-item" key={t.id}><div><div style={{textDecoration:t.status==='completed'?'line-through':'none'}}>{t.title}</div><small className="subtle">{t.deadline?formatAppDate(t.deadline,settings,{year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}):'No deadline'} · {t.estimatedMinutes??0}m</small></div><div style={{display:'flex',gap:6}}><button className="button ghost" onClick={()=>void toggle(t.id,t.status)} aria-label="Complete"><Check size={17}/></button><button className="button ghost" onClick={()=>void remove(t.id)} aria-label="Delete"><Trash2 size={17}/></button></div></div>):<div className="empty">No tasks yet.</div>}</div></Card>
    <Card><strong>Study goals</strong><form className="form-row" onSubmit={addGoal} style={{marginTop:16}}><div className="form-grid"><select className="input" value={goalPeriod} onChange={e=>setGoalPeriod(e.target.value as 'daily'|'weekly'|'monthly')}><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select><input className="input" type="number" min="1" value={goalMinutes} onChange={e=>setGoalMinutes(Number(e.target.value)||1)}/></div><button className="button">Save goal</button></form><div className="list" style={{marginTop:14}}>{goals.map(g=><div className="list-item" key={g.id}><span>{g.period}</span><strong>{g.target} min</strong></div>)}</div></Card>
    <Card><strong>Exams</strong><form className="form-row" onSubmit={addExam} style={{marginTop:16}}><input className="input" value={examName} onChange={e=>setExamName(e.target.value)} placeholder="Physics Exam"/><select className="input" value={examSubject} onChange={e=>setExamSubject(e.target.value)}><option value="">No subject</option>{subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select><input className="input" type="datetime-local" value={examDate} onChange={e=>setExamDate(e.target.value)}/><button className="button"><Plus size={18}/> Add exam</button></form><div className="list" style={{marginTop:14}}>{exams.slice(0,5).map(x=><div className="list-item" key={x.id}><span>{x.name}<small className="subtle" style={{display:'block'}}>{formatAppDate(x.date,settings)}</small></span><strong>{Math.ceil((new Date(x.date).getTime()-Date.now())/86400000)} days</strong></div>)}</div></Card>
    </div>
  </div>;
}

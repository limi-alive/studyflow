import { FormEvent, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card } from '../components/Card';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useSettings } from '../hooks/useSettings';
import { formatAppDate } from '../lib/locale';
import { db, getDeviceId, nowIso } from '../lib/db';
import { formatDuration } from '../utils/time';

export default function HistoryPage(){
 const {userId}=useCurrentUser(); const settings=useSettings(userId); const sessions=useLiveQuery(()=>db.sessions.where('userId').equals(userId).filter(x=>!x.deletedAt).reverse().sortBy('startTime'),[userId])??[]; const subjects=useLiveQuery(()=>db.subjects.where('userId').equals(userId).toArray(),[userId])??[];
 const [subjectId,setSubjectId]=useState('');const [date,setDate]=useState(new Date().toLocaleDateString('en-CA'));const [from,setFrom]=useState('14:00');const [to,setTo]=useState('15:00');
 const add=async(e:FormEvent)=>{e.preventDefault();const start=new Date(`${date}T${from}`),end=new Date(`${date}T${to}`);if(end<=start)return;const now=nowIso();await db.sessions.add({id:crypto.randomUUID(),userId,subjectId:subjectId||null,startTime:start.toISOString(),endTime:end.toISOString(),studySeconds:Math.round((end.getTime()-start.getTime())/1000),breakSeconds:0,pauseSeconds:0,timerType:'manual',deviceId:getDeviceId(),createdAt:now,updatedAt:now,syncStatus:'pending'});};
 const subjectName=(id?:string|null)=>subjects.find(s=>s.id===id)?.name??'General';
 return <div className="page"><header className="page-header"><div><div className="eyebrow">Sessions</div><h1>History</h1></div></header><div className="grid grid-2"><Card><strong>Manual session</strong><form className="form-row" onSubmit={add} style={{marginTop:16}}><select className="input" value={subjectId} onChange={e=>setSubjectId(e.target.value)}><option value="">General</option>{subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select><input className="input" type="date" value={date} onChange={e=>setDate(e.target.value)}/><div className="form-grid"><input className="input" type="time" value={from} onChange={e=>setFrom(e.target.value)}/><input className="input" type="time" value={to} onChange={e=>setTo(e.target.value)}/></div><button className="button primary">Save session</button></form></Card><Card><strong>Recent sessions</strong><div className="list" style={{marginTop:16}}>{sessions.slice(0,30).map(s=><div className="list-item" key={s.id}><div><div>{subjectName(s.subjectId)}</div><small className="subtle">{formatAppDate(s.startTime,settings,{year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})} · {s.timerType}</small></div><strong>{formatDuration(s.studySeconds)}</strong></div>)}</div></Card></div></div>;
}

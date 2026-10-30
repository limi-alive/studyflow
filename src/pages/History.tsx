import { useUiText } from '../lib/uiLanguage';
import { FormEvent, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card } from '../components/Card';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useSettings } from '../hooks/useSettings';
import { formatAppDate } from '../lib/locale';
import { db, getDeviceId, nowIso } from '../lib/db';
import { requestSync } from '../lib/sync';
import { formatDuration } from '../utils/time';
import { LocalizedDatePicker } from '../components/LocalizedDatePicker';
import { persianLocalToIso, toPersianLocal } from '../utils/persianCalendar';

export default function HistoryPage(){
 const uiText=useUiText();
 const {userId}=useCurrentUser(); const settings=useSettings(userId); const sessions=useLiveQuery(()=>db.sessions.where('userId').equals(userId).filter(x=>!x.deletedAt).reverse().sortBy('startTime'),[userId])??[]; const subjects=useLiveQuery(()=>db.subjects.where('userId').equals(userId).toArray(),[userId])??[];
 const [subjectId,setSubjectId]=useState('');const [date,setDate]=useState(()=>toPersianLocal(new Date()));const [from,setFrom]=useState('14:00');const [to,setTo]=useState('15:00');const [error,setError]=useState('');
 const add=async(e:FormEvent)=>{e.preventDefault();let start:Date,end:Date;try{const [fh,fm]=from.split(':').map(Number);const [th,tm]=to.split(':').map(Number);start=new Date(persianLocalToIso(date.year,date.month,date.day,fh,fm));end=new Date(persianLocalToIso(date.year,date.month,date.day,th,tm));if(end<=start)throw new RangeError('time');}catch{setError('زمان پایان باید بعد از شروع باشد؛ تاریخ و ساعت را بررسی کن.');return;}setError('');const now=nowIso();await db.sessions.add({id:crypto.randomUUID(),userId,subjectId:subjectId||null,startTime:start.toISOString(),endTime:end.toISOString(),studySeconds:Math.round((end.getTime()-start.getTime())/1000),breakSeconds:0,pauseSeconds:0,timerType:'manual',deviceId:getDeviceId(),createdAt:now,updatedAt:now,syncStatus:'pending'});requestSync(userId);};
 const subjectName=(id?:string|null)=>subjects.find(s=>s.id===id)?.name??'General';
 return <div className="page"><header className="page-header"><div><div className="eyebrow">{uiText("Sessions")}</div><h1>{uiText("History")}</h1></div></header><div className="grid grid-2"><Card><strong>{uiText("Manual session")}</strong><form className="form-row" onSubmit={add} style={{marginTop:16}}><select className="input" value={subjectId} onChange={e=>setSubjectId(e.target.value)}><option value="">{uiText("General")}</option>{subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select><LocalizedDatePicker value={date} onChange={setDate} label={uiText('تاریخ مطالعه')} required/><div className="form-grid"><input className="input" type="time" value={from} onChange={e=>setFrom(e.target.value)}/><input className="input" type="time" value={to} onChange={e=>setTo(e.target.value)}/></div><button className="button primary">{uiText("Save session")}</button>{error&&<p role="alert" className="jalali-error">{uiText(error)}</p>}</form></Card><Card><strong>{uiText("Recent sessions")}</strong><div className="list" style={{marginTop:16}}>{sessions.slice(0,30).map(s=><div className="list-item" key={s.id}><div><div>{subjectName(s.subjectId)}</div><small className="subtle">{formatAppDate(s.startTime,settings,{year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})} · {s.timerType}</small></div><strong>{formatDuration(s.studySeconds)}</strong></div>)}</div></Card></div></div>;
}

import { FormEvent, useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Archive, Plus } from 'lucide-react';
import { Card } from '../components/Card';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { db, nowIso } from '../lib/db';

export default function SubjectsPage(){
 const {userId}=useCurrentUser();
 const subjects=useLiveQuery(()=>db.subjects.where('userId').equals(userId).filter(x=>!x.deletedAt).toArray(),[userId])??[];
 const [name,setName]=useState(''); const [color,setColor]=useState('#8a6cff'); const [selected,setSelected]=useState('');
 const topics=useLiveQuery(()=>selected?db.topics.where('subjectId').equals(selected).filter(x=>!x.deletedAt).toArray():Promise.resolve([]),[selected])??[];
 const [topicName,setTopicName]=useState(''); const [kind,setKind]=useState<'chapter'|'topic'>('chapter'); const [parentId,setParentId]=useState('');
 useEffect(()=>{ if(!selected&&subjects[0]) setSelected(subjects[0].id); },[subjects,selected]);
 const add=async(e:FormEvent)=>{e.preventDefault();if(!name.trim())return;const now=nowIso();const id=crypto.randomUUID();await db.subjects.add({id,userId,name:name.trim(),color,priority:1,archived:false,createdAt:now,updatedAt:now,syncStatus:'pending'});setName('');setSelected(id);};
 const addTopic=async(e:FormEvent)=>{e.preventDefault();if(!selected||!topicName.trim())return;const now=nowIso();await db.topics.add({id:crypto.randomUUID(),userId,subjectId:selected,parentId:parentId||null,name:topicName.trim(),kind,createdAt:now,updatedAt:now,syncStatus:'pending'});setTopicName('');};
 const chapters=topics.filter(t=>t.kind==='chapter');
 return <div className="page"><header className="page-header"><div><div className="eyebrow">Organize study</div><h1>Subjects & topics</h1></div></header>
 <div className="grid grid-2"><Card><strong>New subject</strong><form className="form-row" onSubmit={add} style={{marginTop:16}}><input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="Physics"/><input className="input" type="color" value={color} onChange={e=>setColor(e.target.value)}/><button className="button primary"><Plus size={18}/> Add subject</button></form></Card>
 <Card><strong>Your subjects</strong><div className="list" style={{marginTop:16}}>{subjects.length?subjects.map(s=><div className="list-item" key={s.id} style={{outline:selected===s.id?'2px solid var(--accent)':'none'}} onClick={()=>setSelected(s.id)}><div style={{display:'flex',alignItems:'center',gap:10}}><span className="subject-dot" style={{background:s.color}}/><span>{s.name}</span>{s.archived&&<small className="subtle">Archived</small>}</div><button className="button ghost" onClick={e=>{e.stopPropagation();void db.subjects.update(s.id,{archived:!s.archived,updatedAt:nowIso(),syncStatus:'pending'});}}><Archive size={17}/></button></div>):<div className="empty">Add your first subject.</div>}</div></Card>
 <Card><strong>Chapters & topics</strong><p className="subtle">Topics can be nested under a chapter.</p><form className="form-row" onSubmit={addTopic}><input className="input" value={topicName} onChange={e=>setTopicName(e.target.value)} placeholder="Chapter 4 / Membranes"/><div className="form-grid"><select className="input" value={kind} onChange={e=>setKind(e.target.value as 'chapter'|'topic')}><option value="chapter">Chapter</option><option value="topic">Topic</option></select><select className="input" disabled={kind==='chapter'} value={parentId} onChange={e=>setParentId(e.target.value)}><option value="">No parent</option>{chapters.map(c=><option value={c.id} key={c.id}>{c.name}</option>)}</select></div><button className="button" disabled={!selected}><Plus size={18}/> Add</button></form></Card>
 <Card><strong>Structure</strong><div className="list" style={{marginTop:16}}>{chapters.map(c=><div key={c.id}><div className="list-item"><strong>{c.name}</strong></div>{topics.filter(t=>t.parentId===c.id).map(t=><div className="list-item" key={t.id} style={{marginInlineStart:22}}><span>{t.name}</span></div>)}</div>)}{topics.filter(t=>t.kind==='topic'&&!t.parentId).map(t=><div className="list-item" key={t.id}><span>{t.name}</span></div>)}</div></Card>
 </div></div>;
}

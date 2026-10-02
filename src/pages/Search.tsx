import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Search as SearchIcon } from 'lucide-react';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { db } from '../lib/db';
import { Card } from '../components/Card';

export default function SearchPage(){
 const {userId}=useCurrentUser();const [q,setQ]=useState('');
 const results=useLiveQuery(async()=>{const needle=q.trim().toLowerCase();if(!needle)return[];const [subjects,topics,tasks,sessions]=await Promise.all([db.subjects.where('userId').equals(userId).toArray(),db.topics.where('userId').equals(userId).toArray(),db.tasks.where('userId').equals(userId).toArray(),db.sessions.where('userId').equals(userId).toArray()]);return [
  ...subjects.filter(x=>x.name.toLowerCase().includes(needle)).map(x=>({id:x.id,type:'Subject',title:x.name,detail:''})),
  ...topics.filter(x=>x.name.toLowerCase().includes(needle)).map(x=>({id:x.id,type:x.kind,title:x.name,detail:''})),
  ...tasks.filter(x=>(x.title+' '+(x.description??'')).toLowerCase().includes(needle)).map(x=>({id:x.id,type:'Task',title:x.title,detail:x.description??''})),
  ...sessions.filter(x=>(x.note??'').toLowerCase().includes(needle)).map(x=>({id:x.id,type:'Session note',title:x.note??'',detail:new Date(x.startTime).toLocaleString()}))
 ];},[q,userId])??[];
 return <div className="page"><header className="page-header"><div><div className="eyebrow">Find anything</div><h1>Search</h1></div></header><Card><div style={{display:'flex',gap:10,alignItems:'center'}}><SearchIcon size={20}/><input className="input" autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Subjects, topics, tasks, session notes…"/></div><div className="list" style={{marginTop:16}}>{q&&!results.length&&<div className="empty">No results.</div>}{results.map(x=><div className="list-item" key={`${x.type}-${x.id}`}><div><strong>{x.title}</strong><div className="subtle">{x.type}{x.detail?` · ${x.detail}`:''}</div></div></div>)}</div></Card></div>;
}

import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card } from '../components/Card';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { db } from '../lib/db';
import { averageSessionSeconds, dailySeries, longestStreak, totalStudySeconds } from '../utils/stats';
import { formatDuration } from '../utils/time';

type Range='today'|'week'|'month'|'year'|'all';
function cutoffFor(range:Range){const d=new Date();if(range==='today')d.setHours(0,0,0,0);else if(range==='week')d.setDate(d.getDate()-6);else if(range==='month')d.setDate(d.getDate()-29);else if(range==='year')d.setFullYear(d.getFullYear()-1);else return 0;return d.getTime();}
export default function StatsPage(){
 const {userId}=useCurrentUser(); const allQuery=useLiveQuery(()=>db.sessions.where('userId').equals(userId).filter(x=>!x.deletedAt).toArray(),[userId]); const all=useMemo(()=>allQuery??[],[allQuery]); const subjects=useLiveQuery(()=>db.subjects.where('userId').equals(userId).toArray(),[userId])??[]; const [range,setRange]=useState<Range>('month');
 const sessions=useMemo(()=>{const c=cutoffFor(range);return all.filter(s=>new Date(s.endTime).getTime()>=c);},[all,range]); const series=dailySeries(sessions,range==='today'?1:range==='week'?7:range==='month'?30:range==='year'?90:30); const total=totalStudySeconds(sessions); const bySubject=new Map<string,number>(); sessions.forEach(s=>bySubject.set(s.subjectId??'none',(bySubject.get(s.subjectId??'none')??0)+s.studySeconds)); const max=Math.max(...series.map(x=>x.seconds),1);
 const best=series.reduce((a,b)=>b.seconds>a.seconds?b:a,series[0]??{date:'—',seconds:0});
 return <div className="page"><header className="page-header"><div><div className="eyebrow">Analytics</div><h1>Statistics</h1></div><div className="pill-row">{(['today','week','month','year','all'] as Range[]).map(r=><button key={r} className={`pill ${range===r?'active':''}`} onClick={()=>setRange(r)}>{r}</button>)}</div></header>
 <div className="grid grid-3"><Card><div className="metric"><span className="subtle">Study time</span><strong>{formatDuration(total)}</strong></div></Card><Card><div className="metric"><span className="subtle">Sessions</span><strong>{sessions.length}</strong></div></Card><Card><div className="metric"><span className="subtle">Average session</span><strong>{formatDuration(averageSessionSeconds(sessions))}</strong></div></Card></div>
 <div className="grid grid-3" style={{marginTop:18}}><Card><div className="metric"><span className="subtle">Best day</span><strong style={{fontSize:20}}>{best.date}</strong><span>{formatDuration(best.seconds)}</span></div></Card><Card><div className="metric"><span className="subtle">Active days</span><strong>{new Set(sessions.map(s=>new Date(s.startTime).toLocaleDateString('en-CA'))).size}</strong></div></Card><Card><div className="metric"><span className="subtle">Longest streak</span><strong>{longestStreak(all)}</strong></div></Card></div>
 <div className="grid grid-2" style={{marginTop:18}}><Card><strong>Study trend</strong><div className="chart-bars">{series.map(x=><div key={x.date} className="chart-bar" title={`${x.date}: ${formatDuration(x.seconds)}`} style={{height:`${Math.max(3,x.seconds/max*100)}%`}}/>)}</div></Card><Card><strong>Subject distribution</strong><div className="list" style={{marginTop:16}}>{[...bySubject.entries()].sort((a,b)=>b[1]-a[1]).map(([id,seconds])=><div className="list-item" key={id}><span>{subjects.find(s=>s.id===id)?.name??'General'}</span><strong>{formatDuration(seconds)}</strong></div>)}</div></Card></div>
 <Card style={{marginTop:18}}><strong>Study heatmap</strong><div className="heatmap" style={{marginTop:16}}>{Array.from({length:98},(_,i)=>{const day=series[i%Math.max(series.length,1)];const level=day?Math.min(.95,.12+day.seconds/14400):.06;return <div key={i} className="heat-cell" title={day?.date} style={{background:`color-mix(in srgb,var(--accent) ${Math.round(level*100)}%,var(--surface2))`}}/>})}</div></Card>
 </div>;
}

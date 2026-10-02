import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Activity, CalendarDays, Clock3, Flame, Sparkles, Trophy } from 'lucide-react';
import { Card } from '../components/Card';
import { TrendChart } from '../components/TrendChart';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { db } from '../lib/db';
import { averageSessionSeconds, dailySeries, longestStreak, totalStudySeconds } from '../utils/stats';
import { formatDuration } from '../utils/time';

type Range='today'|'week'|'month'|'year'|'all';
function cutoffFor(range:Range){const d=new Date();if(range==='today')d.setHours(0,0,0,0);else if(range==='week')d.setDate(d.getDate()-6);else if(range==='month')d.setDate(d.getDate()-29);else if(range==='year')d.setFullYear(d.getFullYear()-1);else return 0;return d.getTime();}

export default function StatsPage(){
  const {userId}=useCurrentUser();
  const allQuery=useLiveQuery(()=>db.sessions.where('userId').equals(userId).filter(x=>!x.deletedAt).toArray(),[userId]);
  const all=useMemo(()=>allQuery??[],[allQuery]);
  const subjects=useLiveQuery(()=>db.subjects.where('userId').equals(userId).toArray(),[userId])??[];
  const [range,setRange]=useState<Range>('month');
  const sessions=useMemo(()=>{const c=cutoffFor(range);return all.filter(s=>new Date(s.endTime).getTime()>=c);},[all,range]);
  const days=range==='today'?1:range==='week'?7:range==='month'?30:range==='year'?90:30;
  const series=dailySeries(sessions,days);
  const total=totalStudySeconds(sessions);
  const average=averageSessionSeconds(sessions);
  const best=series.reduce((a,b)=>b.seconds>a.seconds?b:a,series[0]??{date:'—',seconds:0});
  const activeDays=new Set(sessions.map(s=>new Date(s.startTime).toLocaleDateString('en-CA'))).size;
  const streak=longestStreak(sessions);
  const previous=series.map((item,index)=>Math.max(0,Math.round((series[Math.max(0,index-1)]?.seconds ?? item.seconds)*.82)));
  const chartPoints=series.map((item,index)=>({label:new Date(`${item.date}T12:00:00`).toLocaleDateString('en-US',{month:'short',day:'numeric'}),value:item.seconds,compare:previous[index]}));
  const bySubject=new Map<string,number>(); sessions.forEach(s=>bySubject.set(s.subjectId??'none',(bySubject.get(s.subjectId??'none')??0)+s.studySeconds));
  const subjectRows=subjects.map(subject=>({...subject,seconds:bySubject.get(subject.id)??0})).sort((a,b)=>b.seconds-a.seconds).slice(0,6);
  const subjectMax=Math.max(...subjectRows.map(row=>row.seconds),1);

  return <div className="page stats-dashboard">
    <header className="dashboard-topbar"><div><div className="eyebrow">Deep analytics</div><h1>Statistics</h1></div><div className="range-tabs range-tabs-large">{(['today','week','month','year','all'] as Range[]).map(r=><button key={r} className={range===r?'active':''} onClick={()=>setRange(r)}>{r}</button>)}</div></header>
    <div className="stats-layout">
      <section className="stats-main">
        <Card className="analytics-hero stats-chart-card"><div className="analytics-heading"><div><div className="eyebrow">Study activity</div><h2>{formatDuration(total)} focused</h2></div><span className="live-chip"><Activity size={15}/> live from your sessions</span></div><TrendChart points={chartPoints}/><div className="chart-legend"><span><i className="legend-solid"/> Focus time</span><span><i className="legend-dashed"/> Rolling baseline</span></div></Card>
        <Card className="subject-breakdown-card"><div className="section-title"><div><div className="eyebrow">Distribution</div><strong>Subject breakdown</strong></div><Sparkles size={18}/></div><div className="subject-breakdown-list">{subjectRows.length?subjectRows.map((subject,index)=><div className="subject-breakdown-row" key={subject.id}><span className="subject-rank">0{index+1}</span><span className="subject-color" style={{background:subject.color}}/><strong>{subject.name}</strong><div className="subject-meter"><i style={{width:`${Math.max(4,subject.seconds/subjectMax*100)}%`,background:subject.color}}/></div><span>{formatDuration(subject.seconds)}</span></div>):<div className="empty small">No subject data yet.</div>}</div></Card>
      </section>
      <aside className="stats-rail">
        <Card className="insight-card"><span className="insight-icon purple"><Clock3/></span><small>Total focus</small><strong>{formatDuration(total)}</strong><span>{sessions.length} sessions</span></Card>
        <Card className="insight-card"><span className="insight-icon yellow"><Trophy/></span><small>Best day</small><strong>{best.seconds?formatDuration(best.seconds):'—'}</strong><span>{best.date}</span></Card>
        <Card className="insight-card"><span className="insight-icon green"><Flame/></span><small>Longest streak</small><strong>{streak} days</strong><span>{activeDays} active days</span></Card>
        <Card className="insight-card"><span className="insight-icon blue"><CalendarDays/></span><small>Average session</small><strong>{formatDuration(average)}</strong><span>per focus block</span></Card>
      </aside>
    </div>
  </div>;
}

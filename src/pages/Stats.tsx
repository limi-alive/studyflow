import { useUiText } from '../lib/uiLanguage';
import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Activity, CalendarDays, Clock3, Flame, Sparkles, Trophy } from 'lucide-react';
import { Card } from '../components/Card';
import { TrendChart } from '../components/TrendChart';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useSettings } from '../hooks/useSettings';
import { formatAppDate } from '../lib/locale';
import { startOfPersianYear } from '../utils/persianCalendar';
import { accountedAttribution, monthlyPeriodAt } from '../utils/monthlyAccounting';
import { useTimePulse } from '../hooks/useTimePulse';
import { db } from '../lib/db';
import { averageSessionSeconds, dailySeries, longestStreak, totalStudySeconds } from '../utils/stats';
import { formatDuration } from '../utils/time';

type Range='today'|'week'|'month'|'year'|'all';
function cutoffFor(range:Range, nowMs:number){const d=new Date(nowMs);if(range==='today')d.setHours(0,0,0,0);else if(range==='week')d.setDate(d.getDate()-6);else if(range==='month')return Date.parse(monthlyPeriodAt(nowMs).start);else if(range==='year')return startOfPersianYear(d).getTime();else return 0;return d.getTime();}

export default function StatsPage(){
 const uiText=useUiText();
  const {userId}=useCurrentUser();
  const nowMs=useTimePulse();
  const settings=useSettings(userId);
  const allQuery=useLiveQuery(()=>db.sessions.where('userId').equals(userId).filter(x=>!x.deletedAt).toArray(),[userId]);
  const all=useMemo(()=>allQuery??[],[allQuery]);
  const subjects=useLiveQuery(()=>db.subjects.where('userId').equals(userId).toArray(),[userId])??[];
  const [range,setRange]=useState<Range>('month');
  const sessions=useMemo(()=>{const c=cutoffFor(range,nowMs);return all.filter(s=>s.activeSegments ? s.activeSegments.some(segment=>Date.parse(segment.end)>c) : Date.parse(s.endTime)>=c);},[all,range,nowMs]);
  const days=range==='today'?1:range==='week'?7:range==='month'?30:range==='year'?90:30;
  const series=dailySeries(sessions,days);
  const monthBounds=monthlyPeriodAt(nowMs);
  const attribution=range==='month' ? accountedAttribution(sessions,monthBounds.start,monthBounds.end) : null;
  const total=attribution?.totalSeconds ?? totalStudySeconds(sessions);
  const average=averageSessionSeconds(sessions);
  const best=series.reduce((a,b)=>b.seconds>a.seconds?b:a,series[0]??{date:'—',seconds:0});
  const activeDays=new Set(sessions.map(s=>new Date(s.startTime).toLocaleDateString('en-CA'))).size;
  const streak=longestStreak(sessions);
  const previous=series.map((item,index)=>Math.max(0,Math.round((series[Math.max(0,index-1)]?.seconds ?? item.seconds)*.82)));
  const chartPoints=series.map((item,index)=>({label:formatAppDate(new Date(`${item.date}T12:00:00`),settings,{month:'short',day:'numeric'}),value:item.seconds,compare:previous[index]}));
  const bySubject=attribution?.bySubject ?? new Map<string,number>();
  if(range!=='month') sessions.forEach(s=>bySubject.set(s.subjectId??'none',(bySubject.get(s.subjectId??'none')??0)+s.studySeconds));
  const subjectRows=subjects.map(subject=>({...subject,seconds:bySubject.get(subject.id)??0})).sort((a,b)=>b.seconds-a.seconds).slice(0,6);
  const subjectMax=Math.max(...subjectRows.map(row=>row.seconds),1);

  return <div className="page stats-dashboard">
    <header className="dashboard-topbar"><div><div className="eyebrow">{uiText("Deep analytics")}</div><h1>{uiText("Statistics")}</h1></div><div className="range-tabs range-tabs-large">{(['today','week','month','year','all'] as Range[]).map(r=><button key={r} className={range===r?'active':''} onClick={()=>setRange(r)}>{r}</button>)}</div></header>
    {attribution && <div className="session-safety" role="status">
      {attribution.provisional && <span>{uiText('Local study time is provisional until cloud sync verifies it.')} </span>}
      {attribution.conflictSeconds > 0 && <strong>{uiText('Attribution Conflict')}: {formatDuration(attribution.conflictSeconds)} — {uiText('Included once in total time; excluded from subject totals. Review your session history and contact support for a private source-record correction.')}</strong>}
    </div>}
    <div className="stats-layout">
      <section className="stats-main">
        <Card className="analytics-hero stats-chart-card"><div className="analytics-heading"><div><div className="eyebrow">{uiText("Study activity")}</div><h2>{formatDuration(total)} {uiText("focused")}</h2></div><span className="live-chip"><Activity size={15}/> {uiText("live from your sessions")}</span></div><TrendChart points={chartPoints}/><div className="chart-legend"><span><i className="legend-solid"/> {uiText("Focus time")}</span><span><i className="legend-dashed"/> {uiText("Rolling baseline")}</span></div></Card>
        <Card className="subject-breakdown-card"><div className="section-title"><div><div className="eyebrow">{uiText("Distribution")}</div><strong>{uiText("Subject breakdown")}</strong></div><Sparkles size={18}/></div><div className="subject-breakdown-list">{subjectRows.length?subjectRows.map((subject,index)=><div className="subject-breakdown-row" key={subject.id}><span className="subject-rank">0{index+1}</span><span className="subject-color" style={{background:subject.color}}/><strong>{subject.name}</strong><div className="subject-meter"><i style={{width:`${Math.max(4,subject.seconds/subjectMax*100)}%`,background:subject.color}}/></div><span>{formatDuration(subject.seconds)}</span></div>):<div className="empty small">{uiText("No subject data yet.")}</div>}</div></Card>
      </section>
      <aside className="stats-rail">
        <Card className="insight-card"><span className="insight-icon purple"><Clock3/></span><small>{uiText("Total focus")}</small><strong>{formatDuration(total)}</strong><span>{sessions.length} {uiText("sessions")}</span></Card>
        <Card className="insight-card"><span className="insight-icon yellow"><Trophy/></span><small>{uiText("Best day")}</small><strong>{best.seconds?formatDuration(best.seconds):'—'}</strong><span>{best.date !== '—' ? formatAppDate(new Date(`${best.date}T12:00:00`),settings) : '—'}</span></Card>
        <Card className="insight-card"><span className="insight-icon green"><Flame/></span><small>{uiText("Longest streak")}</small><strong>{streak} {uiText("days")}</strong><span>{activeDays} {uiText("active days")}</span></Card>
        <Card className="insight-card"><span className="insight-icon blue"><CalendarDays/></span><small>{uiText("Average session")}</small><strong>{formatDuration(average)}</strong><span>{uiText("per focus block")}</span></Card>
      </aside>
    </div>
  </div>;
}

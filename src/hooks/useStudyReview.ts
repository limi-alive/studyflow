import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';

function startOfWeek(date:Date){const d=new Date(date);d.setHours(0,0,0,0);const day=d.getDay();const offset=(day+6)%7;d.setDate(d.getDate()-offset);return d;}
function startOfMonth(date:Date){return new Date(date.getFullYear(),date.getMonth(),1);}

export function useStudyReview(userId:string){
  const sessionsQuery=useLiveQuery(()=>db.sessions.where('userId').equals(userId).filter(row=>!row.deletedAt).toArray(),[userId]);
  const subjectsQuery=useLiveQuery(()=>db.subjects.where('userId').equals(userId).toArray(),[userId]);
  const sessions=useMemo(()=>sessionsQuery??[],[sessionsQuery]);
  const subjects=useMemo(()=>subjectsQuery??[],[subjectsQuery]);
  return useMemo(()=>{
    const now=new Date();const weekStart=startOfWeek(now);const prevStart=new Date(weekStart);prevStart.setDate(prevStart.getDate()-7);const monthStart=startOfMonth(now);
    const week=sessions.filter(s=>new Date(s.endTime).getTime()>=weekStart.getTime());
    const previous=sessions.filter(s=>{const t=new Date(s.endTime).getTime();return t>=prevStart.getTime()&&t<weekStart.getTime();});
    const month=sessions.filter(s=>new Date(s.endTime).getTime()>=monthStart.getTime());
    const sum=(rows:typeof sessions)=>rows.reduce((a,b)=>a+Math.max(0,b.studySeconds||0),0);
    const weekSeconds=sum(week);const previousSeconds=sum(previous);const monthSeconds=sum(month);
    const weeklyDelta=previousSeconds>0?Math.round((weekSeconds-previousSeconds)/previousSeconds*100):weekSeconds>0?100:0;
    const dayTotals=new Map<string,number>();month.forEach(s=>{const key=new Date(s.endTime).toLocaleDateString('en-CA');dayTotals.set(key,(dayTotals.get(key)??0)+s.studySeconds);});
    const bestDay=[...dayTotals.entries()].sort((a,b)=>b[1]-a[1])[0];
    const subjectTotals=new Map<string,number>();month.forEach(s=>subjectTotals.set(s.subjectId??'none',(subjectTotals.get(s.subjectId??'none')??0)+s.studySeconds));
    const topSubjectId=[...subjectTotals.entries()].sort((a,b)=>b[1]-a[1])[0]?.[0];
    const topSubject=subjects.find(s=>s.id===topSubjectId)?.name??'—';
    const hourTotals=new Map<number,number>();month.forEach(s=>{const h=new Date(s.startTime).getHours();hourTotals.set(h,(hourTotals.get(h)??0)+s.studySeconds);});
    const bestHour=[...hourTotals.entries()].sort((a,b)=>b[1]-a[1])[0]?.[0];
    return {weekSeconds,previousSeconds,weeklyDelta,weekSessions:week.length,monthSeconds,monthSessions:month.length,bestDay:bestDay?.[0]??'—',topSubject,bestHour:bestHour===undefined?'—':`${String(bestHour).padStart(2,'0')}:00`};
  },[sessions,subjects]);
}

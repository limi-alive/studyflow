import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { useFocusProgress } from './useFocusProgress';

export type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  target: number;
  unit: string;
};

function streakDays(sessions: Array<{startTime:string;studySeconds:number}>) {
  const days = new Set(sessions.filter(s=>s.studySeconds>=60).map(s=>new Date(s.startTime).toLocaleDateString('en-CA')));
  const now = new Date();
  const key=(offset:number)=>{const d=new Date(now);d.setHours(12,0,0,0);d.setDate(d.getDate()+offset);return d.toLocaleDateString('en-CA');};
  let cursor=days.has(key(0))?0:days.has(key(-1))?-1:-999;if(cursor===-999)return 0;let streak=0;while(days.has(key(cursor))){streak++;cursor--;}return streak;
}

export function useAchievements(userId: string) {
  const rowsQuery = useLiveQuery(() => db.sessions.where('userId').equals(userId).filter(row => !row.deletedAt).toArray(), [userId]);
  const rows = useMemo(() => rowsQuery ?? [], [rowsQuery]);
  const focus = useFocusProgress(userId);
  return useMemo(() => {
    const totalSeconds = rows.reduce((sum,row)=>sum+Math.max(0,row.studySeconds||0),0);
    const totalHours = totalSeconds / 3600;
    const streak = streakDays(rows);
    const deep = rows.filter(row=>row.timerType==='deep-focus' && row.studySeconds>=25*60).length;
    const early = rows.filter(row=>new Date(row.startTime).getHours()<8 && row.studySeconds>=20*60).length;
    const night = rows.filter(row=>new Date(row.startTime).getHours()>=22 && row.studySeconds>=20*60).length;
    const perfect = focus.sessions.filter(item=>item.focusScore>=95).length;
    const definitions: Achievement[] = [
      {id:'first',title:'First Step',description:'Complete your first focus session.',icon:'✦',unlocked:rows.length>=1,progress:Math.min(rows.length,1),target:1,unit:'session'},
      {id:'10h',title:'Ten Hour Club',description:'Log 10 hours of focused study.',icon:'◷',unlocked:totalHours>=10,progress:Math.min(totalHours,10),target:10,unit:'h'},
      {id:'28h',title:'28 Hour Club',description:'Reach one monthly reward-sized block.',icon:'₮',unlocked:totalHours>=28,progress:Math.min(totalHours,28),target:28,unit:'h'},
      {id:'50h',title:'Fifty Strong',description:'Log 50 total study hours.',icon:'◆',unlocked:totalHours>=50,progress:Math.min(totalHours,50),target:50,unit:'h'},
      {id:'100h',title:'Century Focus',description:'Cross 100 focused hours.',icon:'★',unlocked:totalHours>=100,progress:Math.min(totalHours,100),target:100,unit:'h'},
      {id:'streak7',title:'Seven Day Flame',description:'Study seven days in a row.',icon:'🔥',unlocked:streak>=7,progress:Math.min(streak,7),target:7,unit:'days'},
      {id:'streak30',title:'Unbreakable',description:'Build a 30-day study streak.',icon:'⚡',unlocked:streak>=30,progress:Math.min(streak,30),target:30,unit:'days'},
      {id:'deep',title:'Deep Diver',description:'Finish a 25+ minute Deep Focus session.',icon:'◎',unlocked:deep>=1,progress:Math.min(deep,1),target:1,unit:'session'},
      {id:'early',title:'Early Bird',description:'Study 20+ minutes before 8 AM.',icon:'☀',unlocked:early>=1,progress:Math.min(early,1),target:1,unit:'session'},
      {id:'night',title:'Night Owl',description:'Study 20+ minutes after 10 PM.',icon:'☾',unlocked:night>=1,progress:Math.min(night,1),target:1,unit:'session'},
      {id:'focus95',title:'Locked In',description:'Earn a Focus Score of 95 or above.',icon:'◉',unlocked:perfect>=1,progress:Math.min(perfect,1),target:1,unit:'session'}
    ];
    return {
      achievements: definitions,
      unlocked: definitions.filter(item=>item.unlocked),
      unlockedCount: definitions.filter(item=>item.unlocked).length,
      totalCount: definitions.length,
      totalHours,
      streak
    };
  }, [rows, focus.sessions]);
}

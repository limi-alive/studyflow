import { describe, expect, it } from 'vitest';
import { buildStudyOS, daysUntil, sessionDays } from './studyOS';
import type { Exam, StudySession, StudyTask, Subject } from '../types';
const now = new Date(2026, 9, 30, 12);
const base = {userId:'a',createdAt:now.toISOString(),updatedAt:now.toISOString(),syncStatus:'synced' as const};
const subject: Subject={...base,id:'math',name:'ریاضی',color:'#aaa',priority:2,archived:false};
const task=(id:string,deadline?:string,subjectId:string|null='math'):StudyTask=>({...base,id,subjectId,title:id,status:'todo',priority:2,estimatedMinutes:60,deadline:deadline??null});
const session=(id:string,start:Date,end:Date,seconds:number,userId='a'):StudySession=>({...base,userId,id,subjectId:'math',startTime:start.toISOString(),endTime:end.toISOString(),studySeconds:seconds,breakSeconds:0,pauseSeconds:0,timerType:'stopwatch',deviceId:'phone'});
const defaults={userId:'a',tasks:[] as StudyTask[],subjects:[subject],exams:[] as Exam[],sessions:[] as StudySession[],now,capacityMinutes:45};

describe('StudyOS planning engine',()=>{
  it('prioritises overdue tasks and respects available minutes',()=>{
    const out=buildStudyOS({...defaults,tasks:[task('later','2026-12-01T18:00:00'),task('overdue','2026-10-28T18:00:00')]});
    expect(out.plan[0].taskId).toBe('overdue');
    expect(out.allocated).toBeLessThanOrEqual(45);
    expect(out.allocated).toBe(45);
  });
  it('isolates other accounts and completed tasks',()=>{
    const out=buildStudyOS({...defaults,tasks:[{...task('done'),status:'completed'},task('open')]});
    expect(out.plan.some(x=>x.taskId==='done')).toBe(false);
    expect(out.plan.some(x=>x.taskId==='open')).toBe(true);
    const crossAccount=buildStudyOS({...defaults,tasks:[{...task('intruder'),userId:'b'}],subjects:[{...subject,userId:'b'}]});
    expect(crossAccount.plan.length).toBe(0);
  });
  it('does not mutate input entities',()=>{
    const tasks=[task('a')];
    const before=JSON.stringify(tasks);
    buildStudyOS({...defaults,tasks});
    expect(JSON.stringify(tasks)).toBe(before);
  });
  it('explains exam workload from subject study and remaining target',()=>{
    const exam:Exam={...base,id:'exam',subjectId:'math',name:'فیزیک',date:'2026-11-02T09:00:00',priority:1,targetHours:2};
    const out=buildStudyOS({...defaults,exams:[exam],sessions:[session('s',new Date(2026,9,29,11),new Date(2026,9,29,12),3600)]});
    expect(out.upcoming[0].studiedMinutes).toBe(60);
    expect(out.upcoming[0].remainingMinutes).toBe(60);
    expect(out.upcoming[0].dailyMinutes).toBe(20);
  });
  it('suggests overdue subject review without claiming knowledge retention',()=>{
    const old=session('old',new Date(2026,9,20,11),new Date(2026,9,20,12),3600);
    const out=buildStudyOS({...defaults,sessions:[old]});
    expect(out.plan[0].kind).toBe('review');
  });
  it('does not suggest immediate review for freshly studied subjects',()=>{
    const recent=session('recent',new Date(2026,9,29,11),new Date(2026,9,29,12),3600);
    expect(buildStudyOS({...defaults,sessions:[recent]}).plan.some(x=>x.kind==='review')).toBe(false);
  });
  it('splits a real session at local midnight without double-counting focus seconds',()=>{
    const s=session('midnight',new Date(2026,9,29,23,45),new Date(2026,9,30,0,15),1500);
    const values=sessionDays([s],now,2);
    expect(values).toEqual([750,750]);
  });
  it('handles Nowruz and local daylight boundaries using calendar days',()=>{
    expect(daysUntil('2027-03-21T12:00:00',new Date(2027,2,20,12))).toBe(1);
    expect(daysUntil('2027-03-20T12:00:00',new Date(2027,2,21,12))).toBe(-1);
  });
  it('does not count deleted sessions or deleted tasks',()=>{
    const s={...session('deleted',new Date(2026,9,29,11),new Date(2026,9,29,12),3600),deletedAt:now.toISOString()};
    const t={...task('deleted-task'),deletedAt:now.toISOString()};
    const out=buildStudyOS({...defaults,tasks:[t],sessions:[s]});
    expect(out.weeklySeconds).toBe(0);
    expect(out.plan.some(x=>x.taskId==='deleted-task')).toBe(false);
  });
});

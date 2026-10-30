import { describe, expect, it } from 'vitest';
import type { Exam, StudySession, StudyTask, Subject } from '../types';
import { anonymousCoachContext, buildCoachSnapshot } from './studyCoach';

const now=new Date(2026,9,30,12);
const base={userId:'alice',createdAt:now.toISOString(),updatedAt:now.toISOString(),syncStatus:'synced' as const};
const mkTask=(id:string,override:Partial<StudyTask>={}):StudyTask=>({ ...base,id,title:`Task ${id}`,priority:2,estimatedMinutes:25,subjectId:'subject-1',status:'todo',...override });
const mkSubject=(id:string,override:Partial<Subject>={}):Subject=>({...base,id,name:`Subject ${id}`,color:'#123',priority:1,archived:false,...override});
const mkExam=(id:string,override:Partial<Exam>={}):Exam=>({...base,id,name:`Exam ${id}`,date:new Date(2026,10,2,11).toISOString(),targetHours:10,priority:1,...override});
const mkSession=(id:string,override:Partial<StudySession>={}):StudySession=>({...base,id,subjectId:'subject-1',deviceId:'phone',startTime:new Date(2026,9,29,9).toISOString(),endTime:new Date(2026,9,29,10).toISOString(),studySeconds:1800,breakSeconds:0,pauseSeconds:0,timerType:'pomodoro',...override});
const input=()=>({userId:'alice',tasks:[mkTask('one')],subjects:[mkSubject('subject-1')],sessions:[mkSession('one')],exams:[mkExam('one')],now,capacityMinutes:90,language:'fa' as const});

describe('free private Study Coach',()=>{
  it('suggests a real task with actionable focus length',()=>{const result=buildCoachSnapshot(input());expect(result.plan[0].taskId).toBe('one');expect(result.responses.next.body).toContain('Task one');expect(result.allocated).toBeLessThanOrEqual(90);});
  it('never reads other users tasks, exams or sessions',()=>{const data=input();data.tasks.push(mkTask('private',{userId:'bob',title:'SECRET OTHER USER'}));data.sessions.push(mkSession('private',{userId:'bob',studySeconds:100000}));data.exams.push(mkExam('private',{userId:'bob',name:'SECRET EXAM'}));const result=buildCoachSnapshot(data);expect(JSON.stringify(result)).not.toContain('SECRET');expect(result.weeklyMinutes).toBe(30);});
  it('excludes deleted and completed records',()=>{const data=input();data.tasks=[mkTask('deleted',{deletedAt:now.toISOString()}),mkTask('done',{status:'completed'})];data.subjects=[];data.sessions=[mkSession('deleted',{deletedAt:now.toISOString()})];const result=buildCoachSnapshot(data);expect(result.plan).toHaveLength(0);expect(result.weeklyMinutes).toBe(0);});
  it('provides a neutral empty-state without inventing performance',()=>{const data=input();data.tasks=[];data.subjects=[];data.sessions=[];data.exams=[];const result=buildCoachSnapshot(data);expect(result.activeDays).toBe(0);expect(result.responses.exam.body).toContain('ثبت نشده');expect(result.responses.next.body).toContain('هنوز');});
  it('makes capacity-adjustable plans and keeps outputs in English',()=>{const result=buildCoachSnapshot({...input(),capacityMinutes:45,language:'en'});expect(result.capacity).toBe(45);expect(result.allocated).toBeLessThanOrEqual(45);expect(result.responses.plan.body).toContain('capacity');});
  it('limits optional on-device AI context to anonymous aggregate figures',()=>{const result=buildCoachSnapshot(input());const context=anonymousCoachContext(result);expect(context).not.toContain('Task one');expect(context).not.toContain('alice');expect(context).toContain('last 7 local days');});
  it('does not count future study as a past-7-days achievement',()=>{const data=input();data.sessions=[mkSession('future',{startTime:new Date(2026,10,2,9).toISOString(),endTime:new Date(2026,10,2,10).toISOString()})];const result=buildCoachSnapshot(data);expect(result.weeklyMinutes).toBe(0);});
});

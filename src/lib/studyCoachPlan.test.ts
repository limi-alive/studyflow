import { describe, expect, it } from 'vitest';
import { buildCoachPlanTasks, coachPlanDeadline, parseCoachPlan, type CoachPlanItem } from './studyCoachPlan';

const study: CoachPlanItem = {kind:'study',title:'مرور فصل یک',subject:'ریاضی',minutes:50,date:'2026-10-31',startTime:'09:00',endTime:'09:50',notes:'تمرین'};
describe('AI Coach plan import safety',()=>{
  it('accepts validated study + break entries',()=>{
    const result = parseCoachPlan({tasks:[study,{...study,kind:'break',title:'استراحت',minutes:10}]});
    expect(result).toHaveLength(2);
  });
  it('rejects unexpected fields and times, without partial import',()=>{
    expect(()=>parseCoachPlan({tasks:[study,{...study,minutes:-1}]})).toThrow('invalid_plan');
    expect(()=>parseCoachPlan({tasks:[{...study,date:'2026-02-30'}]})).toThrow('invalid_plan');
    expect(()=>parseCoachPlan({tasks:[{...study,endTime:'24:01'}]})).toThrow('invalid_plan');
    expect(()=>parseCoachPlan({tasks:[{...study,kind:'break'}]})).toThrow('invalid_plan');
  });
  it('does not create study tasks for breaks',()=>{
    const rows = buildCoachPlanTasks([study,{...study,kind:'break',minutes:10}], 'user-a', []);
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe('todo');
    expect(rows[0].syncStatus).toBe('pending');
    expect(rows[0].estimatedMinutes).toBe(50);
  });
  it('accepts a weekly list of 14 items without truncation',()=>{
    const items=Array.from({length:14},(_,i)=>({...study,title:`Task ${i}`,date:'2026-11-01',startTime:null,endTime:null}));
    expect(parseCoachPlan({tasks:items})).toHaveLength(14);
    expect(coachPlanDeadline(items[0])).not.toBe(null);
    expect(new Date(coachPlanDeadline(items[0])!).getHours()).toBe(23);
  });
  it('uses a local deadline and refuses invalid wall times',()=>{
    expect(coachPlanDeadline({...study,date:null,startTime:null,endTime:null})).toBe(null);
    expect(new Date(coachPlanDeadline(study)!).getHours()).toBe(9);
  });
});

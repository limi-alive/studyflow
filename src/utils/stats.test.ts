import { describe, expect, it } from 'vitest';
import { averageSessionSeconds, totalStudySeconds } from './stats';
import type { StudySession } from '../types';
const base = { userId:'u', createdAt:'2026-01-01', updatedAt:'2026-01-01', syncStatus:'synced' as const, startTime:'2026-01-01', endTime:'2026-01-01', breakSeconds:0, pauseSeconds:0, timerType:'manual' as const, deviceId:'d' };
describe('statistics',()=>{
  const rows:StudySession[]=[{...base,id:'1',studySeconds:1200},{...base,id:'2',studySeconds:1800}];
  it('totals sessions',()=>expect(totalStudySeconds(rows)).toBe(3000));
  it('averages sessions',()=>expect(averageSessionSeconds(rows)).toBe(1500));
});

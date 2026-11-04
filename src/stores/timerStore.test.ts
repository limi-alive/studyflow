import {afterEach, describe, expect, it, vi} from 'vitest';
import {completedActiveSegments, creditableTimerSeconds} from '../utils/time';

const {data} = vi.hoisted(() => {
  const data = new Map<string,string>();
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{
    getItem:(key:string)=>data.get(key)??null,
    setItem:(key:string,value:string)=>{data.set(key,value);},
    removeItem:(key:string)=>{data.delete(key);}
  }});
  return {data};
});
vi.stubGlobal('crypto',{randomUUID:()=>`session-${Math.random()}`});

const {useTimerStore} = await import('./timerStore');
afterEach(()=>{useTimerStore.getState().clear();data.clear();vi.useRealTimers();});

describe('checkpoint persistence and exactly-once state transition',()=>{
  it('pauses at 120 minutes after a 24-hour suspension',()=>{
    vi.useFakeTimers();vi.setSystemTime(new Date('2026-01-01T10:00:00Z'));
    const store=useTimerStore.getState();
    store.start({userId:'alice',timerType:'stopwatch',checkpointSeconds:7200});
    const id=useTimerStore.getState().active?.id;
    store.start({userId:'alice',timerType:'stopwatch'});
    expect(useTimerStore.getState().active?.id).toBe(id);
    vi.setSystemTime(new Date('2026-01-02T10:00:00Z'));
    store.enforceCheckpoint();
    const paused=useTimerStore.getState().active!;
    expect(paused.awaitingConfirmation).toBe(true);
    expect(creditableTimerSeconds(paused)).toBe(7200);
    expect(paused.activeSegments).toEqual([{start:'2026-01-01T10:00:00.000Z',end:'2026-01-01T12:00:00.000Z'}]);
    store.resume();expect(useTimerStore.getState().active?.state).toBe('paused');
    store.confirmContinue();
    const continued=useTimerStore.getState().active!;
    expect(continued.nextCheckpointSeconds).toBe(14400);
    expect(continued.segmentStartedAt).toBe('2026-01-02T10:00:00.000Z');
    vi.setSystemTime(new Date('2026-01-03T10:00:00Z'));
    store.enforceCheckpoint();
    expect(creditableTimerSeconds(useTimerStore.getState().active!)).toBe(14400);
  });
  it('keeps paused time out of intervals and adjustment truncates verified work',()=>{
    vi.useFakeTimers();vi.setSystemTime(new Date('2026-01-01T10:00:00Z'));
    const store=useTimerStore.getState();store.start({userId:'alice',timerType:'stopwatch',checkpointSeconds:7200});
    vi.setSystemTime(new Date('2026-01-01T10:30:00Z'));store.pause();
    vi.setSystemTime(new Date('2026-01-01T11:30:00Z'));store.resume();
    vi.setSystemTime(new Date('2026-01-01T13:00:00Z'));store.enforceCheckpoint();
    const active=useTimerStore.getState().active!;
    expect(creditableTimerSeconds(active)).toBe(7200);
    expect(completedActiveSegments(active,active.pausedAt!,3600)).toEqual([
      {start:'2026-01-01T10:00:00.000Z',end:'2026-01-01T10:30:00.000Z'},
      {start:'2026-01-01T11:30:00.000Z',end:'2026-01-01T12:00:00.000Z'}
    ]);
  });
});

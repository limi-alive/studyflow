import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ActiveTimer, TimerType } from '../types';

type StartArgs = { userId: string; subjectId?: string | null; topicId?: string | null; taskId?: string | null; timerType: TimerType; durationSeconds?: number | null };
type TimerStore = {
  active: ActiveTimer | null;
  start: (args: StartArgs) => void;
  pause: () => void;
  resume: () => void;
  addTime: (seconds: number) => void;
  restart: () => void;
  clear: () => void;
};

export const useTimerStore = create<TimerStore>()(persist((set, get) => ({
  active: null,
  start: (args) => set({ active: { id: crypto.randomUUID(), ...args, startedAt: new Date().toISOString(), pausedAt: null, totalPausedMs: 0, state: 'running' } }),
  pause: () => { const a=get().active;if(!a||a.state!=='running')return;set({active:{...a,state:'paused',pausedAt:new Date().toISOString()}}); },
  resume: () => { const a=get().active;if(!a||a.state!=='paused'||!a.pausedAt)return;const added=Date.now()-new Date(a.pausedAt).getTime();set({active:{...a,state:'running',pausedAt:null,totalPausedMs:a.totalPausedMs+added}}); },
  addTime: (seconds) => { const a=get().active;if(!a)return;set({active:{...a,durationSeconds:(a.durationSeconds??0)+Math.max(0,seconds)}}); },
  restart: () => { const a=get().active;if(!a)return;set({active:{...a,id:crypto.randomUUID(),startedAt:new Date().toISOString(),pausedAt:null,totalPausedMs:0,state:'running'}}); },
  clear: () => set({ active: null })
}), { name: 'studyflow.activeTimer' }));

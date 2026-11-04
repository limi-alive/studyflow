import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ActiveTimer, TimerType } from '../types';
import { checkpointLimit, checkpointPauseAt, creditableTimerSeconds } from '../utils/time';

type StartArgs = { userId: string; subjectId?: string | null; topicId?: string | null; taskId?: string | null; timerType: TimerType; durationSeconds?: number | null; checkpointSeconds?: number };
type TimerStore = {
  active: ActiveTimer | null;
  start: (args: StartArgs) => void;
  pause: () => void;
  resume: () => void;
  confirmContinue: () => void;
  enforceCheckpoint: () => void;
  addTime: (seconds: number) => void;
  restart: () => void;
  clear: () => void;
};

export const useTimerStore = create<TimerStore>()(persist((set, get) => ({
  active: null,
  start: (args) => { if (get().active) return; set({ active: { id: crypto.randomUUID(), ...args, startedAt: new Date().toISOString(), pausedAt: null, totalPausedMs: 0, state: 'running' } }); },
  enforceCheckpoint: () => { const a=get().active;if(!a||a.state!=='running'||creditableTimerSeconds(a)<checkpointLimit(a))return;set({active:{...a,state:'paused',pausedAt:checkpointPauseAt(a),awaitingConfirmation:true}}); },
  pause: () => { get().enforceCheckpoint(); const a=get().active;if(!a||a.state!=='running')return;set({active:{...a,state:'paused',pausedAt:new Date().toISOString()}}); },
  resume: () => { const a=get().active;if(!a||a.state!=='paused'||!a.pausedAt||a.awaitingConfirmation)return;const added=Math.max(0,Date.now()-new Date(a.pausedAt).getTime());set({active:{...a,state:'running',pausedAt:null,totalPausedMs:a.totalPausedMs+added}}); },
  confirmContinue: () => { const a=get().active;if(!a?.awaitingConfirmation||!a.pausedAt)return;const added=Math.max(0,Date.now()-new Date(a.pausedAt).getTime());set({active:{...a,state:'running',pausedAt:null,totalPausedMs:a.totalPausedMs+added,awaitingConfirmation:false,nextCheckpointSeconds:checkpointLimit(a)+(a.checkpointSeconds??7200)}}); },
  addTime: (seconds) => { const a=get().active;if(!a)return;set({active:{...a,durationSeconds:(a.durationSeconds??0)+Math.max(0,seconds)}}); },
  restart: () => { const a=get().active;if(!a)return;set({active:{...a,id:crypto.randomUUID(),startedAt:new Date().toISOString(),pausedAt:null,totalPausedMs:0,state:'running',awaitingConfirmation:false,nextCheckpointSeconds:undefined}}); },
  clear: () => set({ active: null })
}), { name: 'studyflow.activeTimer' }));

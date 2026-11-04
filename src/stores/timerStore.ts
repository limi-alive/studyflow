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
  start: (args) => { if (get().active) return; const now=new Date().toISOString();set({ active: { id: crypto.randomUUID(), ...args, startedAt: now, segmentStartedAt: now, activeSegments: [], pausedAt: null, totalPausedMs: 0, state: 'running' } }); },
  enforceCheckpoint: () => { const a=get().active;if(!a||a.state!=='running'||creditableTimerSeconds(a)<checkpointLimit(a))return;const at=checkpointPauseAt(a);set({active:{...a,state:'paused',pausedAt:at,segmentStartedAt:null,activeSegments:a.activeSegments && a.segmentStartedAt && Date.parse(at)>Date.parse(a.segmentStartedAt) ? [...a.activeSegments,{start:a.segmentStartedAt,end:at}] : a.activeSegments,awaitingConfirmation:true}}); },
  pause: () => { get().enforceCheckpoint(); const a=get().active;if(!a||a.state!=='running')return;const at=new Date().toISOString();set({active:{...a,state:'paused',pausedAt:at,segmentStartedAt:null,activeSegments:a.activeSegments && a.segmentStartedAt && Date.parse(at)>Date.parse(a.segmentStartedAt) ? [...a.activeSegments,{start:a.segmentStartedAt,end:at}] : a.activeSegments}}); },
  resume: () => { const a=get().active;if(!a||a.state!=='paused'||!a.pausedAt||a.awaitingConfirmation)return;const now=new Date().toISOString();const added=Math.max(0,Date.parse(now)-Date.parse(a.pausedAt));set({active:{...a,state:'running',pausedAt:null,segmentStartedAt:a.activeSegments?now:undefined,totalPausedMs:a.totalPausedMs+added}}); },
  confirmContinue: () => { const a=get().active;if(!a?.awaitingConfirmation||!a.pausedAt)return;const now=new Date().toISOString();const added=Math.max(0,Date.parse(now)-Date.parse(a.pausedAt));set({active:{...a,state:'running',pausedAt:null,segmentStartedAt:a.activeSegments?now:undefined,totalPausedMs:a.totalPausedMs+added,awaitingConfirmation:false,nextCheckpointSeconds:checkpointLimit(a)+(a.checkpointSeconds??7200)}}); },
  addTime: (seconds) => { const a=get().active;if(!a)return;set({active:{...a,durationSeconds:(a.durationSeconds??0)+Math.max(0,seconds)}}); },
  restart: () => { const a=get().active;if(!a)return;set({active:{...a,id:crypto.randomUUID(),startedAt:new Date().toISOString(),pausedAt:null,totalPausedMs:0,state:'running',awaitingConfirmation:false,nextCheckpointSeconds:undefined,activeSegments:[],segmentStartedAt:new Date().toISOString()}}); },
  clear: () => set({ active: null })
}), { name: 'studyflow.activeTimer' }));

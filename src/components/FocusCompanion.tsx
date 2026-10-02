import { useEffect, useMemo, useRef } from 'react';
import { useRive } from '@rive-app/react-canvas';
import type { CompanionMotion, FocusCompanionId } from '../hooks/useCompanionPreferences';
import { companionMeta, type CompanionMeta } from './companionMeta';

export type CompanionState = 'idle' | 'running' | 'paused' | 'celebrate';

type Props = {
  variant: FocusCompanionId;
  state: CompanionState;
  motion?: CompanionMotion;
  intro?: boolean;
  subject?: string;
  preview?: boolean;
};

type RuntimeInput = { name:string; value?:boolean|number; fire?:()=>void };

function normalized(value:string){ return value.toLowerCase().replace(/[^a-z0-9]+/g,' '); }
function matches(name:string, words:string[]){ const key=normalized(name); return words.some(word=>key.includes(word)); }

function applyState(rive: NonNullable<ReturnType<typeof useRive>['rive']>, state: CompanionState) {
  const machine = rive.stateMachineNames?.[0];
  if (machine && !(rive.playingStateMachineNames ?? []).includes(machine)) {
    rive.reset({ stateMachines:[machine], autoplay:true });
  }

  const activeMachine = rive.stateMachineNames?.[0];
  const inputs = activeMachine ? (rive.stateMachineInputs(activeMachine) as unknown as RuntimeInput[] | undefined) ?? [] : [];
  const runWords = ['active','focus','dance','happy','check','look','awake','play','on'];
  const pauseWords = ['pause','sleep','sad','hands up','rest','stop','off'];
  const successWords = ['success','celebrate','win','happy','jump','done','complete','dance'];

  inputs.forEach(input => {
    if (typeof input.value === 'boolean') {
      if (state === 'running') input.value = matches(input.name,runWords) && !matches(input.name,pauseWords);
      else if (state === 'paused') input.value = matches(input.name,pauseWords);
      else if (state === 'celebrate') input.value = matches(input.name,successWords);
      else input.value = false;
    } else if (typeof input.value === 'number') {
      if (matches(input.name,['look','x','horizontal'])) input.value = state === 'running' ? 60 : 0;
      else if (matches(input.name,['y','vertical'])) input.value = state === 'running' ? 25 : 0;
      else if (matches(input.name,['mood','expression','state'])) input.value = state === 'celebrate' ? 100 : state === 'running' ? 65 : state === 'paused' ? 20 : 40;
    }
  });

  if (state === 'celebrate') inputs.filter(input=>input.fire && matches(input.name,successWords)).forEach(input=>input.fire?.());
  if (state === 'paused') rive.pause(); else rive.play();
}

function RiveScene({meta,state,reducedMotion}:{meta:CompanionMeta;state:CompanionState;reducedMotion:boolean}) {
  const last = useRef<CompanionState | null>(null);
  const config = useMemo(() => ({ src:meta.runtimeUrl, autoplay:true }), [meta.runtimeUrl]);
  const { rive, RiveComponent } = useRive(config);

  useEffect(() => {
    if (!rive) return;
    if (reducedMotion) { rive.pause(); return; }
    if (last.current !== state) {
      last.current = state;
      applyState(rive,state);
    } else if (state !== 'paused') rive.play();
  }, [rive,state,reducedMotion]);

  return <div className="premium-rive-stage" style={{'--companion-accent':meta.accent} as React.CSSProperties}>
    <div className="premium-rive-orbit" aria-hidden="true"><i/><i/><i/></div>
    <RiveComponent className="premium-rive-canvas" aria-label={`${meta.name} focus companion`}/>
  </div>;
}

export function FocusCompanion({variant,state,motion='balanced',intro=false,subject,preview=false}:Props){
  const meta = companionMeta.find(item=>item.id===variant) ?? companionMeta[0];
  const reducedMotion = typeof document !== 'undefined' && document.documentElement.classList.contains('reduce-motion');
  const caption = state==='running'
    ? `${meta.name} is locked in${subject ? ` · ${subject}` : ''}`
    : state==='paused'
      ? `${meta.name} is waiting`
      : state==='celebrate'
        ? `${meta.name} says: nailed it`
        : `${meta.name} is ready`;

  return <div className={`focus-companion premium-companion variant-${variant} state-${state} motion-${motion} ${intro?'companion-intro':''} ${preview?'companion-preview':''}`}>
    <div className="premium-companion-glow" style={{'--companion-accent':meta.accent} as React.CSSProperties}/>
    <RiveScene key={variant} meta={meta} state={state} reducedMotion={reducedMotion}/>
    {!preview && <div className="companion-caption premium-caption"><span className="companion-status-dot"/>{caption}</div>}
  </div>;
}

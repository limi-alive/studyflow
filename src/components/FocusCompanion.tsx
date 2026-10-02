import { useRef, type CSSProperties, type PointerEvent } from 'react';
import type { CompanionMotion, FocusCompanionId } from '../hooks/useCompanionPreferences';
import { companionMeta } from './companionMeta';
import { KuromiCompanion } from './characterCompanions/KuromiCompanion';
import { ButtercupCompanion } from './characterCompanions/ButtercupCompanion';
import { TomJerryCompanion } from './characterCompanions/TomJerryCompanion';

export type CompanionState = 'idle' | 'running' | 'paused' | 'celebrate';

type Props = {
  variant: FocusCompanionId;
  state: CompanionState;
  motion?: CompanionMotion;
  intro?: boolean;
  subject?: string;
  preview?: boolean;
};

export function FocusCompanion({variant,state,motion='balanced',intro=false,subject,preview=false}:Props){
  const rootRef = useRef<HTMLDivElement>(null);
  const meta = companionMeta.find(item=>item.id===variant) ?? companionMeta[0];
  const caption = state==='running'
    ? `${meta.name} is studying${subject ? ` · ${subject}` : ''}`
    : state==='paused'
      ? `${meta.name} is waiting`
      : state==='celebrate'
        ? `${meta.name}: session complete!`
        : `${meta.name} is ready`;

  const scene = variant==='buttercup'
    ? <ButtercupCompanion state={state} motion={motion} preview={preview}/>
    : variant==='tom-jerry'
      ? <TomJerryCompanion state={state} motion={motion} preview={preview}/>
      : <KuromiCompanion state={state} motion={motion} preview={preview}/>;

  const setPointerVars = (event: PointerEvent<HTMLDivElement>) => {
    const root = rootRef.current;
    if (!root) return;
    const box = root.getBoundingClientRect();
    const x = Math.max(-1, Math.min(1, ((event.clientX - box.left) / box.width - .5) * 2));
    const y = Math.max(-1, Math.min(1, ((event.clientY - box.top) / box.height - .5) * 2));
    root.style.setProperty('--scene-x', `${(x * 5).toFixed(2)}px`);
    root.style.setProperty('--scene-y', `${(y * 3).toFixed(2)}px`);
    root.style.setProperty('--scene-tilt-x', `${(x * 2.1).toFixed(2)}deg`);
    root.style.setProperty('--scene-tilt-y', `${(-y * 1.7).toFixed(2)}deg`);
    root.style.setProperty('--eye-x', `${(x * 2.6).toFixed(2)}px`);
    root.style.setProperty('--eye-y', `${(y * 1.7).toFixed(2)}px`);
    root.style.setProperty('--light-x', `${(50 + x * 18).toFixed(1)}%`);
    root.style.setProperty('--light-y', `${(42 + y * 12).toFixed(1)}%`);
  };

  const resetPointerVars = () => {
    const root = rootRef.current;
    if (!root) return;
    root.style.setProperty('--scene-x','0px');
    root.style.setProperty('--scene-y','0px');
    root.style.setProperty('--scene-tilt-x','0deg');
    root.style.setProperty('--scene-tilt-y','0deg');
    root.style.setProperty('--eye-x','0px');
    root.style.setProperty('--eye-y','0px');
    root.style.setProperty('--light-x','50%');
    root.style.setProperty('--light-y','42%');
  };

  return <div
    ref={rootRef}
    className={`focus-companion exact-character-companion variant-${variant} state-${state} motion-${motion} ${intro?'companion-intro':''} ${preview?'companion-preview':''}`}
    style={{'--companion-accent':meta.accent} as CSSProperties}
    onPointerMove={setPointerVars}
    onPointerLeave={resetPointerVars}
  >
    <div className="character-glow" aria-hidden="true"/>
    <div className="companion-ambient" aria-hidden="true">
      <span/><span/><span/><span/><span/><span/>
    </div>
    <div className="companion-orbit orbit-one" aria-hidden="true"/>
    <div className="companion-orbit orbit-two" aria-hidden="true"/>
    <div className="companion-floor-shadow" aria-hidden="true"/>
    {scene}
    {!preview && <div className="companion-caption exact-caption"><span className="companion-status-dot"/>{caption}</div>}
  </div>;
}

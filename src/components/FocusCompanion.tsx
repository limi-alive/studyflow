import type { CSSProperties } from 'react';
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

  return <div className={`focus-companion exact-character-companion variant-${variant} state-${state} motion-${motion} ${intro?'companion-intro':''} ${preview?'companion-preview':''}`} style={{'--companion-accent':meta.accent} as CSSProperties}>
    <div className="character-glow" aria-hidden="true"/>
    {scene}
    {!preview && <div className="companion-caption exact-caption"><span className="companion-status-dot"/>{caption}</div>}
  </div>;
}

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

type RuntimeInput = {
  name: string;
  value?: boolean | number;
  fire?: () => void;
};

function setInput(inputs: RuntimeInput[], name: string, value: boolean | number) {
  const input = inputs.find(item => item.name === name);
  if (!input || !('value' in input)) return;
  input.value = value;
}

function fireInput(inputs: RuntimeInput[], name: string) {
  const input = inputs.find(item => item.name === name);
  input?.fire?.();
}

function RiveCompanionScene({ meta, state, reducedMotion }:{meta:CompanionMeta;state:CompanionState;reducedMotion:boolean}) {
  const lastState = useRef<CompanionState | null>(null);
  const config = useMemo(() => ({
    src: meta.runtimeUrl,
    stateMachines: meta.stateMachine,
    autoplay: true,
    ...(meta.artboard ? { artboard: meta.artboard } : {})
  }), [meta]);
  const { rive, RiveComponent } = useRive(config);

  useEffect(() => {
    if (!rive) return;
    if (reducedMotion) {
      rive.pause();
      return;
    }

    const inputs = rive.stateMachineInputs(meta.stateMachine) as unknown as RuntimeInput[];
    const entered = lastState.current !== state;
    lastState.current = state;

    if (meta.id === 'dash') {
      setInput(inputs, 'dance', state === 'running' || state === 'celebrate');
      if (state === 'celebrate' && entered) fireInput(inputs, 'look up');
    }

    if (meta.id === 'teddy') {
      setInput(inputs, 'isChecking', state === 'running');
      setInput(inputs, 'isHandsUp', state === 'paused');
      setInput(inputs, 'numLook', state === 'running' ? 58 : 0);
      if (state === 'celebrate' && entered) fireInput(inputs, 'trigSuccess');
    }

    if (meta.id === 'avatar') {
      setInput(inputs, 'isHappy', state === 'running' || state === 'celebrate');
      setInput(inputs, 'isSad', false);
    }

    if (state === 'paused' && meta.id === 'star') rive.pause();
    else rive.play();
  }, [rive, meta, state, reducedMotion]);

  return <div className="rive-companion-canvas-wrap">
    <div className="rive-fallback" aria-hidden="true">{meta.emoji}</div>
    <RiveComponent className="rive-companion-canvas" aria-label={`${meta.name} animated focus companion`}/>
  </div>;
}

export function FocusCompanion({ variant, state, motion='balanced', intro=false, subject, preview=false }: Props) {
  const meta = companionMeta.find(item => item.id === variant) ?? companionMeta[0];
  const reducedMotion = typeof document !== 'undefined' && document.documentElement.classList.contains('reduce-motion');
  const caption = state === 'running'
    ? `${meta.name} is focusing${subject ? ` · ${subject}` : ''}`
    : state === 'paused'
      ? `${meta.name} is taking a breather`
      : state === 'celebrate'
        ? `${meta.name} says: nice work!`
        : `${meta.name} is ready`;

  return <div className={`focus-companion rive-companion variant-${variant} state-${state} motion-${motion} ${intro?'companion-intro':''} ${preview?'companion-preview':''}`}>
    <div className="companion-glow"/>
    <div className="companion-particles"><i/><i/><i/><i/><i/><i/></div>
    <RiveCompanionScene key={variant} meta={meta} state={state} reducedMotion={reducedMotion}/>
    {!preview && <div className="companion-caption"><span className="companion-status-dot"/>{caption}</div>}
  </div>;
}

import type { CompanionMotion, FocusCompanionId } from '../hooks/useCompanionPreferences';
import { companionMeta } from './companionMeta';

export type CompanionState = 'idle' | 'running' | 'paused' | 'celebrate';

type Props = {
  variant: FocusCompanionId;
  state: CompanionState;
  motion?: CompanionMotion;
  intro?: boolean;
  subject?: string;
  preview?: boolean;
};

function Bunni() {
  return <>
    <g className="companion-shadow"><ellipse cx="160" cy="196" rx="96" ry="12"/></g>
    <g className="companion-prop companion-lamp"><path d="M65 119V73"/><path d="M49 74c0-13 8-22 19-22s19 9 19 22z"/><circle cx="68" cy="75" r="4"/></g>
    <g className="companion-body">
      <path className="fill-soft outline" d="M118 128c-22 9-31 29-26 52h136c4-24-7-43-29-52z"/>
      <g className="companion-ear ear-left"><path className="fill-soft outline" d="M123 86c-12-37-2-67 14-65 14 2 16 37 9 68z"/><path className="fill-blush" d="M130 75c-6-23-1-41 6-41 7 1 8 23 4 42z"/></g>
      <g className="companion-ear ear-right"><path className="fill-soft outline" d="M177 87c6-37 27-62 41-54 13 8-1 40-20 62z"/><path className="fill-blush" d="M188 80c7-22 18-34 24-29 6 5-4 24-17 36z"/></g>
      <g className="companion-head"><path className="fill-cream outline" d="M107 103c0-32 23-53 53-53s54 21 54 53c0 34-23 57-54 57s-53-23-53-57z"/>
        <ellipse className="face-cheek" cx="130" cy="119" rx="11" ry="5"/><ellipse className="face-cheek" cx="190" cy="119" rx="11" ry="5"/>
        <g className="companion-eyes"><ellipse cx="137" cy="101" rx="5" ry="8"/><ellipse cx="183" cy="101" rx="5" ry="8"/></g>
        <circle className="fill-blush" cx="160" cy="111" r="4"/><path className="face-line" d="M153 121c5 5 10 5 15 0"/>
      </g>
      <g className="companion-arm arm-left"><path className="fill-cream outline" d="M113 148c-18-3-30 5-31 15-1 11 17 13 37 8z"/></g>
      <g className="companion-arm arm-right"><path className="fill-cream outline" d="M207 148c18-3 30 5 31 15 1 11-17 13-37 8z"/></g>
    </g>
    <g className="companion-desk"><rect x="52" y="168" width="216" height="35" rx="17"/><path d="M61 178h198"/></g>
    <g className="companion-book"><path d="M120 158h40c10 0 16 4 20 9 4-5 10-9 20-9h40v30h-49c-5 0-8 2-11 6-3-4-6-6-11-6h-49z"/><path d="M180 167v27"/></g>
    <g className="companion-cup"><circle cx="241" cy="160" r="9"/><path d="M249 157c9-2 10 11 1 11"/></g>
  </>;
}

function Mochi() {
  return <>
    <g className="companion-shadow"><ellipse cx="160" cy="196" rx="96" ry="12"/></g>
    <g className="companion-tail"><path className="fill-cat outline" d="M221 145c29-20 49-8 42 11-5 15-28 14-39 6 20 2 27-7 22-11-5-5-13 1-20 7z"/></g>
    <g className="companion-body"><path className="fill-cat outline" d="M111 126c-17 14-21 33-16 54h132c4-23-2-43-18-55z"/>
      <g className="companion-head"><path className="fill-cat outline" d="M105 103c0-32 23-54 55-54s56 22 56 54c0 35-24 57-56 57s-55-22-55-57z"/><path className="fill-cat outline" d="M112 68l9-34 25 22z"/><path className="fill-cat outline" d="M208 68l-9-34-25 22z"/><path className="fill-blush" d="M121 57l4-13 10 9z"/><path className="fill-blush" d="M199 57l-4-13-10 9z"/>
        <g className="companion-eyes"><ellipse cx="137" cy="103" rx="5" ry="8"/><ellipse cx="183" cy="103" rx="5" ry="8"/></g><ellipse className="face-cheek" cx="130" cy="120" rx="11" ry="5"/><ellipse className="face-cheek" cx="190" cy="120" rx="11" ry="5"/><path className="face-line" d="M155 115l5 4 5-4M160 119v5M152 125c4 4 12 4 16 0"/>
      </g>
      <g className="companion-arm arm-left"><ellipse className="fill-cream outline" cx="121" cy="164" rx="28" ry="15"/></g><g className="companion-arm arm-right"><ellipse className="fill-cream outline" cx="199" cy="164" rx="28" ry="15"/></g>
    </g>
    <g className="companion-desk"><rect x="52" y="168" width="216" height="35" rx="17"/><path d="M61 178h198"/></g><g className="companion-laptop"><path d="M126 145h68l-6 38h-56z"/><path d="M113 184h95"/><circle cx="160" cy="162" r="4"/></g><g className="companion-cup"><circle cx="235" cy="160" r="9"/><path d="M243 157c9-2 10 11 1 11"/></g>
  </>;
}

function Moss() {
  return <>
    <g className="companion-shadow"><ellipse cx="160" cy="198" rx="95" ry="11"/></g>
    <g className="companion-body"><path className="fill-frog outline" d="M101 130c5-37 27-61 59-61s54 24 59 61l10 48H91z"/>
      <g className="companion-head"><path className="fill-frog outline" d="M103 108c0-32 24-54 57-54s57 22 57 54c0 34-24 53-57 53s-57-19-57-53z"/><circle className="fill-frog outline" cx="126" cy="66" r="19"/><circle className="fill-frog outline" cx="194" cy="66" r="19"/><g className="companion-eyes"><circle cx="126" cy="66" r="7"/><circle cx="194" cy="66" r="7"/></g><ellipse className="face-cheek" cx="126" cy="122" rx="12" ry="5"/><ellipse className="face-cheek" cx="194" cy="122" rx="12" ry="5"/><path className="face-line" d="M146 116c9 7 19 7 28 0"/></g>
      <g className="companion-arm arm-left"><ellipse className="fill-frog-light outline" cx="118" cy="164" rx="29" ry="14"/></g><g className="companion-arm arm-right"><ellipse className="fill-frog-light outline" cx="202" cy="164" rx="29" ry="14"/></g>
    </g>
    <g className="companion-desk"><rect x="52" y="169" width="216" height="35" rx="17"/><path d="M61 179h198"/></g><g className="companion-tablet"><rect x="127" y="145" width="66" height="39" rx="8"/><line x1="141" y1="157" x2="180" y2="157"/><line x1="141" y1="166" x2="171" y2="166"/></g><g className="companion-plant"><path d="M236 169v-21"/><path className="fill-leaf" d="M236 154c-17-2-20-15-18-21 12 0 20 8 18 21z"/><path className="fill-leaf" d="M236 148c4-16 15-19 22-17-1 12-9 19-22 17z"/><path className="fill-pot outline" d="M224 163h25l-4 19h-17z"/></g>
  </>;
}

function Orbit() {
  return <>
    <g className="companion-space-stars"><circle cx="73" cy="80" r="2"/><circle cx="244" cy="58" r="2"/><circle cx="221" cy="117" r="1.6"/><path d="M62 118h12M68 112v12"/><path d="M249 99h10M254 94v10"/></g>
    <g className="companion-orbit-ring"><ellipse cx="160" cy="126" rx="92" ry="39"/></g>
    <g className="companion-body"><ellipse className="fill-suit outline" cx="160" cy="131" rx="59" ry="61"/><g className="companion-head"><circle className="fill-helmet outline" cx="160" cy="97" r="47"/><circle className="fill-visor" cx="160" cy="97" r="35"/><path className="visor-shine" d="M139 77c8-8 18-12 30-11"/><g className="companion-eyes"><circle cx="147" cy="100" r="4"/><circle cx="173" cy="100" r="4"/></g><path className="face-line light" d="M151 113c6 4 12 4 18 0"/></g><g className="companion-arm arm-left"><rect className="fill-suit outline" x="91" y="132" width="53" height="23" rx="12"/></g><g className="companion-arm arm-right"><rect className="fill-suit outline" x="176" y="132" width="53" height="23" rx="12"/></g><rect className="fill-panel outline" x="136" y="144" width="48" height="28" rx="8"/><circle className="panel-light one" cx="148" cy="156" r="3"/><circle className="panel-light two" cx="160" cy="156" r="3"/><circle className="panel-light three" cx="172" cy="156" r="3"/></g>
    <g className="companion-satellite"><circle cx="248" cy="139" r="8"/><ellipse cx="248" cy="139" rx="19" ry="7"/></g>
  </>;
}

function Character({variant}:{variant:FocusCompanionId}) {
  if (variant === 'mochi') return <Mochi/>;
  if (variant === 'moss') return <Moss/>;
  if (variant === 'orbit') return <Orbit/>;
  return <Bunni/>;
}

export function FocusCompanion({ variant, state, motion='balanced', intro=false, subject, preview=false }: Props) {
  const meta = companionMeta.find(item => item.id === variant) ?? companionMeta[0];
  const caption = state === 'running' ? `${meta.name} is focusing${subject ? ` · ${subject}` : ''}` : state === 'paused' ? `${meta.name} is waiting` : state === 'celebrate' ? `${meta.name} says: session complete!` : `${meta.name} is ready`;
  return <div className={`focus-companion variant-${variant} state-${state} motion-${motion} ${intro?'companion-intro':''} ${preview?'companion-preview':''}`} aria-hidden={preview ? 'true' : undefined}>
    <div className="companion-glow"/>
    <div className="companion-particles"><i/><i/><i/><i/><i/><i/></div>
    <svg viewBox="0 0 320 220" className="companion-svg" aria-label={preview ? undefined : `${meta.name} focus companion`} role={preview ? undefined : 'img'}>
      <Character variant={variant}/>
    </svg>
    {!preview && <div className="companion-caption"><span className="companion-status-dot"/>{caption}</div>}
  </div>;
}

import type { CompanionState } from '../FocusCompanion';
import type { CompanionMotion } from '../../hooks/useCompanionPreferences';

type Props = { state: CompanionState; motion: CompanionMotion; preview?: boolean };

export function ButtercupCompanion({state,motion,preview=false}:Props){
  return <div className={`character-stage buttercup-stage state-${state} motion-${motion} ${preview?'is-preview':''}`}>
    <svg viewBox="0 0 420 300" role="img" aria-label="Buttercup focus companion" className="character-svg">
      <defs>
        <filter id="butterGlow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <linearGradient id="greenTrail" x1="0" x2="1"><stop stopColor="#91ef6f" stopOpacity="0"/><stop offset="1" stopColor="#48c936" stopOpacity=".9"/></linearGradient>
      </defs>
      <g className="buttercup-energy"><ellipse cx="210" cy="162" rx="106" ry="74" fill="none" stroke="#5cd54a" strokeWidth="4" opacity=".22"/><ellipse cx="210" cy="162" rx="133" ry="94" fill="none" stroke="#5cd54a" strokeWidth="3" opacity=".11"/></g>
      <g className="buttercup-trails"><path d="M75 162C120 160 133 157 161 144" stroke="url(#greenTrail)" strokeWidth="12" strokeLinecap="round"/><path d="M83 184C124 178 142 170 164 157" stroke="url(#greenTrail)" strokeWidth="7" strokeLinecap="round" opacity=".7"/></g>
      <g className="buttercup-hero" filter="url(#butterGlow)">
        <circle cx="210" cy="126" r="68" fill="#f5cdbb" stroke="#151515" strokeWidth="5"/>
        <path d="M148 119 Q149 61 195 55 Q207 49 223 54 Q269 61 273 118 Q254 89 233 79 Q237 103 230 120 Q217 95 198 83 Q197 106 185 121 Q169 101 148 119Z" fill="#111"/>
        <path d="M147 119Q152 81 176 69Q159 101 164 123Z" fill="#111"/>
        <path d="M273 118Q268 79 245 69Q260 99 256 123Z" fill="#111"/>
        <g className="buttercup-eyes"><ellipse cx="178" cy="132" rx="25" ry="31" fill="#fff" stroke="#111" strokeWidth="4"/><ellipse cx="242" cy="132" rx="25" ry="31" fill="#fff" stroke="#111" strokeWidth="4"/><ellipse cx="182" cy="135" rx="15" ry="21" fill="#57c93f"/><ellipse cx="238" cy="135" rx="15" ry="21" fill="#57c93f"/><ellipse cx="186" cy="139" rx="8" ry="12" fill="#111"/><ellipse cx="234" cy="139" rx="8" ry="12" fill="#111"/><circle cx="190" cy="132" r="4" fill="#fff"/><circle cx="238" cy="132" r="4" fill="#fff"/></g>
        <path className="buttercup-mouth" d="M188 169Q210 181 232 169" fill="none" stroke="#111" strokeWidth="5" strokeLinecap="round"/>
        <g className="buttercup-body"><path d="M176 186Q210 175 244 186L250 229Q210 243 170 229Z" fill="#5bd244" stroke="#111" strokeWidth="5"/><rect x="172" y="204" width="76" height="13" fill="#111"/><rect x="200" y="183" width="20" height="48" fill="#fff" opacity=".9"/></g>
        <g className="buttercup-arms"><path className="buttercup-arm-left" d="M177 195Q148 198 136 217" fill="none" stroke="#f5cdbb" strokeWidth="18" strokeLinecap="round"/><path className="buttercup-arm-right" d="M243 195Q272 199 283 217" fill="none" stroke="#f5cdbb" strokeWidth="18" strokeLinecap="round"/></g>
        <g className="buttercup-legs"><path d="M191 226Q188 250 180 266" stroke="#fff" strokeWidth="16" strokeLinecap="round"/><path d="M229 226Q232 250 240 266" stroke="#fff" strokeWidth="16" strokeLinecap="round"/><path d="M174 267h17" stroke="#111" strokeWidth="9" strokeLinecap="round"/><path d="M232 267h17" stroke="#111" strokeWidth="9" strokeLinecap="round"/></g>
      </g>
      <g className="buttercup-sparks"><path d="M104 83l7 14 15 3-11 10 3 15-14-7-14 7 3-15-11-10 15-3z" fill="#8df26f"/><path d="M322 91l5 10 11 2-8 8 2 11-10-5-10 5 2-11-8-8 11-2z" fill="#c0ffab"/></g>
    </svg>
  </div>;
}

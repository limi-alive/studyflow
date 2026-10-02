import type { CompanionState } from '../FocusCompanion';
import type { CompanionMotion } from '../../hooks/useCompanionPreferences';

type Props = { state: CompanionState; motion: CompanionMotion; preview?: boolean };

export function ButtercupCompanion({state,motion,preview=false}:Props){
  return <div className={`character-stage buttercup-stage state-${state} motion-${motion} ${preview?'is-preview':''}`}>
    <svg viewBox="0 0 460 320" role="img" aria-label="Buttercup focus companion" className="character-svg">
      <defs>
        <filter id="butterGlowV9" x="-45%" y="-45%" width="190%" height="190%"><feGaussianBlur stdDeviation="8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="butterShadowV9" x="-30%" y="-30%" width="160%" height="180%"><feDropShadow dx="0" dy="12" stdDeviation="10" floodColor="#071407" floodOpacity=".32"/></filter>
        <radialGradient id="butterAura" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#76f36b" stopOpacity=".32"/><stop offset="1" stopColor="#1a6b20" stopOpacity="0"/></radialGradient>
        <linearGradient id="butterTrailV9" x1="0" x2="1"><stop stopColor="#76f36b" stopOpacity="0"/><stop offset=".78" stopColor="#54de46" stopOpacity=".92"/><stop offset="1" stopColor="#d9ff95" stopOpacity="1"/></linearGradient>
        <linearGradient id="butterDress" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#7ee966"/><stop offset=".55" stopColor="#55d33f"/><stop offset="1" stopColor="#2ea52d"/></linearGradient>
      </defs>

      <g className="buttercup-city" opacity=".55">
        <path d="M55 249V189h31v60M92 249v-83h38v83M136 249v-57h24v57M306 249v-66h26v66M338 249v-91h40v91M383 249v-51h23v51" fill="#122215"/>
        <path d="M62 201h17M62 214h17M99 179h24M99 193h24M345 172h25M345 188h25M345 204h25M312 195h14M390 210h11" stroke="#7be96c" strokeWidth="3" opacity=".16"/>
      </g>
      <ellipse cx="230" cy="166" rx="145" ry="112" fill="url(#butterAura)"/>
      <g className="buttercup-energy"><ellipse cx="230" cy="166" rx="108" ry="78" fill="none" stroke="#66e957" strokeWidth="4" opacity=".28"/><ellipse cx="230" cy="166" rx="139" ry="101" fill="none" stroke="#66e957" strokeWidth="3" opacity=".15" strokeDasharray="12 10"/><ellipse cx="230" cy="166" rx="167" ry="122" fill="none" stroke="#c8ff9c" strokeWidth="2" opacity=".08" strokeDasharray="5 12"/></g>
      <g className="buttercup-trails"><path d="M53 161C110 160 142 153 175 139" stroke="url(#butterTrailV9)" strokeWidth="13" strokeLinecap="round"/><path d="M66 187C122 178 148 165 177 151" stroke="url(#butterTrailV9)" strokeWidth="8" strokeLinecap="round" opacity=".72"/><path d="M87 133C128 133 147 129 172 120" stroke="url(#butterTrailV9)" strokeWidth="5" strokeLinecap="round" opacity=".5"/></g>

      <g className="buttercup-hero" filter="url(#butterShadowV9)">
        <g filter="url(#butterGlowV9)"><circle cx="230" cy="129" r="69" fill="#f5cdbb" stroke="#121212" strokeWidth="5"/></g>
        <path d="M167 121Q170 63 215 57Q227 51 243 56Q289 63 293 121Q273 92 253 81Q256 104 250 122Q237 97 218 85Q216 109 204 123Q188 103 167 121Z" fill="#0d0d0f"/>
        <path d="M171 111Q184 76 214 66" fill="none" stroke="#464247" strokeWidth="5" strokeLinecap="round" opacity=".45"/><path d="M252 68Q277 78 287 107" fill="none" stroke="#3f3b41" strokeWidth="4" strokeLinecap="round" opacity=".32"/>
        <g className="buttercup-eyes"><ellipse cx="198" cy="135" rx="25" ry="31" fill="#fff" stroke="#111" strokeWidth="4"/><ellipse cx="262" cy="135" rx="25" ry="31" fill="#fff" stroke="#111" strokeWidth="4"/><g className="character-pupils"><ellipse cx="202" cy="138" rx="15" ry="21" fill="#57c93f"/><ellipse cx="258" cy="138" rx="15" ry="21" fill="#57c93f"/><ellipse cx="206" cy="142" rx="8" ry="12" fill="#111"/><ellipse cx="254" cy="142" rx="8" ry="12" fill="#111"/><circle cx="210" cy="135" r="4" fill="#fff"/><circle cx="258" cy="135" r="4" fill="#fff"/></g></g>
        <path className="buttercup-mouth" d="M207 172Q230 185 253 172" fill="none" stroke="#111" strokeWidth="5" strokeLinecap="round"/>
        <g className="buttercup-body"><path d="M196 191Q230 180 264 191L270 235Q230 249 190 235Z" fill="url(#butterDress)" stroke="#111" strokeWidth="5"/><rect x="192" y="208" width="76" height="13" fill="#111"/><rect x="220" y="188" width="20" height="49" fill="#fff" opacity=".92"/><path d="M202 195Q230 187 258 195" fill="none" stroke="#aef0a3" strokeWidth="3" opacity=".48"/></g>
        <g className="buttercup-arms"><path className="buttercup-arm-left" d="M197 200Q167 203 153 221" fill="none" stroke="#f5cdbb" strokeWidth="18" strokeLinecap="round"/><circle className="buttercup-fist-left" cx="151" cy="221" r="10" fill="#f5cdbb" stroke="#111" strokeWidth="3"/><path className="buttercup-arm-right" d="M263 200Q293 203 307 221" fill="none" stroke="#f5cdbb" strokeWidth="18" strokeLinecap="round"/><circle className="buttercup-fist-right" cx="309" cy="221" r="10" fill="#f5cdbb" stroke="#111" strokeWidth="3"/></g>
        <g className="buttercup-legs"><path d="M211 232Q208 256 199 274" stroke="#fff" strokeWidth="16" strokeLinecap="round"/><path d="M249 232Q252 256 261 274" stroke="#fff" strokeWidth="16" strokeLinecap="round"/><path d="M192 275h18" stroke="#111" strokeWidth="9" strokeLinecap="round"/><path d="M251 275h18" stroke="#111" strokeWidth="9" strokeLinecap="round"/></g>
      </g>

      <g className="buttercup-sparks"><path d="M104 86l7 14 15 3-11 10 3 15-14-7-14 7 3-15-11-10 15-3z" fill="#8df26f"/><path d="M349 94l5 10 11 2-8 8 2 11-10-5-10 5 2-11-8-8 11-2z" fill="#c0ffab"/><circle cx="93" cy="171" r="6" fill="#69e958"/><circle cx="357" cy="170" r="5" fill="#d8ffae"/></g>
      <g className="buttercup-focus-icons" opacity=".8"><g transform="translate(93 222)"><circle r="17" fill="#111d12" stroke="#4dd33f" strokeWidth="2"/><path d="M-5 1l4 4 8-10" fill="none" stroke="#9ef490" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></g><g transform="translate(364 219)"><circle r="17" fill="#111d12" stroke="#4dd33f" strokeWidth="2"/><path d="M0-8v9l6 4" fill="none" stroke="#9ef490" strokeWidth="3" strokeLinecap="round"/></g></g>
      <ellipse className="buttercup-floor" cx="230" cy="286" rx="86" ry="10" fill="#5de34e" opacity=".12" filter="url(#butterGlowV9)"/>
    </svg>
  </div>;
}

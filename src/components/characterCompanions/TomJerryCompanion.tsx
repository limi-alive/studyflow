import type { CompanionState } from '../FocusCompanion';
import type { CompanionMotion } from '../../hooks/useCompanionPreferences';

type Props = { state: CompanionState; motion: CompanionMotion; preview?: boolean };

export function TomJerryCompanion({state,motion,preview=false}:Props){
  return <div className={`character-stage tomjerry-stage state-${state} motion-${motion} ${preview?'is-preview':''}`}>
    <svg viewBox="0 0 500 330" role="img" aria-label="Tom and Jerry focus companion" className="character-svg">
      <defs>
        <filter id="tjShadowV9" x="-30%" y="-30%" width="160%" height="180%"><feDropShadow dx="0" dy="11" stdDeviation="10" floodColor="#120c08" floodOpacity=".28"/></filter>
        <linearGradient id="tjDeskV9" x1="0" x2="1"><stop stopColor="#7b5238"/><stop offset=".55" stopColor="#a86e45"/><stop offset="1" stopColor="#c28b5d"/></linearGradient>
        <linearGradient id="tjLampV9" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f8d98a"/><stop offset="1" stopColor="#db9a4d"/></linearGradient>
        <radialGradient id="tjWarmGlow" cx="50%" cy="25%" r="70%"><stop offset="0" stopColor="#f5c371" stopOpacity=".24"/><stop offset="1" stopColor="#f5c371" stopOpacity="0"/></radialGradient>
      </defs>

      <g className="tj-room" opacity=".9">
        <rect x="54" y="44" width="98" height="70" rx="16" fill="#171b22" stroke="#36343b" strokeWidth="3"/><path d="M103 47v64M57 79h92" stroke="#5e5962" strokeWidth="2" opacity=".55"/><circle cx="82" cy="65" r="4" fill="#f0cd77"/><circle cx="128" cy="93" r="3" fill="#8fb4d8"/>
        <g className="tj-wall-clock" transform="translate(408 72)"><circle r="31" fill="#19171a" stroke="#5b5253" strokeWidth="3"/><path d="M0-17V0l11 7" fill="none" stroke="#eee2d4" strokeWidth="3" strokeLinecap="round"/><circle r="3" fill="#d6975b"/></g>
        <path d="M72 235Q81 205 106 198" fill="none" stroke="#4e392b" strokeWidth="5"/><path d="M63 237h55" stroke="#4e392b" strokeWidth="5" strokeLinecap="round"/>
      </g>
      <ellipse cx="252" cy="180" rx="200" ry="130" fill="url(#tjWarmGlow)" opacity=".48"/>
      <g className="tj-motion-lines" opacity=".24"><path d="M55 133h71M49 154h86M370 120h61M375 143h68" stroke="#e3d5c8" strokeWidth="4" strokeLinecap="round"/></g>

      <g className="tj-lamp" filter="url(#tjShadowV9)"><path d="M78 235V154" stroke="#4a3428" strokeWidth="7" strokeLinecap="round"/><path d="M78 154l27-18" stroke="#4a3428" strokeWidth="7" strokeLinecap="round"/><path d="M98 127q23 4 28 24H90q2-14 8-24Z" fill="url(#tjLampV9)" stroke="#4a3428" strokeWidth="4"/><path d="M96 153h25" stroke="#f5df9c" strokeWidth="3" opacity=".4"/></g>

      <g filter="url(#tjShadowV9)" className="tom-group">
        <path className="tom-tail" d="M145 229Q90 224 101 177Q112 148 140 160" fill="none" stroke="#747b82" strokeWidth="22" strokeLinecap="round"/><path d="M143 111L125 61L174 86Z" fill="#747b82" stroke="#292d31" strokeWidth="5"/><path d="M237 111L256 61L208 86Z" fill="#747b82" stroke="#292d31" strokeWidth="5"/><path d="M133 100Q190 66 247 100L248 186Q236 224 190 228Q143 224 132 186Z" fill="#747b82" stroke="#292d31" strokeWidth="5"/><path d="M139 95L128 66L164 88Z" fill="#ef9faa"/><path d="M240 95L253 66L217 88Z" fill="#ef9faa"/>
        <ellipse cx="190" cy="168" rx="50" ry="44" fill="#ece9e2"/><g className="tom-face"><ellipse cx="166" cy="132" rx="21" ry="29" fill="#fff" stroke="#292d31" strokeWidth="3"/><ellipse cx="214" cy="132" rx="21" ry="29" fill="#fff" stroke="#292d31" strokeWidth="3"/><g className="character-pupils"><ellipse cx="170" cy="139" rx="8" ry="14" fill="#9bce65"/><ellipse cx="210" cy="139" rx="8" ry="14" fill="#9bce65"/><ellipse cx="170" cy="142" rx="4" ry="8" fill="#17191a"/><ellipse cx="210" cy="142" rx="4" ry="8" fill="#17191a"/><circle cx="168" cy="136" r="2" fill="#fff"/><circle cx="208" cy="136" r="2" fill="#fff"/></g><path d="M180 160Q190 166 200 160L190 172Z" fill="#e68183" stroke="#292d31" strokeWidth="2"/><path className="tom-mouth" d="M171 181Q190 194 209 181" fill="none" stroke="#292d31" strokeWidth="4" strokeLinecap="round"/><path d="M138 166h38M132 178h42M204 166h38M206 178h42" stroke="#292d31" strokeWidth="2" strokeLinecap="round"/></g><path className="tom-paw" d="M227 202Q258 204 265 232" fill="none" stroke="#ece9e2" strokeWidth="19" strokeLinecap="round"/><circle cx="262" cy="232" r="9" fill="#ece9e2" stroke="#292d31" strokeWidth="3"/></g>

      <g filter="url(#tjShadowV9)" className="jerry-group"><circle cx="347" cy="187" r="40" fill="#a9673a" stroke="#4f3124" strokeWidth="5"/><circle cx="320" cy="158" r="24" fill="#a9673a" stroke="#4f3124" strokeWidth="5"/><circle cx="374" cy="158" r="24" fill="#a9673a" stroke="#4f3124" strokeWidth="5"/><circle cx="320" cy="158" r="13" fill="#e7a384"/><circle cx="374" cy="158" r="13" fill="#e7a384"/><ellipse cx="347" cy="197" rx="28" ry="24" fill="#e1aa7f"/><g className="jerry-face"><g className="character-pupils"><ellipse cx="334" cy="181" rx="5" ry="8" fill="#171717"/><ellipse cx="360" cy="181" rx="5" ry="8" fill="#171717"/><circle cx="336" cy="179" r="2" fill="#fff"/><circle cx="362" cy="179" r="2" fill="#fff"/></g><ellipse cx="347" cy="192" rx="6" ry="4" fill="#43271f"/><path className="jerry-mouth" d="M337 203Q347 211 357 203" fill="none" stroke="#43271f" strokeWidth="3" strokeLinecap="round"/></g><path className="jerry-arm" d="M374 200Q398 204 406 220" fill="none" stroke="#a9673a" strokeWidth="11" strokeLinecap="round"/><path className="jerry-tail" d="M315 218Q286 234 294 258Q301 270 318 260" fill="none" stroke="#a9673a" strokeWidth="6" strokeLinecap="round"/></g>

      <g className="tj-book"><rect x="225" y="235" width="126" height="37" rx="8" fill="#f4df86" stroke="#4b3526" strokeWidth="4"/><path d="M288 237v31" stroke="#4b3526" strokeWidth="3"/><path d="M239 246h35M302 246h34M241 255h26M302 255h27" stroke="#c39d46" strokeWidth="2.5" strokeLinecap="round"/></g>
      <g className="tj-pencil"><path d="M378 227l34-19" stroke="#efc24e" strokeWidth="7" strokeLinecap="round"/><path d="M409 210l7-4-2 8z" fill="#c97d62"/></g>
      <g className="tj-desk"><rect x="84" y="269" width="334" height="29" rx="14" fill="url(#tjDeskV9)" stroke="#3a2a21" strokeWidth="5"/><path d="M102 278h296" stroke="#e3bc8f" strokeWidth="3" opacity=".18"/></g>
      <g className="tj-cheese"><path d="M380 242l30 4-10 20h-29z" fill="#f1c34d" stroke="#5c4228" strokeWidth="3"/><circle cx="392" cy="251" r="3" fill="#d29f32"/><circle cx="401" cy="258" r="3" fill="#d29f32"/></g>
      <g className="tj-paperbits" opacity=".8"><path d="M118 246l16-6 7 12-18 5z" fill="#f2ece2"/><path d="M420 184l15-8 7 12-16 8z" fill="#f2ece2"/><circle cx="424" cy="225" r="4" fill="#d9a261"/></g>
    </svg>
  </div>;
}

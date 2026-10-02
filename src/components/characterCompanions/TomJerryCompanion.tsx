import type { CompanionState } from '../FocusCompanion';
import type { CompanionMotion } from '../../hooks/useCompanionPreferences';

type Props = { state: CompanionState; motion: CompanionMotion; preview?: boolean };

export function TomJerryCompanion({state,motion,preview=false}:Props){
  return <div className={`character-stage tomjerry-stage state-${state} motion-${motion} ${preview?'is-preview':''}`}>
    <svg viewBox="0 0 460 300" role="img" aria-label="Tom and Jerry focus companion" className="character-svg">
      <defs><filter id="tjShadow" x="-30%" y="-30%" width="160%" height="180%"><feDropShadow dx="0" dy="10" stdDeviation="9" floodOpacity=".22"/></filter><linearGradient id="tjDesk" x1="0" x2="1"><stop stopColor="#8f6547"/><stop offset="1" stopColor="#bd8a5b"/></linearGradient></defs>
      <g className="tj-motion-lines" opacity=".3"><path d="M65 126h57M57 146h72M346 110h48M352 130h54" stroke="#d2c5b9" strokeWidth="4" strokeLinecap="round"/></g>
      <g filter="url(#tjShadow)" className="tom-group">
        <path className="tom-tail" d="M125 214Q74 211 86 167Q96 142 122 153" fill="none" stroke="#777d84" strokeWidth="20" strokeLinecap="round"/>
        <path d="M125 104L108 59L154 82Z" fill="#777d84" stroke="#292d31" strokeWidth="5"/><path d="M216 104L234 59L189 82Z" fill="#777d84" stroke="#292d31" strokeWidth="5"/>
        <path d="M115 94Q170 62 225 94L226 178Q214 215 170 218Q126 214 114 177Z" fill="#777d84" stroke="#292d31" strokeWidth="5"/>
        <path d="M122 90L111 63L145 84Z" fill="#ef9faa" opacity=".9"/><path d="M218 90L231 63L197 84Z" fill="#ef9faa" opacity=".9"/>
        <ellipse cx="170" cy="160" rx="48" ry="42" fill="#e8e5de"/>
        <g className="tom-face"><ellipse cx="147" cy="127" rx="20" ry="27" fill="#fff" stroke="#292d31" strokeWidth="3"/><ellipse cx="193" cy="127" rx="20" ry="27" fill="#fff" stroke="#292d31" strokeWidth="3"/><ellipse cx="151" cy="133" rx="8" ry="13" fill="#99cf66"/><ellipse cx="189" cy="133" rx="8" ry="13" fill="#99cf66"/><ellipse cx="151" cy="136" rx="4" ry="8" fill="#191b1d"/><ellipse cx="189" cy="136" rx="4" ry="8" fill="#191b1d"/><path d="M160 153Q170 159 180 153L170 165Z" fill="#e68183" stroke="#292d31" strokeWidth="2"/><path d="M152 174Q170 186 188 174" fill="none" stroke="#292d31" strokeWidth="4" strokeLinecap="round"/><path d="M121 159h34M116 171h38M185 159h34M186 171h38" stroke="#292d31" strokeWidth="2" strokeLinecap="round"/></g>
        <path className="tom-paw" d="M205 194Q235 196 241 222" fill="none" stroke="#e8e5de" strokeWidth="18" strokeLinecap="round"/>
      </g>
      <g filter="url(#tjShadow)" className="jerry-group">
        <circle cx="317" cy="178" r="38" fill="#a9673a" stroke="#4f3124" strokeWidth="5"/><circle cx="292" cy="151" r="23" fill="#a9673a" stroke="#4f3124" strokeWidth="5"/><circle cx="342" cy="151" r="23" fill="#a9673a" stroke="#4f3124" strokeWidth="5"/><circle cx="292" cy="151" r="13" fill="#e7a384"/><circle cx="342" cy="151" r="13" fill="#e7a384"/>
        <ellipse cx="317" cy="188" rx="27" ry="23" fill="#e1aa7f"/>
        <g className="jerry-face"><ellipse cx="304" cy="173" rx="5" ry="8" fill="#171717"/><ellipse cx="330" cy="173" rx="5" ry="8" fill="#171717"/><circle cx="306" cy="171" r="2" fill="#fff"/><circle cx="332" cy="171" r="2" fill="#fff"/><ellipse cx="317" cy="184" rx="6" ry="4" fill="#43271f"/><path d="M307 195Q317 202 327 195" fill="none" stroke="#43271f" strokeWidth="3" strokeLinecap="round"/></g>
        <path className="jerry-arm" d="M344 191Q366 194 373 210" fill="none" stroke="#a9673a" strokeWidth="11" strokeLinecap="round"/><path className="jerry-tail" d="M286 207Q260 221 267 244Q273 257 290 248" fill="none" stroke="#a9673a" strokeWidth="5" strokeLinecap="round"/>
      </g>
      <g className="tj-book"><rect x="208" y="222" width="112" height="34" rx="8" fill="#f5df83" stroke="#4b3526" strokeWidth="4"/><path d="M264 224v28" stroke="#4b3526" strokeWidth="3"/><path d="M221 233h31M276 233h31" stroke="#c39d46" strokeWidth="3" strokeLinecap="round"/></g>
      <g className="tj-desk"><rect x="88" y="251" width="284" height="27" rx="13" fill="url(#tjDesk)" stroke="#3a2a21" strokeWidth="5"/></g>
      <g className="tj-cheese"><path d="M355 230l28 4-9 18h-27z" fill="#f1c34d" stroke="#5c4228" strokeWidth="3"/><circle cx="366" cy="239" r="3" fill="#d29f32"/><circle cx="375" cy="246" r="3" fill="#d29f32"/></g>
    </svg>
  </div>;
}

import type { CompanionState } from '../FocusCompanion';
import type { CompanionMotion } from '../../hooks/useCompanionPreferences';

type Props = { state: CompanionState; motion: CompanionMotion; preview?: boolean };

export function KuromiCompanion({state,motion,preview=false}:Props){
  return <div className={`character-stage kuromi-stage state-${state} motion-${motion} ${preview?'is-preview':''}`}>
    <svg viewBox="0 0 420 300" role="img" aria-label="Kuromi focus companion" className="character-svg">
      <defs>
        <filter id="kuromiShadow" x="-30%" y="-30%" width="160%" height="180%"><feDropShadow dx="0" dy="12" stdDeviation="10" floodOpacity=".24"/></filter>
        <linearGradient id="kuromiDesk" x1="0" x2="1"><stop offset="0" stopColor="#9b77ce"/><stop offset="1" stopColor="#c799e8"/></linearGradient>
      </defs>
      <g className="kuromi-bg" opacity=".9"><circle cx="88" cy="78" r="7" fill="#f7b4df"/><circle cx="334" cy="73" r="5" fill="#f2b1d4"/><path d="M61 102l8 8 8-8-8 14z" fill="#b896ea"/><path d="M340 111l6 6 6-6-6 11z" fill="#b896ea"/></g>
      <g filter="url(#kuromiShadow)" className="kuromi-main">
        <g className="kuromi-ears">
          <path d="M121 100 C87 73 91 35 109 21 C126 36 137 59 142 87 Z" fill="#2c2831" stroke="#17131c" strokeWidth="5"/>
          <path d="M299 100 C333 73 329 35 311 21 C294 36 283 59 278 87 Z" fill="#2c2831" stroke="#17131c" strokeWidth="5"/>
          <circle cx="108" cy="23" r="8" fill="#f4a7cf" stroke="#17131c" strokeWidth="4"/><circle cx="312" cy="23" r="8" fill="#f4a7cf" stroke="#17131c" strokeWidth="4"/>
        </g>
        <path d="M117 97 C124 56 158 36 210 36 C262 36 296 57 303 97 L291 169 C269 188 246 198 210 198 C173 198 150 188 129 169 Z" fill="#2b2730" stroke="#17131c" strokeWidth="5"/>
        <g className="kuromi-skull">
          <ellipse cx="210" cy="68" rx="27" ry="21" fill="#f39bc6" stroke="#17131c" strokeWidth="4"/>
          <circle cx="199" cy="66" r="4" fill="#3a2736"/><circle cx="221" cy="66" r="4" fill="#3a2736"/><path d="M206 77h8l-4 6z" fill="#3a2736"/>
        </g>
        <ellipse cx="210" cy="132" rx="74" ry="62" fill="#fffaf8" stroke="#17131c" strokeWidth="5"/>
        <path d="M155 126 C165 109 177 101 193 98 C184 112 178 127 177 143 Z" fill="#2b2730"/>
        <path d="M265 126 C255 109 243 101 227 98 C236 112 242 127 243 143 Z" fill="#2b2730"/>
        <g className="kuromi-face">
          <ellipse cx="181" cy="133" rx="7" ry="11" fill="#382a35"/><ellipse cx="239" cy="133" rx="7" ry="11" fill="#382a35"/>
          <path d="M190 160 Q210 172 230 160" fill="none" stroke="#382a35" strokeWidth="4" strokeLinecap="round"/>
          <ellipse cx="164" cy="153" rx="12" ry="6" fill="#f6b4c8" opacity=".72"/><ellipse cx="256" cy="153" rx="12" ry="6" fill="#f6b4c8" opacity=".72"/>
        </g>
        <g className="kuromi-body">
          <path d="M158 180 Q210 163 262 180 L278 238 Q210 259 142 238 Z" fill="#fffaf8" stroke="#17131c" strokeWidth="5"/>
          <path d="M171 188 Q210 202 249 188 L249 224 Q210 241 171 224 Z" fill="#2b2730" opacity=".97"/>
          <circle cx="169" cy="205" r="7" fill="#f29bc6"/><circle cx="251" cy="205" r="7" fill="#f29bc6"/>
          <path className="kuromi-tail" d="M260 219 Q304 220 295 187 Q311 202 308 223 Q302 248 268 247" fill="none" stroke="#2b2730" strokeWidth="8" strokeLinecap="round"/>
          <path d="M295 187l13-5-5 13z" fill="#2b2730"/>
        </g>
        <g className="kuromi-hands"><ellipse cx="160" cy="225" rx="19" ry="13" fill="#fffaf8" stroke="#17131c" strokeWidth="4"/><ellipse cx="260" cy="225" rx="19" ry="13" fill="#fffaf8" stroke="#17131c" strokeWidth="4"/></g>
        <g className="kuromi-book"><rect x="168" y="217" width="84" height="34" rx="7" fill="#efe3ff" stroke="#17131c" strokeWidth="4"/><path d="M210 219v28" stroke="#17131c" strokeWidth="3"/><path d="M180 228h20M220 228h20" stroke="#a58bc3" strokeWidth="3" strokeLinecap="round"/></g>
      </g>
      <g className="kuromi-desk"><rect x="94" y="245" width="232" height="28" rx="14" fill="url(#kuromiDesk)" stroke="#17131c" strokeWidth="5"/><circle cx="125" cy="258" r="4" fill="#f7d0ea"/><circle cx="295" cy="258" r="4" fill="#f7d0ea"/></g>
      <g className="kuromi-stars"><path d="M78 151l5 10 11 2-8 8 2 11-10-5-10 5 2-11-8-8 11-2z" fill="#f0a9d1"/><path d="M342 151l4 8 9 2-7 6 2 9-8-4-8 4 2-9-7-6 9-2z" fill="#c5a6f2"/></g>
    </svg>
  </div>;
}

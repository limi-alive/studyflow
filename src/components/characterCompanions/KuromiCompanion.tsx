import type { CompanionState } from '../FocusCompanion';
import type { CompanionMotion } from '../../hooks/useCompanionPreferences';

type Props = { state: CompanionState; motion: CompanionMotion; preview?: boolean };

export function KuromiCompanion({state,motion,preview=false}:Props){
  return <div className={`character-stage kuromi-stage state-${state} motion-${motion} ${preview?'is-preview':''}`}>
    <svg viewBox="0 0 460 320" role="img" aria-label="Kuromi focus companion" className="character-svg">
      <defs>
        <filter id="kuromiShadowV9" x="-35%" y="-35%" width="170%" height="190%"><feDropShadow dx="0" dy="13" stdDeviation="11" floodColor="#09070d" floodOpacity=".32"/></filter>
        <filter id="kuromiSoftGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="7"/></filter>
        <linearGradient id="kuromiHood" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#38313f"/><stop offset=".55" stopColor="#25212b"/><stop offset="1" stopColor="#17141b"/></linearGradient>
        <linearGradient id="kuromiFace" x1=".25" y1="0" x2=".8" y2="1"><stop stopColor="#fffefe"/><stop offset="1" stopColor="#f5edf2"/></linearGradient>
        <linearGradient id="kuromiDeskV9" x1="0" x2="1"><stop offset="0" stopColor="#8e67c2"/><stop offset=".5" stopColor="#b27ad9"/><stop offset="1" stopColor="#d399e8"/></linearGradient>
        <linearGradient id="kuromiBook" x1="0" x2="1"><stop stopColor="#f8efff"/><stop offset="1" stopColor="#d9c5f0"/></linearGradient>
      </defs>

      <g className="kuromi-room" opacity=".95">
        <circle cx="78" cy="82" r="36" fill="#f7c5e5" opacity=".08"/>
        <path d="M68 48a30 30 0 1 0 26 44A25 25 0 1 1 68 48Z" fill="#f1b4dc" opacity=".32"/>
        <path d="M358 56v47" stroke="#7e6b8d" strokeWidth="2" strokeDasharray="4 6" opacity=".6"/><path d="M358 104l-7 13h14z" fill="#d7b4f5" opacity=".78"/>
        <path d="M93 55v36" stroke="#7e6b8d" strokeWidth="2" strokeDasharray="4 6" opacity=".45"/><circle cx="93" cy="96" r="5" fill="#f7b4df"/>
        <g className="kuromi-floating-notes" opacity=".72"><rect x="332" y="150" width="56" height="36" rx="9" fill="#211c27" stroke="#6f5b7c" strokeWidth="2"/><path d="M344 160h28M344 168h20M344 176h32" stroke="#d5bddf" strokeWidth="2" strokeLinecap="round" opacity=".55"/></g>
        <g className="kuromi-mini-hearts" opacity=".8"><path d="M106 142c-8-11-25 1-14 13l14 13 14-13c11-12-6-24-14-13Z" fill="#e990c6"/><path d="M352 134c-5-7-16 1-9 9l9 9 9-9c7-8-4-16-9-9Z" fill="#b99ce8"/></g>
      </g>

      <ellipse className="kuromi-ground-glow" cx="230" cy="282" rx="130" ry="18" fill="#d798ef" opacity=".13" filter="url(#kuromiSoftGlow)"/>

      <g filter="url(#kuromiShadowV9)" className="kuromi-main">
        <g className="kuromi-ears">
          <g className="kuromi-ear-left"><path d="M133 105C99 79 101 38 120 23C139 41 149 66 153 92Z" fill="url(#kuromiHood)" stroke="#17131c" strokeWidth="5"/><path d="M121 31C132 45 139 62 141 78" fill="none" stroke="#665669" strokeWidth="4" strokeLinecap="round" opacity=".45"/><circle cx="119" cy="24" r="9" fill="#f2a1cf" stroke="#17131c" strokeWidth="4"/></g>
          <g className="kuromi-ear-right"><path d="M307 105C341 79 339 38 320 23C301 41 291 66 287 92Z" fill="url(#kuromiHood)" stroke="#17131c" strokeWidth="5"/><path d="M319 31C308 45 301 62 299 78" fill="none" stroke="#665669" strokeWidth="4" strokeLinecap="round" opacity=".45"/><circle cx="321" cy="24" r="9" fill="#f2a1cf" stroke="#17131c" strokeWidth="4"/></g>
        </g>
        <path d="M127 103C135 60 168 39 220 39C273 39 306 61 313 103L301 176C277 196 254 205 220 205C183 205 160 195 139 176Z" fill="url(#kuromiHood)" stroke="#17131c" strokeWidth="5"/>
        <path d="M145 91Q220 56 295 92" fill="none" stroke="#5f5066" strokeWidth="4" opacity=".28" strokeLinecap="round"/>
        <g className="kuromi-skull"><ellipse cx="220" cy="72" rx="29" ry="22" fill="#f39bc6" stroke="#17131c" strokeWidth="4"/><ellipse cx="210" cy="68" rx="4.5" ry="5.5" fill="#3a2736"/><ellipse cx="231" cy="68" rx="4.5" ry="5.5" fill="#3a2736"/><path d="M216 79h9l-4.5 7z" fill="#3a2736"/><path d="M201 59Q220 49 239 59" fill="none" stroke="#ffd4e9" strokeWidth="3" opacity=".5" strokeLinecap="round"/></g>
        <ellipse cx="220" cy="139" rx="76" ry="64" fill="url(#kuromiFace)" stroke="#17131c" strokeWidth="5"/>
        <path d="M164 132C173 113 188 104 203 102C194 117 188 132 187 149Z" fill="#2b2730"/><path d="M276 132C267 113 252 104 237 102C246 117 252 132 253 149Z" fill="#2b2730"/>
        <g className="kuromi-face">
          <g className="character-pupils"><ellipse cx="191" cy="140" rx="7" ry="11" fill="#382a35"/><ellipse cx="249" cy="140" rx="7" ry="11" fill="#382a35"/><circle cx="189" cy="136" r="2" fill="#fff" opacity=".9"/><circle cx="247" cy="136" r="2" fill="#fff" opacity=".9"/></g>
          <path className="kuromi-mouth" d="M199 166Q220 179 241 166" fill="none" stroke="#382a35" strokeWidth="4" strokeLinecap="round"/>
          <ellipse cx="174" cy="158" rx="13" ry="6" fill="#f6b4c8" opacity=".65"/><ellipse cx="266" cy="158" rx="13" ry="6" fill="#f6b4c8" opacity=".65"/>
        </g>
        <g className="kuromi-body"><path d="M169 187Q220 171 271 187L286 245Q220 265 154 245Z" fill="url(#kuromiFace)" stroke="#17131c" strokeWidth="5"/><path d="M181 195Q220 208 259 195L259 232Q220 248 181 232Z" fill="#2b2730"/><path d="M195 199Q220 207 245 199" fill="none" stroke="#4f4257" strokeWidth="3" opacity=".5"/><circle cx="179" cy="213" r="7" fill="#f29bc6"/><circle cx="261" cy="213" r="7" fill="#f29bc6"/><path className="kuromi-tail" d="M270 226Q313 225 305 193Q319 207 316 228Q311 253 279 253" fill="none" stroke="#2b2730" strokeWidth="9" strokeLinecap="round"/><path d="M304 191l14-5-5 14z" fill="#2b2730"/></g>
        <g className="kuromi-hands"><ellipse cx="171" cy="234" rx="20" ry="13" fill="#fffaf8" stroke="#17131c" strokeWidth="4"/><ellipse cx="269" cy="234" rx="20" ry="13" fill="#fffaf8" stroke="#17131c" strokeWidth="4"/></g>
        <g className="kuromi-book"><rect x="177" y="224" width="86" height="37" rx="8" fill="url(#kuromiBook)" stroke="#17131c" strokeWidth="4"/><path d="M220 226v31" stroke="#17131c" strokeWidth="3"/><path d="M189 236h20M231 236h20M190 244h15M232 244h16" stroke="#9f87ba" strokeWidth="2.5" strokeLinecap="round"/><path className="kuromi-page" d="M219 228Q244 221 259 232L259 252Q243 245 220 253Z" fill="#f7f1ff" opacity=".9"/></g>
      </g>

      <g className="kuromi-desk"><rect x="98" y="256" width="244" height="29" rx="14" fill="url(#kuromiDeskV9)" stroke="#17131c" strokeWidth="5"/><path d="M113 264h212" stroke="#f6d8ff" strokeWidth="3" opacity=".25"/><circle cx="130" cy="270" r="4" fill="#f7d0ea"/><circle cx="310" cy="270" r="4" fill="#f7d0ea"/></g>
      <g className="kuromi-desk-details"><rect x="304" y="229" width="24" height="24" rx="6" fill="#211c27" stroke="#17131c" strokeWidth="3"/><path d="M310 237h12M310 243h8" stroke="#e2c5ed" strokeWidth="2" strokeLinecap="round"/><path d="M118 243l38-7" stroke="#f4c85f" strokeWidth="6" strokeLinecap="round"/><path d="M118 243l8 4" stroke="#df8c9e" strokeWidth="5" strokeLinecap="round"/></g>
      <g className="kuromi-stars"><path d="M75 160l6 12 13 2-10 9 3 13-12-6-12 6 3-13-10-9 13-2z" fill="#f0a9d1"/><path d="M362 159l5 10 11 2-8 8 2 11-10-5-10 5 2-11-8-8 11-2z" fill="#c5a6f2"/><circle cx="87" cy="125" r="4" fill="#f7d5e9"/><circle cx="347" cy="127" r="3" fill="#dec6fb"/></g>
    </svg>
  </div>;
}

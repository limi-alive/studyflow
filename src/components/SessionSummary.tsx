import { useUiText } from '../lib/uiLanguage';
import { useState, type CSSProperties } from 'react';
import { Check, Coins, Flame, RotateCcw, Sparkles, Star, Target, X } from 'lucide-react';
import type { FocusInsight } from '../hooks/useFocusProgress';
import { formatDuration } from '../utils/time';

type Props = {
  insight: FocusInsight;
  streak: number;
  level: number;
  onSaveReflection: (rating: number, note: string) => void;
  onClose: () => void;
  onStartAnother: () => void;
};

export function SessionSummary({ insight, streak, level, onSaveReflection, onClose, onStartAnother }: Props) {
 const uiText=useUiText();
  const [rating, setRating] = useState(insight.rating ?? 4);
  const [note, setNote] = useState(insight.note ?? '');
  const save = (next: 'close' | 'another') => {
    onSaveReflection(rating, note.trim());
    if (next === 'another') onStartAnother(); else onClose();
  };

  return <div className="focus-summary-backdrop" role="presentation">
    <section className="focus-summary" role="dialog" aria-modal="true" aria-labelledby="focus-summary-title">
      <button className="focus-summary-close" onClick={()=>save('close')} aria-label={uiText("Close summary")}><X size={18}/></button>
      <div className="focus-summary-kicker"><Sparkles size={15}/> {uiText("Session complete")}</div>
      <div className="focus-summary-hero">
        <div className="focus-score-ring" style={{'--focus-score':`${insight.focusScore * 3.6}deg`} as CSSProperties}>
          <span>{uiText("Focus score")}</span><strong>{insight.focusScore}</strong><small>/ 100</small>
        </div>
        <div className="focus-summary-copy">
          <h2 id="focus-summary-title">{uiText("Nice work. Keep the momentum.")}</h2>
          <p>{insight.intent ? `You focused on “${insight.intent}”.` : 'This session is now part of your study history.'}</p>
          <div className="focus-summary-rewards">
            <span><Sparkles size={15}/> +{insight.xpEarned} {uiText("XP")}</span>
            <span><Coins size={15}/> +{insight.coinsEarned}</span>
            <span><Flame size={15}/> {streak} {uiText("day streak")}</span>
            <span><Target size={15}/> {uiText("Level")} {level}</span>
          </div>
        </div>
      </div>

      <div className="focus-summary-stats">
        <div><span>{uiText("Focused")}</span><strong>{formatDuration(insight.studySeconds)}</strong></div>
        <div><span>{uiText("Paused")}</span><strong>{formatDuration(insight.pauseSeconds)}</strong></div>
        <div><span>{uiText("Distractions")}</span><strong>{insight.distractions}</strong></div>
        <div><span>{uiText("Target")}</span><strong>{insight.completedTarget ? 'Completed' : 'Partial'}</strong></div>
      </div>

      <div className="focus-reflection">
        <div><strong>{uiText("How did that feel?")}</strong><small>{uiText("A quick reflection improves your Focus Score history.")}</small></div>
        <div className="focus-rating" aria-label={uiText("Focus rating")}>{[1,2,3,4,5].map(value=><button key={value} className={rating>=value?'active':''} onClick={()=>setRating(value)} aria-label={`${value} star focus rating`}><Star size={19} fill={rating>=value?'currentColor':'none'}/></button>)}</div>
        <textarea className="input focus-note" rows={2} value={note} onChange={event=>setNote(event.target.value)} maxLength={180} placeholder={uiText("Optional note: what worked, what got in the way?")}/>
      </div>

      <div className="focus-summary-actions">
        <button className="button" onClick={()=>save('another')}><RotateCcw size={17}/> {uiText("Start another")}</button>
        <button className="button primary" onClick={()=>save('close')}><Check size={17}/> {uiText("Done")}</button>
      </div>
    </section>
  </div>;
}

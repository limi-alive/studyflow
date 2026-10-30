import { useUiText, useUiLanguage, formatUiNumber } from '../lib/uiLanguage';

import { useMemo, useState } from 'react';
import { Check, Copy, Flame, Link2, Share2, UsersRound } from 'lucide-react';
import type { StudySession } from '../types';
import { studySprint } from '../utils/studySprint';
import { useTimePulse } from '../hooks/useTimePulse';

import { CHALLENGE_GOALS as GOALS, challengeInviteUrl, goalFromInvite, isChallengeGoal, type ChallengeGoal as Goal } from '../utils/challengeInvite';


/** Invitation is a local 7-day goal, not a shared room or a real-time race. */
export function SocialChallenge({userId,sessions}: {userId:string; sessions:StudySession[]}) {
 const uiText=useUiText();
 const language=useUiLanguage();
  const nowMs=useTimePulse();
  const storageKey=`studyflow.social-challenge.${userId}`;
  const invited=goalFromInvite(window.location.search);
  const initial=invited ?? 25;
  const [goal,setGoal]=useState<Goal>(()=>{
    try{const saved=Number(localStorage.getItem(storageKey));return invited ?? (isChallengeGoal(saved)?saved:initial);}catch{return initial;}
  });
  const [message,setMessage]=useState('');
  const summary=useMemo(()=>studySprint(sessions,new Date(nowMs)),[sessions,nowMs]);
  const complete=summary.days.filter(day=>day.seconds>=goal*60).length;
  const shareUrl=challengeInviteUrl(goal);
  const inviteText=language==='fa'?`بیا با هم یک چالش مطالعه ۷ روزه شروع کنیم! 📚\nهر روز ${formatUiNumber(goal)} دقیقه تمرکز در StudyFlow\n${shareUrl}`:`Join my seven-day StudyFlow challenge! 📚\n${goal} minutes of focus per day\n${shareUrl}`;
  const changeGoal=(next:Goal)=>{
    setGoal(next);
    setMessage('');
    try{localStorage.setItem(storageKey,String(next));}catch{ /* works in private browsing without persistence */ }
  };
  const share=async()=>{
    try{
      if(navigator.share){
        await navigator.share({title:language==='fa'?'چالش ۷ روزه StudyFlow':'Seven-day StudyFlow challenge',text:inviteText,url:shareUrl});
        setMessage(language==='fa'?'دعوت‌نامه آماده اشتراک‌گذاری شد.':'Share options opened.');
      }else if(navigator.clipboard?.writeText){
        await navigator.clipboard.writeText(inviteText);
        setMessage(language==='fa'?'دعوت‌نامه کپی شد؛ برای دوستت بفرست.':'Invitation copied.');
      }else{
        setMessage(`لینک دعوت: ${shareUrl}`);
      }
    }catch(e){if((e as Error).name!=='AbortError')setMessage(`لینک دعوت: ${shareUrl}`);}
  };
  return <section className="social-challenge"  aria-label={uiText("چالش دوستان StudyFlow")}>
    <div className="social-challenge-head"><span className="social-challenge-symbol"><UsersRound size={21}/></span><div><span className="social-challenge-label">{uiText("مطالعه با دوستان")}</span><h2>{uiText("با هم، هر روز بهتر")}</h2><p>{invited !== null?(language==='fa'?'یک دوست تو را به این چالش دعوت کرده!':'A friend invited you to this challenge!'):(language==='fa'?'برای دوستت چالش بفرست و کنار هم پیشرفت کنید.':'Invite a friend to study alongside you.')}</p></div></div>
    <div className="social-challenge-goals" role="group" aria-label={uiText("هدف روزانه چالش")}>{GOALS.map(minutes=><button type="button" key={minutes} className={goal===minutes?'is-active':''} aria-pressed={goal===minutes} onClick={()=>changeGoal(minutes)}>{formatUiNumber(minutes)} {uiText("دقیقه")}</button>)}</div>
    <div className="social-challenge-progress"><div><Flame size={17}/><strong>{formatUiNumber(complete)} {uiText("از ۷ روز")}</strong><span>{uiText("هدف روزانه:")} {formatUiNumber(goal)} {uiText("دقیقه")}</span></div><div className="social-challenge-line"><i style={{width:`${100*complete/7}%`}}/></div></div>
    <div className="social-challenge-days" role="list">{summary.days.map(day=><div className={day.seconds>=goal*60?'is-done':''} role="listitem" key={day.key}><span>{day.seconds>=goal*60?<Check size={14}/>:<span className="social-challenge-dot"/>}</span><small>{new Intl.DateTimeFormat(language==='fa'?'fa-IR-u-ca-persian':'en-US',{weekday:'short'}).format(new Date(`${day.key}T12:00:00`))}</small></div>)}</div>
    <button type="button" className="social-challenge-invite" onClick={()=>void share()}><Share2 size={17}/> {uiText("دعوت به چالش")} {formatUiNumber(goal)} {uiText("دقیقه‌ای")} <Link2 size={15}/></button>
    {message&&<p className="social-challenge-message" role="status"><Copy size={14}/>{message}</p>}
    <p className="social-challenge-note">{uiText("پیشرفت از مطالعه واقعی حساب خودت محاسبه می‌شود. لینک دعوت فقط هدف مشترک را منتقل می‌کند؛ رتبه و پیشرفت دوستان هنوز زنده نیست.")}</p>
  </section>;
}

import { useMemo, useState } from 'react';
import { Check, Copy, Flame, Link2, Share2, UsersRound } from 'lucide-react';
import type { StudySession } from '../types';
import { studySprint } from '../utils/studySprint';
import { useTimePulse } from '../hooks/useTimePulse';
import { formatPersianNumber, persianDateLabel } from '../utils/persianCalendar';
import { CHALLENGE_GOALS as GOALS, challengeInviteUrl, goalFromInvite, isChallengeGoal, type ChallengeGoal as Goal } from '../utils/challengeInvite';


/** Invitation is a local 7-day goal, not a shared room or a real-time race. */
export function SocialChallenge({userId,sessions}: {userId:string; sessions:StudySession[]}) {
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
  const inviteText=`بیا با هم یک چالش مطالعه ۷ روزه شروع کنیم! 📚\nهر روز ${formatPersianNumber(goal)} دقیقه تمرکز در StudyFlow\n${shareUrl}`;
  const changeGoal=(next:Goal)=>{
    setGoal(next);
    setMessage('');
    try{localStorage.setItem(storageKey,String(next));}catch{ /* works in private browsing without persistence */ }
  };
  const share=async()=>{
    try{
      if(navigator.share){
        await navigator.share({title:'چالش ۷ روزه StudyFlow',text:inviteText,url:shareUrl});
        setMessage('دعوت‌نامه آماده اشتراک‌گذاری شد.');
      }else if(navigator.clipboard?.writeText){
        await navigator.clipboard.writeText(inviteText);
        setMessage('دعوت‌نامه کپی شد؛ برای دوستت بفرست.');
      }else{
        setMessage(`لینک دعوت: ${shareUrl}`);
      }
    }catch(e){if((e as Error).name!=='AbortError')setMessage(`لینک دعوت: ${shareUrl}`);}
  };
  return <section className="social-challenge" dir="rtl" lang="fa" aria-label="چالش دوستان StudyFlow">
    <div className="social-challenge-head"><span className="social-challenge-symbol"><UsersRound size={21}/></span><div><span className="social-challenge-label">مطالعه با دوستان</span><h2>با هم، هر روز بهتر</h2><p>{invited !== null?'یک دوست تو را به این چالش دعوت کرده!':'برای دوستت چالش بفرست و کنار هم پیشرفت کنید.'}</p></div></div>
    <div className="social-challenge-goals" role="group" aria-label="هدف روزانه چالش">{GOALS.map(minutes=><button type="button" key={minutes} className={goal===minutes?'is-active':''} aria-pressed={goal===minutes} onClick={()=>changeGoal(minutes)}>{formatPersianNumber(minutes)} دقیقه</button>)}</div>
    <div className="social-challenge-progress"><div><Flame size={17}/><strong>{formatPersianNumber(complete)} از ۷ روز</strong><span>هدف روزانه: {formatPersianNumber(goal)} دقیقه</span></div><div className="social-challenge-line"><i style={{width:`${100*complete/7}%`}}/></div></div>
    <div className="social-challenge-days" role="list">{summary.days.map(day=><div className={day.seconds>=goal*60?'is-done':''} role="listitem" key={day.key}><span>{day.seconds>=goal*60?<Check size={14}/>:<span className="social-challenge-dot"/>}</span><small>{persianDateLabel(`${day.key}T12:00:00`,{weekday:'short'})}</small></div>)}</div>
    <button type="button" className="social-challenge-invite" onClick={()=>void share()}><Share2 size={17}/> دعوت به چالش {formatPersianNumber(goal)} دقیقه‌ای <Link2 size={15}/></button>
    {message&&<p className="social-challenge-message" role="status"><Copy size={14}/>{message}</p>}
    <p className="social-challenge-note">پیشرفت از مطالعه واقعی حساب خودت محاسبه می‌شود. لینک دعوت فقط هدف مشترک را منتقل می‌کند؛ رتبه و پیشرفت دوستان هنوز زنده نیست.</p>
  </section>;
}

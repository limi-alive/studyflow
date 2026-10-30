import { useUiText } from '../lib/uiLanguage';
import { Award, Banknote, CalendarRange, Check, ChevronLeft, Coins, Flame, Gift, Sparkles, Trophy, TrendingUp } from 'lucide-react';
import { Card } from './Card';
import { useAchievements } from '../hooks/useAchievements';
import { useMonthlyReward } from '../hooks/useMonthlyReward';
import { useStudyReview } from '../hooks/useStudyReview';
import { formatDuration } from '../utils/time';
import { formatAppDate } from '../lib/locale';
import { formatUiNumber, getUiLanguage } from '../lib/uiLanguage';

function toman(value:number){return `${formatUiNumber(value)} ${getUiLanguage()==='fa'?'تومان':'Toman'}`;}

type Props={userId:string;calendarType:'gregorian'|'jalali'};

export function ProgressHub({userId,calendarType}:Props){
 const uiText=useUiText();
  const achievements=useAchievements(userId);
  const reward=useMonthlyReward(userId,calendarType);
  const review=useStudyReview(userId);
  const nextHours=Math.max(0,reward.nextRewardSeconds/3600);
  const circumference=2*Math.PI*46;
  const dash=Math.max(0,Math.min(1,reward.progress))*circumference;

  return <section className="progress-hub-grid">
    <Card className="money-reward-card">
      <div className="reward-card-head"><div><div className="eyebrow">{uiText("Monthly reward")}</div><h3><Banknote size={20}/> {uiText("Study pays off")}</h3></div><span className="reward-month">{reward.monthLabel}</span></div>
      <div className="reward-main">
        <div className="reward-ring"><svg viewBox="0 0 110 110"><circle cx="55" cy="55" r="46" className="reward-ring-track"/><circle cx="55" cy="55" r="46" className="reward-ring-value" strokeDasharray={`${dash} ${circumference-dash}`}/></svg><div><strong>{reward.monthlyHours.toFixed(1)}{uiText("h")}</strong><span>/ {reward.hoursPerReward}{uiText("h")}</span></div></div>
        <div className="reward-copy"><span className="reward-rule"><Gift size={16}/> {uiText("Every 28 hours = 5,000,000 Toman")}</span><span className="reward-rate-line"><b>{toman(Math.round(reward.tomanPerHour))}</b> {uiText("per study hour · live value")} <b>{toman(reward.studyValueToman)}</b></span><strong>{toman(reward.earnedToman)}</strong><small>{reward.earnedBlocks ? `${reward.earnedBlocks} ${uiText('reward blocks unlocked this month')}` : `${nextHours.toFixed(1)} ${uiText('hours to the first reward')}`}</small></div>
      </div>
      <div className="reward-ledger">
        <div><span>{uiText("Earned")}</span><strong>{toman(reward.earnedToman)}</strong></div><div><span>{uiText("Marked paid")}</span><strong>{toman(reward.paidToman)}</strong></div><div><span>{uiText("Outstanding")}</span><strong>{toman(reward.outstandingToman)}</strong></div>
      </div>
      <div className="reward-actions"><button className="button" disabled={reward.paidBlocks<=0} onClick={reward.undoOnePaid}><ChevronLeft size={15}/> {uiText("Undo paid")}</button><button className="button primary" disabled={reward.unpaidBlocks<=0} onClick={reward.markOnePaid}><Check size={15}/> {uiText("Mark 5M paid")}</button></div>
      <p className="reward-disclaimer">{uiText("Reward tracker only — StudyFlow records eligibility and payment status; it does not transfer money automatically.")}</p>
    </Card>

    <Card className="achievement-card">
      <div className="reward-card-head"><div><div className="eyebrow">{uiText("Achievements")}</div><h3><Trophy size={20}/> {uiText("Milestone shelf")}</h3></div><span className="achievement-count">{achievements.unlockedCount}/{achievements.totalCount}</span></div>
      <div className="achievement-list">{achievements.achievements.slice(0,8).map(item=><div className={`achievement-item ${item.unlocked?'unlocked':''}`} key={item.id}><span className="achievement-icon">{item.icon}</span><div><strong>{item.title}</strong><small>{item.description}</small><i><b style={{width:`${Math.min(100,item.progress/item.target*100)}%`}}/></i></div><span className="achievement-state">{item.unlocked?<Award size={16}/>:<>{Math.floor(item.progress)}/{item.target}{item.unit==='h'?'h':''}</>}</span></div>)}</div>
      <div className="achievement-footer"><span><Flame size={15}/>{achievements.streak} {uiText("day streak")}</span><span><Coins size={15}/>{achievements.totalHours.toFixed(1)} {uiText("total hours")}</span><span><Sparkles size={15}/>{achievements.unlockedCount} {uiText("unlocked")}</span></div>
    </Card>

    <Card className="review-card weekly-review-card">
      <div className="reward-card-head"><div><div className="eyebrow">{uiText("Weekly review")}</div><h3><TrendingUp size={20}/> {uiText("Momentum check")}</h3></div><span className={`weekly-delta ${review.weeklyDelta>=0?'up':'down'}`}>{review.weeklyDelta>=0?'+':''}{review.weeklyDelta}%</span></div>
      <div className="review-big"><strong>{formatDuration(review.weekSeconds)}</strong><span>{uiText("focused this week ·")} {review.weekSessions} {uiText("sessions")}</span></div>
      <div className="review-compare"><span>{uiText("Previous week")}</span><strong>{formatDuration(review.previousSeconds)}</strong></div>
      <p className="review-message">{review.weeklyDelta>15?'Strong week — protect the rhythm rather than adding more pressure.':review.weeklyDelta<0?'A lighter week is data, not failure. One clean session can restart momentum.':'Steady rhythm. Consistency is doing the work.'}</p>
    </Card>

    <Card className="review-card monthly-wrap-card">
      <div className="reward-card-head"><div><div className="eyebrow">{uiText("Monthly wrapped")}</div><h3><CalendarRange size={20}/> {uiText("Your month in focus")}</h3></div><span className="wrap-spark">✦</span></div>
      <div className="wrapped-hero"><strong>{formatDuration(review.monthSeconds)}</strong><span>{review.monthSessions} {uiText("sessions")}</span></div>
      <div className="wrapped-grid"><div><span>{uiText("Top subject")}</span><strong>{review.topSubject}</strong></div><div><span>{uiText("Best day")}</span><strong>{review.bestDay === '—' ? '—' : formatAppDate(`${review.bestDay}T12:00:00`)}</strong></div><div><span>{uiText("Peak hour")}</span><strong>{review.bestHour}</strong></div><div><span>{uiText("Reward blocks")}</span><strong>{reward.earnedBlocks}</strong></div></div>
    </Card>
  </section>;
}

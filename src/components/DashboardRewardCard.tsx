import { ArrowRight, Banknote, Gift, Sparkles } from 'lucide-react';
import { useMonthlyReward } from '../hooks/useMonthlyReward';

type Props = {
  userId: string;
  calendarType: 'gregorian' | 'jalali';
  onOpenDetails: () => void;
};

function compactToman(value: number) {
  if (value >= 1_000_000) return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(value / 1_000_000)}M`;
  return new Intl.NumberFormat('en-US').format(value);
}

export function DashboardRewardCard({ userId, calendarType, onOpenDetails }: Props) {
  const reward = useMonthlyReward(userId, calendarType);
  const percent = Math.max(0, Math.min(100, reward.progress * 100));
  const blockHours = reward.monthlyHours % reward.hoursPerReward;
  const remainingHours = Math.max(0, reward.nextMilestoneSeconds / 3600);
  const ready = reward.unpaidBlocks > 0;

  return <section className={`dashboard-reward-card ${ready ? 'is-ready' : ''}`} aria-label="Monthly study reward">
    <span className="dashboard-reward-orb dashboard-reward-orb-one" aria-hidden="true" />
    <span className="dashboard-reward-orb dashboard-reward-orb-two" aria-hidden="true" />
    <div className="dashboard-reward-head">
      <div className="dashboard-reward-title"><span><Gift size={16}/></span><div><small>MONTHLY STUDY REWARD</small><strong>{reward.monthLabel}</strong></div></div>
      <button type="button" onClick={onOpenDetails}>Details <ArrowRight size={14}/></button>
    </div>

    <div className="dashboard-reward-body">
      <div className="dashboard-reward-amount">
        <span><Banknote size={17}/> Earned this month</span>
        <strong>{compactToman(reward.earnedToman)} <em>Toman</em></strong>
        <small>Every 28 study hours unlocks another 5M Toman.</small>
      </div>
      <div className="dashboard-reward-next">
        <span>{ready ? <><Sparkles size={14}/> Reward ready</> : 'Next 5M reward'}</span>
        <strong>{ready ? `${compactToman(reward.outstandingToman)} Toman` : `${remainingHours.toFixed(1)}h left`}</strong>
        <small>{reward.monthlyHours.toFixed(1)}h studied this month</small>
      </div>
    </div>

    <div className="dashboard-reward-progress-row">
      <div className="dashboard-reward-progress"><i style={{ width: `${percent}%` }}/></div>
      <span>{blockHours.toFixed(1)} / {reward.hoursPerReward}h</span>
    </div>
  </section>;
}

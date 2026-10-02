import { ArrowUpRight, Banknote, Gift, Sparkles } from 'lucide-react';
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

export function SidebarRewardCard({ userId, calendarType, onOpenDetails }: Props) {
  const reward = useMonthlyReward(userId, calendarType);
  const percent = Math.max(0, Math.min(100, reward.progress * 100));
  const blockHours = reward.monthlyHours % reward.hoursPerReward;
  const remainingHours = Math.max(0, reward.nextMilestoneSeconds / 3600);
  const ready = reward.unpaidBlocks > 0;

  return <button type="button" className={`sidebar-reward-card ${ready ? 'is-ready' : ''}`} onClick={onOpenDetails} aria-label="Open monthly study reward details">
    <span className="sidebar-reward-glow" aria-hidden="true" />
    <span className="sidebar-reward-top">
      <span className="sidebar-reward-icon"><Gift size={15}/></span>
      <span className="sidebar-reward-label">Monthly study reward</span>
      <ArrowUpRight size={14}/>
    </span>
    <span className="sidebar-reward-value"><Banknote size={16}/><strong>{compactToman(reward.earnedToman)}</strong><small> Toman earned</small></span>
    <span className="sidebar-reward-progress" aria-hidden="true"><i style={{ width: `${percent}%` }}/></span>
    <span className="sidebar-reward-meta">
      <span><b>{blockHours.toFixed(1)}h</b> / {reward.hoursPerReward}h</span>
      <span>{ready ? <><Sparkles size={12}/> {compactToman(reward.outstandingToman)} Toman ready</> : <><b>{remainingHours.toFixed(1)}h</b> to +5M Toman</>}</span>
    </span>
  </button>;
}

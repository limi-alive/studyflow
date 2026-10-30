import { useUiLanguage, useUiText } from '../lib/uiLanguage';
import { Crown, Medal, RefreshCw, Trophy } from 'lucide-react';
import type { PublicLeaderboardRow } from '../hooks/usePublicLeaderboard';

type BoardData = {
  rows: PublicLeaderboardRow[];
  loading: boolean;
  error: string | null;
  signedIn: boolean;
  refresh?: () => Promise<void>;
  periodKey?: string;
  periodStartAt?: string;
  nextResetAt?: string;
  lastUpdatedAt?: string | null;
};

function persianPeriodDate(value: string, language: 'fa' | 'en') {
  return new Intl.DateTimeFormat(language === 'fa' ? 'fa-IR-u-ca-persian-nu-arabext' : 'en-US-u-ca-persian-nu-latn', {
    timeZone: 'Asia/Tehran', year: 'numeric', month: 'long', day: 'numeric'
  }).format(new Date(value));
}

function nameOf(row: PublicLeaderboardRow) {
  return row.display_name || row.username || 'StudyFlow user';
}

function hours(seconds: number) {
  const value = Math.max(0, Number(seconds || 0)) / 3600;
  return `${value < 10 ? value.toFixed(1) : Math.round(value)}h`;
}

function RankMark({ rank }: { rank: number }) {
  if (rank === 1) return <Crown size={13}/>;
  if (rank <= 3) return <Medal size={13}/>;
  return <span>#{rank}</span>;
}

export function GlobalLeaderboardCard({ board, variant = 'sidebar' }: { board: BoardData; variant?: 'sidebar' | 'dashboard' }) {
 const uiText=useUiText();
  const uiLanguage = useUiLanguage();
  const leaders = board.rows.slice(0, 3);
  const me = board.rows.find(row => row.is_me);

  return <section className={`global-leaderboard-card global-leaderboard-${variant}`} aria-label={uiText("StudyFlow monthly leaderboard")}>
    <div className="global-leaderboard-head">
      <span className="global-leaderboard-icon"><Trophy size={15}/></span>
      <div><small>{uiLanguage === 'fa' ? 'ماه شمسی جاری' : 'Current Persian month'}</small><strong>{uiText("Study League")}</strong></div>
      {board.loading && <RefreshCw className="spin" size={13}/>}
    </div>

    {!board.signedIn ? <div className="global-leaderboard-empty">{uiText("Sign in to join the monthly ranking.")}</div>
      : board.error ? <div className="global-leaderboard-empty">{uiText("Leaderboard update required.")}</div>
      : leaders.length ? <div className="global-leaderboard-list">{leaders.map(row => <div key={`${row.rank_no}-${row.username ?? row.display_name}`} className={`global-leaderboard-row rank-${row.rank_no}${row.is_me ? ' is-me' : ''}`}>
          <span className="global-leaderboard-rank"><RankMark rank={Number(row.rank_no)}/></span>
          <span className="global-leaderboard-user"><strong>{nameOf(row)}</strong><small>{row.is_me ? uiText('You') : `@${row.username || 'studyflow'}`}</small></span>
          <span className="global-leaderboard-time">{hours(Number(row.period_seconds))}</span>
        </div>)}</div>
      : <div className="global-leaderboard-empty">{uiText("No study sessions yet.")}</div>}

    {me && !leaders.some(row => row.is_me) && <div className="global-leaderboard-me"><span>{uiText("Your rank")}</span><strong>#{me.rank_no} · {hours(Number(me.period_seconds))}</strong></div>}
    <div className="global-leaderboard-foot league-foot-v1364">
      <span>{uiLanguage === 'fa' ? 'دوره لیگ:' : 'Jalali league period:'} {board.periodStartAt ? persianPeriodDate(board.periodStartAt, uiLanguage) : '—'} {uiLanguage === 'fa' ? 'تا' : 'to'} {board.nextResetAt ? persianPeriodDate(new Date(new Date(board.nextResetAt).getTime() - 1).toISOString(), uiLanguage) : '—'}</span>
      <button type="button" onClick={() => void board.refresh?.()} disabled={board.loading} title={uiText("Refresh monthly leaderboard")} aria-label={uiText("Refresh leaderboard")}>{uiText("Refresh")}</button>
    </div>
  </section>;
}

import { useEffect, useMemo, useState } from 'react';
import { Activity, BarChart3, BookOpen, Crown, RefreshCw, ShieldCheck, Timer, Trophy, UsersRound } from 'lucide-react';
import { Card } from '../components/Card';
import { useAdminAccess } from '../hooks/useAdminAccess';
import { supabase } from '../lib/supabase';
import { formatDuration } from '../utils/time';

type Period = 'today' | 'week' | 'month' | 'all';
type OverviewRow = {
  user_id: string;
  username: string | null;
  display_name: string | null;
  period_seconds: number;
  all_time_seconds: number;
  session_count: number;
  last_study_at: string | null;
  rank_no: number;
};
type SubjectRow = { subject_id: string | null; subject_name: string; study_seconds: number; session_count: number; last_studied_at: string | null };
type RecentRow = { session_id: string; subject_name: string; start_time: string; end_time: string; study_seconds: number; timer_type: string };

function rangeFor(period: Period) {
  if (period === 'all') return { start: null, end: null };
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  const start = new Date(now);
  if (period === 'today') start.setHours(0, 0, 0, 0);
  if (period === 'week') {
    start.setHours(0, 0, 0, 0);
    const day = start.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + mondayOffset);
  }
  if (period === 'month') {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  }
  return { start: start.toISOString(), end: new Date(end.getTime() + 1).toISOString() };
}

function displayName(row: OverviewRow) { return row.display_name || row.username || `User ${row.user_id.slice(0, 6)}`; }
function compactHours(seconds: number) { return `${(Math.max(0, seconds) / 3600).toFixed(seconds >= 36000 ? 0 : 1)}h`; }
function dateLabel(iso: string | null) { return iso ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(iso)) : 'No sessions yet'; }

export default function AdminPage() {
  const access = useAdminAccess();
  const [period, setPeriod] = useState<Period>('month');
  const [rows, setRows] = useState<OverviewRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [recent, setRecent] = useState<RecentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [refreshToken, setRefreshToken] = useState(0);
  const range = useMemo(() => rangeFor(period), [period]);

  useEffect(() => {
    if (!access.isAdmin || !supabase) return;
    let alive = true;
    void (async () => {
      setLoading(true); setMessage('');
      const { data, error } = await supabase.rpc('studyflow_admin_overview', { period_start: range.start, period_end: range.end });
      if (!alive) return;
      if (error) { setMessage(error.message); setRows([]); setLoading(false); return; }
      const next = (data ?? []) as OverviewRow[];
      setRows(next);
      setSelectedId(current => current && next.some(item => item.user_id === current) ? current : next[0]?.user_id ?? null);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [access.isAdmin, range.start, range.end, refreshToken]);

  useEffect(() => {
    if (!access.isAdmin || !supabase || !selectedId) { setSubjects([]); setRecent([]); return; }
    let alive = true;
    void (async () => {
      const [subjectResult, recentResult] = await Promise.all([
        supabase.rpc('studyflow_admin_user_subjects', { target_user: selectedId, period_start: range.start, period_end: range.end }),
        supabase.rpc('studyflow_admin_recent_sessions', { target_user: selectedId, row_limit: 12 })
      ]);
      if (!alive) return;
      if (subjectResult.error || recentResult.error) {
        setMessage(subjectResult.error?.message || recentResult.error?.message || 'Could not load user details.');
        return;
      }
      setSubjects((subjectResult.data ?? []) as SubjectRow[]);
      setRecent((recentResult.data ?? []) as RecentRow[]);
    })();
    return () => { alive = false; };
  }, [access.isAdmin, selectedId, range.start, range.end, refreshToken]);

  const summary = useMemo(() => ({
    users: rows.length,
    active: rows.filter(row => Number(row.period_seconds) > 0).length,
    seconds: rows.reduce((sum, row) => sum + Number(row.period_seconds || 0), 0),
    sessions: rows.reduce((sum, row) => sum + Number(row.session_count || 0), 0)
  }), [rows]);
  const selected = rows.find(row => row.user_id === selectedId) ?? null;

  if (access.loading) return <div className="page admin-page"><div className="admin-access-state"><RefreshCw className="spin"/> Checking admin access…</div></div>;
  if (!access.isAdmin) return <div className="page admin-page"><Card className="admin-denied"><ShieldCheck size={28}/><h1>Admin access only</h1><p>This account is not in the StudyFlow admin allowlist. Admin rights can only be granted from Supabase SQL, never from the browser.</p>{access.error && <small>{access.error}</small>}</Card></div>;

  return <div className="page admin-page">
    <header className="page-header admin-header"><div><div className="eyebrow">PRIVATE CONTROL ROOM</div><h1>Admin Center</h1><p className="subtle">Read-only study analytics across StudyFlow accounts. Online changes sync automatically; offline activity appears after that user reconnects. Private notes and passwords are never shown here.</p></div><button className="button" onClick={() => setRefreshToken(value => value + 1)}><RefreshCw size={16}/> Refresh</button></header>

    <div className="admin-periods" role="tablist" aria-label="Admin analytics period">{(['today','week','month','all'] as Period[]).map(item => <button key={item} className={period===item?'active':''} onClick={() => setPeriod(item)}>{item === 'today' ? 'Today' : item === 'week' ? 'This week' : item === 'month' ? 'This month' : 'All time'}</button>)}</div>

    <div className="admin-summary-grid">
      <Card><UsersRound/><span>Accounts</span><strong>{summary.users}</strong><small>{summary.active} active in period</small></Card>
      <Card><Timer/><span>Study time</span><strong>{compactHours(summary.seconds)}</strong><small>Across all users</small></Card>
      <Card><Activity/><span>Sessions</span><strong>{summary.sessions}</strong><small>Completed in period</small></Card>
      <Card><Trophy/><span>Leader</span><strong>{rows[0] ? displayName(rows[0]) : '—'}</strong><small>{rows[0] ? compactHours(Number(rows[0].period_seconds)) : 'No activity yet'}</small></Card>
    </div>

    {message && <div className="admin-message">{message}</div>}

    <div className="admin-layout">
      <Card className="admin-leaderboard">
        <div className="admin-card-head"><div><div className="eyebrow">LEADERBOARD</div><h2>Who is studying most?</h2></div><BarChart3 size={20}/></div>
        {loading ? <div className="admin-empty">Loading ranking…</div> : rows.length ? <div className="admin-ranking-list">{rows.map(row => <button key={row.user_id} onClick={() => setSelectedId(row.user_id)} className={selectedId===row.user_id?'selected':''}>
          <span className={`admin-rank rank-${row.rank_no}`}>{row.rank_no <= 3 ? <Crown size={15}/> : '#'}{row.rank_no > 3 ? row.rank_no : ''}</span>
          <span className="admin-user-copy"><strong>{displayName(row)}</strong><small>@{row.username || 'no_username'} · {row.session_count} sessions</small></span>
          <span className="admin-user-time"><strong>{compactHours(Number(row.period_seconds))}</strong><small>{compactHours(Number(row.all_time_seconds))} total</small></span>
        </button>)}</div> : <div className="admin-empty">No accounts found.</div>}
      </Card>

      <div className="admin-detail-stack">
        <Card className="admin-user-detail">
          <div className="admin-card-head"><div><div className="eyebrow">USER DETAIL</div><h2>{selected ? displayName(selected) : 'Select a user'}</h2></div><BookOpen size={20}/></div>
          {selected && <><div className="admin-user-kpis"><div><span>Rank</span><strong>#{selected.rank_no}</strong></div><div><span>Period</span><strong>{compactHours(Number(selected.period_seconds))}</strong></div><div><span>All time</span><strong>{compactHours(Number(selected.all_time_seconds))}</strong></div></div><p className="subtle">Last study: {dateLabel(selected.last_study_at)}</p></>}
        </Card>

        <Card className="admin-subjects"><div className="admin-card-head"><div><div className="eyebrow">SUBJECT MIX</div><h2>What they studied</h2></div></div>{subjects.length ? <div className="admin-subject-list">{subjects.map((item, index) => { const max = Math.max(...subjects.map(s => Number(s.study_seconds)), 1); return <div key={`${item.subject_id ?? 'none'}-${index}`}><div><strong>{item.subject_name}</strong><span>{compactHours(Number(item.study_seconds))} · {item.session_count} sessions</span></div><i><b style={{width:`${Math.max(4,Number(item.study_seconds)/max*100)}%`}}/></i></div>; })}</div> : <div className="admin-empty">No subject activity in this period.</div>}</Card>

        <Card className="admin-recent"><div className="admin-card-head"><div><div className="eyebrow">RECENT ACTIVITY</div><h2>Latest sessions</h2></div></div>{recent.length ? <div className="admin-session-list">{recent.map(item => <div key={item.session_id}><span><strong>{item.subject_name}</strong><small>{dateLabel(item.end_time)} · {item.timer_type}</small></span><b>{formatDuration(Number(item.study_seconds))}</b></div>)}</div> : <div className="admin-empty">No sessions yet.</div>}</Card>
      </div>
    </div>
  </div>;
}

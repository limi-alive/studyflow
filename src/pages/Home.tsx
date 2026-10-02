import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { Flame, Play, Target, Zap } from 'lucide-react';
import { Card } from '../components/Card';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useSettings } from '../hooks/useSettings';
import { formatAppDate, localText } from '../lib/locale';
import { db } from '../lib/db';
import { dailySeries, totalStudySeconds } from '../utils/stats';
import { formatDuration, startOfLocalDay } from '../utils/time';

export default function HomePage() {
  const { userId } = useCurrentUser();
  const settings = useSettings(userId);
  const navigate = useNavigate();
  const sessions = useLiveQuery(() => db.sessions.where('userId').equals(userId).filter(x => !x.deletedAt).toArray(), [userId]) ?? [];
  const goals = useLiveQuery(() => db.goals.where('userId').equals(userId).filter(x => !x.deletedAt && x.period === 'daily').toArray(), [userId]) ?? [];
  const tasks = useLiveQuery(() => db.tasks.where('userId').equals(userId).filter(x => !x.deletedAt && x.status !== 'completed' && x.status !== 'archived').toArray(), [userId]) ?? [];
  const todayStart = startOfLocalDay().getTime();
  const today = sessions.filter(s => new Date(s.endTime).getTime() >= todayStart);
  const todaySeconds = dailySeries(sessions, 1)[0]?.seconds ?? 0;
  const series = dailySeries(sessions, 7);
  const goalSeconds = ((goals[0]?.target ?? 300) as number) * 60;
  const progress = Math.min(100, (todaySeconds / goalSeconds) * 100);

  return <div className="page">
    <header className="page-header"><div><div className="eyebrow">{formatAppDate(new Date(), settings, {weekday:'long',month:'long',day:'numeric'})}</div><h1>{localText(settings,'Good evening.','عصر بخیر.')}</h1><p className="subtle">{localText(settings,'Start studying first. Configure later.','اول مطالعه را شروع کن؛ تنظیمات بعداً.')}</p></div></header>
    <div className="grid grid-2">
      <Card className="hero-card">
        <div className="eyebrow">Today</div><div className="big-number" style={{margin:'18px 0 8px'}}>{formatDuration(todaySeconds)}</div><div className="subtle">of {formatDuration(goalSeconds)} daily target</div>
        <div className="progress" style={{margin:'22px 0'}}><div style={{width:`${progress}%`}}/></div>
        <button className="button primary" onClick={() => navigate('/timer')}><Play size={18}/> Start focus</button>
      </Card>
      <div className="grid grid-2">
        <Card><div className="metric"><Target size={20}/><span className="subtle">Daily progress</span><strong>{Math.round(progress)}%</strong></div></Card>
        <Card><div className="metric"><Flame size={20}/><span className="subtle">Active days</span><strong>{new Set(sessions.map(s=>new Date(s.startTime).toLocaleDateString())).size}</strong></div></Card>
        <Card><div className="metric"><Zap size={20}/><span className="subtle">Sessions today</span><strong>{today.length}</strong></div></Card>
        <Card><div className="metric"><span className="subtle">All-time study</span><strong>{Math.round(totalStudySeconds(sessions)/3600)}h</strong></div></Card>
      </div>
      <Card>
        <div className="page-header" style={{marginBottom:10}}><div><strong>Today's tasks</strong><div className="subtle">{tasks.length} open</div></div><button className="button ghost" onClick={()=>navigate('/planner')}>Open planner</button></div>
        {tasks.length ? <div className="list">{tasks.slice(0,5).map(t=><div className="list-item" key={t.id}><span>{t.title}</span><span className="subtle">{t.estimatedMinutes ? `${t.estimatedMinutes}m` : '—'}</span></div>)}</div> : <div className="empty">No tasks yet.</div>}
      </Card>
      <Card>
        <strong>Weekly progress</strong><div className="subtle">Last seven days</div>
        <div className="chart-bars">{series.map(x => { const max = Math.max(...series.map(v=>v.seconds),1); return <div key={x.date} className="chart-bar" title={`${x.date}: ${formatDuration(x.seconds)}`} style={{height:`${Math.max(3,x.seconds/max*100)}%`}}/>; })}</div>
      </Card>
    </div>
  </div>;
}

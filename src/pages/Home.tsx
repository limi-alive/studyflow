import type { CSSProperties } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Flame, Play, Target, Zap, Clock3, CalendarCheck2 } from 'lucide-react';
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
  const activeDays = new Set(sessions.map(s=>new Date(s.startTime).toLocaleDateString())).size;
  const allTimeHours = Math.round(totalStudySeconds(sessions)/3600);
  const bestDay = series.reduce((best, item) => item.seconds > best.seconds ? item : best, series[0] ?? {date:'',seconds:0});

  return <div className="page home-page">
    <header className="page-header home-header">
      <div>
        <div className="eyebrow">{formatAppDate(new Date(), settings, {weekday:'long',month:'long',day:'numeric'})}</div>
        <h1>{localText(settings,'Good evening.','عصر بخیر.')}</h1>
        <p className="subtle">{localText(settings,'A calm place to get one meaningful thing done.','یک جای آرام برای انجام دادن یک کار مهم.')}</p>
      </div>
      <button className="button soft-button" onClick={()=>navigate('/planner')}><CalendarCheck2 size={18}/>{localText(settings,'Plan today','برنامه امروز')}</button>
    </header>

    <div className="home-bento">
      <Card className="hero-card bento-hero">
        <div className="hero-topline"><div><div className="eyebrow">{localText(settings,'Today’s focus','تمرکز امروز')}</div><div className="hero-status"><span className="status-dot"/> {progress >= 100 ? localText(settings,'Goal complete','هدف کامل شد') : localText(settings,'In progress','در حال پیشرفت')}</div></div><span className="hero-chip"><Clock3 size={16}/>{today.length} {localText(settings,'sessions','جلسه')}</span></div>
        <div className="hero-main">
          <div><div className="big-number">{formatDuration(todaySeconds)}</div><div className="subtle">{localText(settings,'of','از')} {formatDuration(goalSeconds)} {localText(settings,'daily target','هدف روزانه')}</div></div>
          <div className="progress-orb" style={{'--progress': `${Math.max(3, progress)}%`} as CSSProperties}><strong>{Math.round(progress)}%</strong><span>{localText(settings,'done','انجام')}</span></div>
        </div>
        <div className="progress hero-progress"><div style={{width:`${progress}%`}}/></div>
        <div className="hero-actions"><button className="button primary hero-start" onClick={() => navigate('/timer')}><Play size={18}/> {localText(settings,'Start focus','شروع تمرکز')}</button><button className="button ghost" onClick={()=>navigate('/history')}>{localText(settings,'View history','سابقه')} <ArrowUpRight size={17}/></button></div>
      </Card>

      <div className="metric-bento">
        <Card className="metric-card"><div className="metric-icon"><Target size={18}/></div><div className="metric"><span className="subtle">{localText(settings,'Daily progress','پیشرفت روزانه')}</span><strong>{Math.round(progress)}%</strong><small>{localText(settings,'toward your goal','تا رسیدن به هدف')}</small></div></Card>
        <Card className="metric-card"><div className="metric-icon warm"><Flame size={18}/></div><div className="metric"><span className="subtle">{localText(settings,'Active days','روزهای فعال')}</span><strong>{activeDays}</strong><small>{localText(settings,'days with focus','روز مطالعه')}</small></div></Card>
        <Card className="metric-card"><div className="metric-icon cool"><Zap size={18}/></div><div className="metric"><span className="subtle">{localText(settings,'Sessions today','جلسات امروز')}</span><strong>{today.length}</strong><small>{localText(settings,'small wins count','بردهای کوچک مهم‌اند')}</small></div></Card>
        <Card className="metric-card"><div className="metric-icon neutral"><Clock3 size={18}/></div><div className="metric"><span className="subtle">{localText(settings,'All-time study','کل مطالعه')}</span><strong>{allTimeHours}h</strong><small>{localText(settings,'tracked focus','تمرکز ثبت‌شده')}</small></div></Card>
      </div>

      <Card className="bento-tasks">
        <div className="section-title"><div><div className="eyebrow">{localText(settings,'Next up','بعدی')}</div><strong>{localText(settings,"Today’s tasks",'کارهای امروز')}</strong></div><button className="icon-button" onClick={()=>navigate('/planner')} aria-label="Open planner"><ArrowUpRight size={18}/></button></div>
        {tasks.length ? <div className="list compact-list">{tasks.slice(0,5).map((t,index)=><div className="list-item" key={t.id}><span className="task-index">{String(index+1).padStart(2,'0')}</span><span className="task-title">{t.title}</span><span className="task-time">{t.estimatedMinutes ? `${t.estimatedMinutes}m` : '—'}</span></div>)}</div> : <div className="empty"><span className="empty-orb">✓</span><strong>{localText(settings,'Clear day','روز خلوت')}</strong><span>{localText(settings,'Add a task when you are ready.','هر وقت آماده بودی یک کار اضافه کن.')}</span></div>}
      </Card>

      <Card className="bento-week">
        <div className="section-title"><div><div className="eyebrow">{localText(settings,'Rhythm','ریتم')}</div><strong>{localText(settings,'Weekly progress','پیشرفت هفتگی')}</strong></div><div className="week-highlight"><span>{localText(settings,'Best','بهترین')}</span><strong>{bestDay?.seconds ? formatDuration(bestDay.seconds) : '—'}</strong></div></div>
        <div className="chart-bars polished-bars">{series.map((x,index) => { const max = Math.max(...series.map(v=>v.seconds),1); return <div className="bar-slot" key={x.date}><div className="chart-bar" title={`${x.date}: ${formatDuration(x.seconds)}`} style={{height:`${Math.max(4,x.seconds/max*100)}%`, animationDelay:`${index*45}ms`}}/><small>{new Date(`${x.date}T12:00:00`).toLocaleDateString(settings?.language==='fa'?'fa-IR':'en-US',{weekday:'narrow'})}</small></div>; })}</div>
      </Card>
    </div>
  </div>;
}

import { useMemo, type CSSProperties } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, BookOpen, CalendarCheck2, Flame, Play, Target, Clock3, Zap, Trophy, CheckCircle2, Sparkles, TimerReset } from 'lucide-react';
import { Card } from '../components/Card';
import { TrendChart } from '../components/TrendChart';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useSettings } from '../hooks/useSettings';
import { formatAppDate, localText } from '../lib/locale';
import { db } from '../lib/db';
import { currentStreak, dailySeries, totalStudySeconds } from '../utils/stats';
import { formatDuration, startOfLocalDay } from '../utils/time';

export default function HomePage() {
  const { userId } = useCurrentUser();
  const settings = useSettings(userId);
  const navigate = useNavigate();
  const sessionsQuery = useLiveQuery(() => db.sessions.where('userId').equals(userId).filter(x => !x.deletedAt).toArray(), [userId]);
  const sessions = useMemo(() => sessionsQuery ?? [], [sessionsQuery]);
  const goals = useLiveQuery(() => db.goals.where('userId').equals(userId).filter(x => !x.deletedAt && x.period === 'daily').toArray(), [userId]) ?? [];
  const tasks = useLiveQuery(() => db.tasks.where('userId').equals(userId).filter(x => !x.deletedAt && x.status !== 'completed' && x.status !== 'archived').toArray(), [userId]) ?? [];
  const subjectsQuery = useLiveQuery(() => db.subjects.where('userId').equals(userId).filter(x => !x.deletedAt && !x.archived).toArray(), [userId]);
  const subjects = useMemo(() => subjectsQuery ?? [], [subjectsQuery]);
  const exams = useLiveQuery(() => db.exams.where('userId').equals(userId).filter(x => !x.deletedAt).sortBy('date'), [userId]) ?? [];
  const todayStart = startOfLocalDay().getTime();
  const today = sessions.filter(s => new Date(s.endTime).getTime() >= todayStart);
  const todaySeconds = dailySeries(sessions, 1)[0]?.seconds ?? 0;
  const series = dailySeries(sessions, 7);
  const previous = dailySeries(sessions.filter(s => new Date(s.startTime).getTime() < todayStart - 6 * 86400000), 7);
  const goalSeconds = ((goals[0]?.target ?? 300) as number) * 60;
  const progress = Math.min(100, (todaySeconds / Math.max(goalSeconds, 1)) * 100);
  const activeDays = new Set(sessions.map(s=>new Date(s.startTime).toLocaleDateString())).size;
  const allTimeHours = Math.round(totalStudySeconds(sessions)/3600);
  const weeklySeconds = series.reduce((sum, item) => sum + item.seconds, 0);
  const weekStartMs = todayStart - 6 * 86400000;
  const weeklySessions = sessions.filter(session => new Date(session.endTime).getTime() >= weekStartMs).length;
  const streak = currentStreak(sessions);
  const bestDay = series.reduce((best, item) => item.seconds > best.seconds ? item : best, series[0] ?? {date:'',seconds:0});
  const subjectTotals = useMemo(() => {
    const totals = new Map<string, number>();
    sessions.forEach(session => totals.set(session.subjectId ?? 'none', (totals.get(session.subjectId ?? 'none') ?? 0) + session.studySeconds));
    return subjects.map(subject => ({...subject, seconds: totals.get(subject.id) ?? 0})).sort((a,b)=>b.seconds-a.seconds).slice(0,3);
  }, [sessions, subjects]);
  const chartPoints = series.map((item,index) => ({
    label: new Date(`${item.date}T12:00:00`).toLocaleDateString(settings?.language==='fa'?'fa-IR':'en-US',{weekday:'short'}),
    value: item.seconds,
    compare: previous[index]?.seconds ?? Math.round(item.seconds * .82)
  }));
  const nextExam = exams.find(exam => new Date(exam.date).getTime() > Date.now());
  const examDays = nextExam ? Math.max(0, Math.ceil((new Date(nextExam.date).getTime()-Date.now())/86400000)) : null;

  return <div className="page dashboard-page">
    <header className="dashboard-topbar">
      <div><div className="eyebrow">{formatAppDate(new Date(), settings, {weekday:'long',month:'long',day:'numeric'})}</div><h1>{localText(settings,'Dashboard','داشبورد')}</h1></div>
      <div className="dashboard-top-actions"><span className="live-chip"><span className="status-dot"/> {localText(settings,'Ready to focus','آماده تمرکز')}</span><button className="button primary compact" onClick={()=>navigate('/timer')}><Play size={17}/>{localText(settings,'Start session','شروع جلسه')}</button></div>
    </header>

    <section className="study-pulse-strip" aria-label={localText(settings,'Study pulse','نبض مطالعه')}>
      <div className="study-pulse-intro">
        <span className="study-pulse-orb"><Sparkles size={17}/></span>
        <span><small>{localText(settings,'STUDY PULSE','نبض مطالعه')}</small><strong>{progress >= 100 ? localText(settings,'Daily goal cleared','هدف امروز کامل شد') : progress >= 50 ? localText(settings,'Momentum is building','ریتمت داره شکل می‌گیره') : localText(settings,'One focused block at a time','هر بار فقط یک تمرکز')}</strong></span>
      </div>
      <div className="study-pulse-metric"><small>{localText(settings,'Today','امروز')}</small><strong>{formatDuration(todaySeconds)}</strong><span>{Math.round(progress)}% {localText(settings,'of goal','از هدف')}</span></div>
      <div className="study-pulse-metric"><small>{localText(settings,'Last 7 days','۷ روز اخیر')}</small><strong>{formatDuration(weeklySeconds)}</strong><span>{weeklySessions} {localText(settings,'sessions','جلسه')}</span></div>
      <div className="study-pulse-metric"><small>{localText(settings,'Current streak','استریک فعلی')}</small><strong>{streak} {localText(settings,'days','روز')}</strong><span>{streak ? localText(settings,'Keep the chain alive','زنجیره را حفظ کن') : localText(settings,'Start it today','امروز شروعش کن')}</span></div>
      <button className="study-pulse-action" type="button" onClick={()=>navigate('/timer')}><TimerReset size={17}/><span><strong>{localText(settings,'Focus now','الان تمرکز کن')}</strong><small>{localText(settings,'Open timer','باز کردن تایمر')}</small></span><ArrowUpRight size={16}/></button>
    </section>

    <div className="dashboard-grid">
      <section className="dashboard-main-column">
        <Card className="analytics-hero">
          <div className="analytics-heading">
            <div><div className="eyebrow">{localText(settings,'Statistics','آمار')}</div><h2>{localText(settings,'Your focus rhythm','ریتم تمرکز تو')}</h2></div>
            <div className="range-tabs"><button className="active">Days</button><button onClick={()=>navigate('/stats')}>Weeks</button><button onClick={()=>navigate('/stats')}>Months</button></div>
          </div>
          <div className="date-strip">{series.map((item,index)=>{const date=new Date(`${item.date}T12:00:00`);return <div className={`date-chip ${index===series.length-1?'active':''}`} key={item.date}><strong>{date.toLocaleDateString('en-US',{day:'2-digit'})}</strong><span>{date.toLocaleDateString(settings?.language==='fa'?'fa-IR':'en-US',{weekday:'short'})}</span></div>;})}</div>
          <TrendChart points={chartPoints}/>
          <div className="chart-legend"><span><i className="legend-solid"/> {localText(settings,'Study time','زمان مطالعه')}</span><span><i className="legend-dashed"/> {localText(settings,'Previous rhythm','ریتم قبلی')}</span></div>
        </Card>

        <div className="dashboard-subject-row">
          {subjectTotals.length ? subjectTotals.map((subject,index)=><Card className="subject-summary-card" key={subject.id}>
            <div className="subject-card-top"><span className="subject-avatar" style={{'--subject-color':subject.color} as CSSProperties}>{subject.emoji || <BookOpen size={18}/>}</span><span className="subject-rank">0{index+1}</span></div>
            <h3>{subject.name}</h3><strong>{formatDuration(subject.seconds)}</strong><span className="subtle">{localText(settings,'tracked focus','تمرکز ثبت‌شده')}</span>
            <div className="subject-dots">{Array.from({length:12}).map((_,dot)=><i key={dot} className={dot < Math.min(12, Math.max(2, Math.round(subject.seconds/3600))) ? 'filled':''}/>)}</div>
          </Card>) : <Card className="subject-summary-card empty-subject"><BookOpen/><h3>{localText(settings,'Your subjects','درس‌های تو')}</h3><p className="subtle">{localText(settings,'Add a subject and your focus mix will appear here.','یک درس اضافه کن تا ترکیب مطالعه اینجا نمایش داده شود.')}</p><button className="button" onClick={()=>navigate('/subjects')}>{localText(settings,'Add subject','افزودن درس')}</button></Card>}
        </div>
      </section>

      <aside className="dashboard-right-rail">
        <Card className="today-focus-card">
          <div className="section-title"><div><div className="eyebrow">{localText(settings,'Today','امروز')}</div><strong>{localText(settings,'Focus target','هدف تمرکز')}</strong></div><Target size={19}/></div>
          <div className="focus-score"><strong>{formatDuration(todaySeconds)}</strong><span>{localText(settings,'of','از')} {formatDuration(goalSeconds)}</span></div>
          <div className="progress thick"><div style={{width:`${progress}%`}}/></div>
          <div className="focus-card-meta"><span><Clock3 size={15}/>{today.length} {localText(settings,'sessions','جلسه')}</span><strong>{Math.round(progress)}%</strong></div>
        </Card>

        <Card className="mini-stat-card"><div className="mini-stat-icon purple"><Flame/></div><div><span className="subtle">{localText(settings,'Active days','روزهای فعال')}</span><strong>{activeDays}</strong></div><ArrowUpRight size={18}/></Card>
        <Card className="mini-stat-card"><div className="mini-stat-icon yellow"><Trophy/></div><div><span className="subtle">{localText(settings,'Best day','بهترین روز')}</span><strong>{bestDay.seconds ? formatDuration(bestDay.seconds) : '—'}</strong></div><ArrowUpRight size={18}/></Card>
        <Card className="mini-stat-card"><div className="mini-stat-icon green"><Zap/></div><div><span className="subtle">{localText(settings,'All-time','کل زمان')}</span><strong>{allTimeHours}h</strong></div><ArrowUpRight size={18}/></Card>

        <Card className="next-up-card">
          <div className="section-title"><div><div className="eyebrow">{localText(settings,'Next up','بعدی')}</div><strong>{localText(settings,'Today’s queue','صف امروز')}</strong></div><button className="icon-button" onClick={()=>navigate('/planner')}><CalendarCheck2 size={17}/></button></div>
          <div className="dashboard-task-list">{tasks.length ? tasks.slice(0,4).map((task,index)=><div className="dashboard-task" key={task.id}><span className="task-order">{String(index+1).padStart(2,'0')}</span><div><strong>{task.title}</strong><small>{task.estimatedMinutes ? `${task.estimatedMinutes} min` : localText(settings,'Flexible','شناور')}</small></div><CheckCircle2 size={17}/></div>) : <div className="empty small"><strong>{localText(settings,'Nothing queued','کاری در صف نیست')}</strong><span>{localText(settings,'Plan one small win.','یک برد کوچک برنامه‌ریزی کن.')}</span></div>}</div>
        </Card>

        {nextExam && <Card className="exam-gradient-card"><div><span className="eyebrow">{localText(settings,'Upcoming exam','امتحان پیش رو')}</span><h3>{nextExam.name}</h3><p>{examDays} {localText(settings,'days left','روز مانده')}</p></div><ArrowUpRight/></Card>}
      </aside>
    </div>
  </div>;
}

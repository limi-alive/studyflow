import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { ArrowUpLeft, BookOpenCheck, BrainCircuit, CalendarClock, Check, ChevronLeft, CircleHelp, Clock3, Flame, Focus, Lightbulb, ListTodo, Plus, Play, RefreshCw, Sparkles, Target, TrendingUp, Zap } from 'lucide-react';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useTimePulse } from '../hooks/useTimePulse';
import { db, nowIso } from '../lib/db';
import { useTimerStore } from '../stores/timerStore';
import { buildStudyOS, type StudyOSItem } from '../utils/studyOS';
import { formatPersianNumber, persianDateLabel } from '../utils/persianCalendar';

const CAPACITIES = [45, 90, 150, 240] as const;
const toNum = (num: number) => formatPersianNumber(num);
const mins = (value: number) => `${toNum(value)} دقیقه`;

function FocusGlyph({kind}:{kind: StudyOSItem['kind']}) {
  return kind === 'task' ? <ListTodo size={19}/> : kind === 'review' ? <BrainCircuit size={19}/> : <Target size={19}/>;
}

function TaskRow({item, order, onStart, onDone, disabled}:{item:StudyOSItem;order:number;onStart:(item:StudyOSItem)=>void;onDone:(id:string)=>void;disabled:boolean}) {
  return <article className="studyos-plan-row">
    <div className="studyos-plan-index">{toNum(order)}</div>
    <span className={`studyos-plan-icon type-${item.kind}`}><FocusGlyph kind={item.kind}/></span>
    <div className="studyos-plan-copy"><strong>{item.title}</strong><small>{item.subtitle}</small></div>
    <span className="studyos-plan-length"><Clock3 size={13}/>{mins(item.minutes)}</span>
    <div className="studyos-plan-actions">
      {item.kind === 'task' && item.taskId && <button type="button" className="studyos-icon-button" onClick={()=>onDone(item.taskId!)} title="علامت‌گذاری به‌عنوان انجام‌شده" aria-label={`تکمیل ${item.title}`}><Check size={18}/></button>}
      <button type="button" className="studyos-small-cta" onClick={()=>onStart(item)} aria-label={`شروع تمرکز برای ${item.title}`}>{disabled ? 'تایمر فعال' : 'شروع'}<Play size={14}/></button>
    </div>
  </article>;
}

export default function StudyOSPage() {
  const { userId } = useCurrentUser();
  const navigate = useNavigate();
  const active = useTimerStore(s => s.active);
  const now = useTimePulse();
  const tasks = useLiveQuery(()=>db.tasks.where('userId').equals(userId).toArray(),[userId]);
  const subjects = useLiveQuery(()=>db.subjects.where('userId').equals(userId).toArray(),[userId]);
  const exams = useLiveQuery(()=>db.exams.where('userId').equals(userId).toArray(),[userId]);
  const sessions = useLiveQuery(()=>db.sessions.where('userId').equals(userId).toArray(),[userId]);
  const [capacity,setCapacity] = useState<number>(90);
  const [tab,setTab] = useState<'plan'|'exams'|'insights'|'recall'>('plan');
  const [recallSubject,setRecallSubject] = useState<string>('');
  const [revealed,setRevealed] = useState(false);
  const [recallNotes,setRecallNotes] = useState('');
  const [message,setMessage] = useState('');
  const [quickTitle,setQuickTitle] = useState('');
  const [quickSubject,setQuickSubject] = useState('');
  const [quickMinutes,setQuickMinutes] = useState(25);
  const loading = tasks === undefined || subjects === undefined || exams === undefined || sessions === undefined;

  useEffect(()=>{
    setQuickSubject('');
    setQuickTitle('');
    setMessage('');
    try { const n=Number(localStorage.getItem(`studyflow.studiosos.capacity.${userId}`));setCapacity(CAPACITIES.includes(n as typeof CAPACITIES[number]) ? n : 90); } catch {setCapacity(90);}
  },[userId]);
  const changeCapacity=(value:number)=>{
    setCapacity(value);
    try {localStorage.setItem(`studyflow.studiosos.capacity.${userId}`,String(value));} catch { /* private mode */ }
  };
  const snapshot = useMemo(()=>buildStudyOS({userId,tasks:tasks??[],subjects:subjects??[],exams:exams??[],sessions:sessions??[],now:new Date(now),capacityMinutes:capacity}),[userId,tasks,subjects,exams,sessions,now,capacity]);
  const focusItems = snapshot.plan;
  const todayFormat = persianDateLabel(new Date(now),{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  const delta = snapshot.previousSeconds ? Math.round((snapshot.weeklySeconds-snapshot.previousSeconds)/snapshot.previousSeconds*100) : null;
  const chartMax=Math.max(1,...snapshot.days);
  const reviewSubject = (subjects??[]).find(s=>s.id===recallSubject && !s.archived && !s.deletedAt);
  const recalled = Boolean(reviewSubject);

  const startFocus=(item:StudyOSItem)=>{
    if (active) {navigate('/timer');return;}
    useTimerStore.getState().start({userId,subjectId:item.subjectId,taskId:item.taskId??null,timerType:'countdown',durationSeconds:item.minutes*60});
    navigate('/timer');
  };
  const markDone=async(id:string)=>{
    const existing=await db.tasks.get(id);
    if (!existing || existing.userId!==userId || existing.deletedAt || existing.status==='completed') return;
    const at=nowIso();
    await db.tasks.update(id,{status:'completed',completedAt:at,updatedAt:at,syncStatus:'pending'});
    window.dispatchEvent(new CustomEvent('studyflow:sync-needed',{detail:{userId}}));
    setMessage('کار با موفقیت تکمیل شد.');
  };
  const quickAdd=async(event:FormEvent)=>{
    event.preventDefault();
    const title=quickTitle.trim();
    if (!title) return;
    const at=nowIso();
    const selectedSubject=quickSubject && (subjects??[]).some(s=>s.id===quickSubject && !s.deletedAt && !s.archived && s.userId===userId) ? quickSubject : null;
    await db.tasks.add({id:crypto.randomUUID(),userId,title,subjectId:selectedSubject,topicId:null,priority:2,estimatedMinutes:quickMinutes,deadline:null,status:'todo',createdAt:at,updatedAt:at,syncStatus:'pending'});
    window.dispatchEvent(new CustomEvent('studyflow:sync-needed',{detail:{userId}}));
    setQuickTitle('');
    setMessage('کار جدید به برنامه اضافه شد.');
  };
  const tabs=[{id:'plan',name:'برنامه امروز',Icon:ListTodo},{id:'exams',name:'رادار امتحان',Icon:CalendarClock},{id:'insights',name:'تحلیل عملکرد',Icon:TrendingUp},{id:'recall',name:'مرور فعال',Icon:BrainCircuit}] as const;

  return <div className="page studyos-page" dir="rtl">
    <header className="studyos-head">
      <div className="studyos-kicker"><span className="studyos-live-dot"/> STUDY OS <span className="studyos-separator">/</span> {todayFormat}</div>
      <div className="studyos-hero-row"><div><h1>اتاق فرمان مطالعه <span>✦</span></h1><p>با زمان محدودت هوشمندتر پیش برو؛ اولویت بعدی، مرورهای ضروری و آمادگی امتحان‌ها همه در یک جا.</p></div><button className="studyos-hero-start" onClick={()=>active?navigate('/timer'):focusItems[0]?startFocus(focusItems[0]):navigate('/timer')}><Play size={19} fill="currentColor"/> {active?'ادامه جلسه':'شروع تمرکز'} <ChevronLeft size={18}/></button></div>
      <div className="studyos-ambient" aria-hidden="true"/>
    </header>

    <section className="studyos-stats" aria-label="خلاصه وضعیت مطالعه">
      <article><span><Focus size={17}/> برنامه پیشنهادی</span><strong>{toNum(snapshot.plan.length)} <em>بخش</em></strong><small>{mins(snapshot.allocated)} از {mins(snapshot.capacity)}</small></article>
      <article><span><Flame size={17}/> فعالیت این هفته</span><strong>{toNum(snapshot.activeDays)} <em>روز</em></strong><small>در هفت روز اخیر</small></article>
      <article><span><Clock3 size={17}/> تمرکز هفتگی</span><strong>{toNum(Math.round(snapshot.weeklySeconds/60))} <em>دقیقه</em></strong><small>{delta===null?'هنوز دوره مقایسه نداریم':`${delta>=0?'+':''}${toNum(delta)}٪ نسبت به هفته قبل`}</small></article>
      <article><span><CalendarClock size={17}/> امتحان بعدی</span><strong>{snapshot.upcoming.length?toNum(snapshot.upcoming[0].daysLeft):'—'} <em>{snapshot.upcoming.length?'روز':'بدون تاریخ'}</em></strong><small>{snapshot.upcoming[0]?.title??'در Planner امتحان ثبت کن'}</small></article>
    </section>

    <nav className="studyos-tabs" aria-label="بخش‌های StudyOS">{tabs.map(({id,name,Icon})=><button type="button" key={id} className={tab===id?'is-active':''} aria-current={tab===id?'page':undefined} onClick={()=>setTab(id)}><Icon size={17}/><span>{name}</span></button>)}</nav>

    {tab==='plan' && <section className="studyos-layout">
      <div className="studyos-panel studyos-main-panel">
        <div className="studyos-panel-heading"><div><span className="studyos-overline">SMART DAILY PLAN</span><h2>امروز چی بخونم؟</h2><p>بر اساس زمان آزاد، تکلیف‌های باز، امتحان‌های نزدیک و درس‌هایی که مرور نشده‌اند.</p></div><Zap size={23}/></div>
        <form className="studyos-quickadd" onSubmit={event=>void quickAdd(event)} aria-label="ثبت سریع تکلیف">
          <label className="studyos-quickadd-title"><span>ثبت سریع یک کار</span><input className="input" value={quickTitle} onChange={event=>setQuickTitle(event.target.value)} maxLength={130} placeholder="مثلاً حل ۱۰ تست از فصل دوم"/></label>
          <label><span>درس</span><select className="input" value={quickSubject} onChange={event=>setQuickSubject(event.target.value)}><option value="">بدون درس</option>{(subjects??[]).filter(s=>!s.deletedAt&&!s.archived).map(s=><option value={s.id} key={s.id}>{s.name}</option>)}</select></label>
          <label><span>زمان</span><select className="input" value={quickMinutes} onChange={event=>setQuickMinutes(Number(event.target.value))}><option value={15}>۱۵ دقیقه</option><option value={25}>۲۵ دقیقه</option><option value={45}>۴۵ دقیقه</option><option value={60}>۶۰ دقیقه</option></select></label>
          <button type="submit" disabled={!quickTitle.trim()}><Plus size={17}/> افزودن</button>
        </form>
        <div className="studyos-capacity"><div><span>زمان قابل اختصاص امروز</span><small>این تنظیم فقط روی همین دستگاه ذخیره می‌شود.</small></div><div className="studyos-capacity-buttons">{CAPACITIES.map(n=><button key={n} type="button" className={capacity===n?'selected':''} onClick={()=>changeCapacity(n)}>{toNum(n)} <small>دقیقه</small></button>)}</div></div>
        <div className="studyos-budget"><div><span>برنامه آماده</span><strong>{mins(snapshot.allocated)} / {mins(snapshot.capacity)}</strong></div><div className="studyos-budget-track"><i style={{width:`${Math.min(100,snapshot.allocated/snapshot.capacity*100)}%`}}/></div></div>
        {loading?<div className="studyos-empty">در حال خواندن برنامه ذخیره‌شده...</div>:focusItems.length?<div className="studyos-plan-list">{focusItems.map((item,i)=><TaskRow key={item.id} item={item} order={i+1} onStart={startFocus} onDone={id=>void markDone(id)} disabled={Boolean(active)}/>)}</div>:<div className="studyos-empty"><BookOpenCheck size={32}/><strong>صف مطالعه فعلاً خالی است</strong><p>یک درس، تکلیف یا امتحان در Planner ثبت کن تا برنامه شخصی ساخته شود.</p><button onClick={()=>navigate('/planner')}>رفتن به برنامه‌ریز <ChevronLeft size={15}/></button></div>}
        {message && <p className="studyos-feedback" role="status">{message}</p>}
        <div className="studyos-panel-foot"><span><CircleHelp size={15}/> اولویت‌ها پیشنهادی‌اند و قابل تغییر با تکمیل تکلیف‌ها.</span><button onClick={()=>navigate('/planner')}>مدیریت کارها <ArrowUpLeft size={15}/></button></div>
      </div>
      <aside className="studyos-side">
        <div className="studyos-panel studyos-next"><span className="studyos-overline">NEXT BEST STEP</span><div className="studyos-next-symbol"><Sparkles size={23}/></div><h3>{focusItems[0]?.title??'یک هدف کوچک انتخاب کن'}</h3><p>{focusItems[0]?.subtitle??'برای شروع یک تکلیف تعریف کن یا مطالعه آزاد را آغاز کن.'}</p><button onClick={()=>focusItems[0]?startFocus(focusItems[0]):navigate('/timer')}>{focusItems[0]?`شروع ${mins(focusItems[0].minutes)}`:'رفتن به تایمر'} <Play size={16}/></button></div>
        <div className="studyos-panel studyos-method"><span className="studyos-overline">FOCUS METHOD</span><h3><Lightbulb size={18}/> تکنیک ۲ + ۲۵ + ۳</h3><p>۲ دقیقه مشخص‌کردن هدف، ۲۵ دقیقه تمرکز بدون وقفه، ۳ دقیقه نوشتن چیزهایی که یاد گرفتی.</p><span>پیشنهاد عملی، نه تضمین علمیِ عملکرد</span></div>
      </aside>
    </section>}

    {tab==='exams' && <section className="studyos-panel studyos-wide"><div className="studyos-panel-heading"><div><span className="studyos-overline">EXAM RADAR</span><h2>آمادگی امتحان‌ها</h2><p>زمان باقی‌مانده و حجم مطالعه لازم را با توجه به هدفی که خودت ثبت کرده‌ای ببین.</p></div><CalendarClock size={24}/></div>
      {snapshot.upcoming.length?<div className="studyos-exam-grid">{snapshot.upcoming.map(e=><article key={e.id} className="studyos-exam"><div className="studyos-exam-top"><span>{e.daysLeft<=3?'نزدیک':e.daysLeft<=7?'این هفته':'در راه'}</span><strong>{toNum(e.daysLeft)} <small>روز مانده</small></strong></div><h3>{e.title}</h3><p>{persianDateLabel(e.date,{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</p><div className="studyos-exam-stats"><div><small>مطالعه ۳۰ روز اخیر{e.subjectId?' برای این درس':''}</small><strong>{mins(e.studiedMinutes)}</strong></div><div><small>هدف باقی‌مانده</small><strong>{e.remainingMinutes===null?'تعریف نشده':mins(e.remainingMinutes)}</strong></div></div><div className="studyos-exam-bottom"><span>{e.dailyMinutes===null?'برای محاسبه سرعت لازم، هدف ساعات امتحان را ثبت کن.':e.remainingMinutes===0?'هدف زمانی ثبت‌شده تکمیل شده.':`میانگین موردنیاز: ${mins(e.dailyMinutes)} در روز`}</span>{e.subjectId&&<button onClick={()=>startFocus({id:`exam:${e.id}`,kind:'exam',title:e.title,subtitle:'آمادگی امتحان',subjectId:e.subjectId,minutes:25,score:1})}>تمرکز <Play size={14}/></button>}</div></article>)}</div>:<div className="studyos-empty"><CalendarClock size={32}/><strong>امتحان پیش‌رو ثبت نشده</strong><p>تاریخ امتحان‌ها را در Planner اضافه کن تا اینجا برنامه واقعی دریافت کنی.</p><button onClick={()=>navigate('/planner')}>افزودن امتحان <ChevronLeft size={15}/></button></div>}
      <p className="studyos-note">محاسبه هدف باقی‌مانده بر اساس مطالعه ثبت‌شده همان درس در ۳۰ روز اخیر است؛ این یک تخمین برنامه‌ریزی است، نه پیش‌بینی نمره امتحان.</p>
    </section>}

    {tab==='insights' && <section className="studyos-layout"><div className="studyos-panel studyos-main-panel"><div className="studyos-panel-heading"><div><span className="studyos-overline">STUDY INSIGHTS</span><h2>نقشه تمرکز ۷ روز اخیر</h2><p>رفتارت را ببین تا به‌جای افزایش فشار، ریتم مناسب‌تری بسازی.</p></div><TrendingUp size={24}/></div><div className="studyos-chart" aria-label="نمودار مطالعه هفت روز گذشته">{snapshot.days.map((seconds,i)=>{const d=new Date(now);d.setHours(12,0,0,0);d.setDate(d.getDate()-(6-i));return <div className="studyos-chart-column" key={i}><strong>{toNum(Math.round(seconds/60))}</strong><div className="studyos-chart-rail"><i style={{height:`${Math.max(seconds?7:0,seconds/chartMax*100)}%`}}/></div><small>{persianDateLabel(d,{weekday:'short'})}</small></div>;})}</div><div className="studyos-insight-footer"><div><strong>{mins(Math.round(snapshot.weeklySeconds/60))}</strong><span>جمع این هفته</span></div><div><strong>{mins(Math.round(snapshot.previousSeconds/60))}</strong><span>هفته قبل</span></div><div><strong>{toNum(snapshot.sessionsLast30)}</strong><span>جلسه در ۳۰ روز</span></div></div></div><aside className="studyos-side"><div className="studyos-panel studyos-next studyos-insight-card"><span className="studyos-overline">REFLECT</span><div className="studyos-next-symbol"><TrendingUp size={23}/></div><h3>{snapshot.activeDays>=5?'ریتم پایداری داری':snapshot.activeDays>=2?'در مسیر ساختن عادت':'با یک جلسه کوتاه شروع کن'}</h3><p>{snapshot.topSubject?`بیشترین زمان ماه اخیرت روی «${snapshot.topSubject}» بوده است.`:'با ثبت چند جلسه مطالعه، الگوی تمرکزت در این بخش مشخص می‌شود.'}</p><button onClick={()=>navigate('/stats')}>جزئیات آمار <ArrowUpLeft size={16}/></button></div></aside></section>}

    {tab==='recall' && <section className="studyos-layout"><div className="studyos-panel studyos-main-panel"><div className="studyos-panel-heading"><div><span className="studyos-overline">ACTIVE RECALL</span><h2>مرور دو دقیقه‌ای بدون جزوه</h2><p>قبل از نگاه‌کردن به یادداشت‌ها، تلاش کن آنچه یاد گرفته‌ای را با زبان خودت توضیح بدهی.</p></div><BrainCircuit size={25}/></div><label className="studyos-recall-select">موضوع مرور<select className="input" value={recallSubject} onChange={e=>{setRecallSubject(e.target.value);setRevealed(false);setRecallNotes('');}}><option value="">یک درس انتخاب کن</option>{(subjects??[]).filter(s=>!s.deletedAt&&!s.archived).map(s=><option value={s.id} key={s.id}>{s.name}</option>)}</select></label>{recalled?<><div className="studyos-recall-question"><span><BrainCircuit size={17}/> پرسش بازیابی</span><h3>سه نکته مهم از «{reviewSubject?.name}» را بدون نگاه به جزوه توضیح بده.</h3><p>یک مثال کاربردی هم بنویس و مشخص کن کدام قسمت را باید دوباره مرور کنی.</p></div><textarea className="studyos-recall-textarea" placeholder="اینجا فقط برای تمرین ذهنی بنویس..." rows={5} value={recallNotes} onChange={e=>setRecallNotes(e.target.value)} aria-label="یادداشت تمرین مرور"/><button className="studyos-recall-reveal" onClick={()=>setRevealed(value=>!value)}><RefreshCw size={16}/>{revealed?'پنهان‌کردن راهنما':'راهنمای ارزیابی خودت'}</button>{revealed&&<div className="studyos-recall-help"><strong>خودت را ارزیابی کن</strong><p>۱. نکته‌ها را درست توضیح دادی؟ ۲. مثال بدون کمک یادت آمد؟ ۳. چه بخشی مبهم است؟ مورد مبهم را به یک Task مرور تبدیل کن.</p><button onClick={()=>navigate('/planner')}>ساخت تکلیف مرور <ChevronLeft size={15}/></button></div>}<p className="studyos-note">متن تمرینی این بخش در دستگاه یا Cloud ذخیره نمی‌شود و با خروج از صفحه پاک خواهد شد.</p></>:<div className="studyos-empty"><BrainCircuit size={30}/><strong>از یک درس شروع کن</strong><p>این تمرین مکمل مرور فاصله‌دار است؛ زمان‌بندی هوشمند فلش‌کارت هنوز در این نسخه وجود ندارد.</p></div>}</div><aside className="studyos-side"><div className="studyos-panel studyos-method"><span className="studyos-overline">MEMORY TOOLKIT</span><h3><BrainCircuit size={18}/> تمرین بازیابی</h3><p>به‌جای دوباره‌خوانی منفعلانه، ابتدا تلاش کن مطالب را از حافظه برگردانی؛ بعد پاسخ را با منبع مقایسه کن.</p><span>برای مرورهای بعدی، از بخش برنامه امروز استفاده کن.</span></div></aside></section>}
  </div>;
}

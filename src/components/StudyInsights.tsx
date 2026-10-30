import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, ChevronLeft, ChevronRight, Download, Focus, History, Info } from 'lucide-react';
import type { StudySession, Subject, UserSettings } from '../types';
import { localText } from '../lib/locale';
import { useUiLanguage } from '../lib/uiLanguage';
import { PERSIAN_MONTHS, persianToGregorian } from '../utils/persianCalendar';
import { aggregateStudySessions, dailyStudyCsv, insightLevel, solarYearDays, tehranDayKey, tehranPersianLabel, tehranPersianYear, type StudySource } from '../utils/studyInsights';
import '../study-insights-v15.css';

const EN_MONTHS = ['Farvardin', 'Ordibehesht', 'Khordad', 'Tir', 'Mordad', 'Shahrivar', 'Mehr', 'Aban', 'Azar', 'Dey', 'Bahman', 'Esfand'];
const FA_WEEK = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
const EN_WEEK = ['Sa', 'Su', 'Mo', 'Tu', 'We', 'Th', 'Fr'];
const fmt = (value: number, fa: boolean) => new Intl.NumberFormat(fa ? 'fa-IR' : 'en-US', { maximumFractionDigits: 0 }).format(value);
function durationLabel(seconds: number, fa: boolean) {
  const minutes = Math.round(seconds / 60);
  const hours = Math.floor(minutes / 60), remaining = minutes % 60;
  if (!hours) return `${fmt(minutes, fa)} ${fa ? 'دقیقه' : 'min'}`;
  return `${fmt(hours, fa)}${fa ? ' ساعت' : 'h'}${remaining ? ` ${fmt(remaining, fa)}${fa ? ' دقیقه' : 'm'}` : ''}`;
}
function localDayLabel(key: string, fa: boolean) {
  const date = new Date(`${key}T12:00:00Z`);
  if (fa) return tehranPersianLabel(date);
  return new Intl.DateTimeFormat('en-US', { timeZone:'Asia/Tehran', year:'numeric', month:'long', day:'numeric' }).format(date);
}
function firstDayKey(year: number) {
  const g = persianToGregorian(year, 1, 1);
  return `${g.year}-${String(g.month).padStart(2, '0')}-${String(g.day).padStart(2, '0')}`;
}

export function StudyInsights({ sessions, subjects, settings, userId }:{sessions: StudySession[]; subjects: Subject[]; settings?: UserSettings; userId: string}) {
  const activeLanguage = useUiLanguage();
  const fa = (settings?.language ?? activeLanguage) === 'fa';
  const t = (en: string, persian: string) => localText(settings, en, persian);
  const navigate = useNavigate();
  const today = tehranDayKey(new Date());
  const currentYear = tehranPersianYear(new Date());
  const [year, setYear] = useState(currentYear);
  const [selectedDay, setSelectedDay] = useState(today);
  const [source, setSource] = useState<StudySource>('all');
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const monthDays = useMemo(() => solarYearDays(year), [year]);
  const values = useMemo(() => aggregateStudySessions(sessions, userId, source), [sessions, userId, source]);
  const allDays = useMemo(() => monthDays.flat(), [monthDays]);
  const yearSeconds = allDays.reduce((sum, day) => sum + (values.get(day.key)?.seconds ?? 0), 0);
  const activeDays = allDays.filter(day => (values.get(day.key)?.seconds ?? 0) > 0).length;
  const bestDay = allDays.reduce((best, day) => (values.get(day.key)?.seconds ?? 0) > (values.get(best)?.seconds ?? 0) ? day.key : best, allDays[0]?.key ?? today);
  const day = values.get(selectedDay);
  const dayTotal = day?.seconds ?? 0;
  const subjectMap = useMemo(() => new Map(subjects.filter(s=>!s.deletedAt).map(s => [s.id, s])), [subjects]);
  const selectedCell = selectedSlot !== null ? day?.cells[selectedSlot] : undefined;
  const sourceTabs = [{id:'all', en:'All sessions', fa:'همه جلسات'}, {id:'timer', en:'Focus timer', fa:'تایمر تمرکز'}, {id:'manual', en:'Manual entries', fa:'ثبت دستی'}] as const;

  const changeYear = (next: number) => {
    if (next < 1300 || next > currentYear) return;
    setYear(next);
    setSelectedDay(next === currentYear ? today : firstDayKey(next));
    setSelectedSlot(null);
  };
  const exportCsv = () => {
    const content = dailyStudyCsv(monthDays, values);
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = `studyflow-study-map-${year}.csv`;
    document.body.appendChild(anchor); anchor.click(); anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  return <section className="study-insights" aria-label={t('Study map', 'نقشه مطالعه')}>
    <header className="study-insights-head">
      <div><div className="study-insights-eyebrow"><CalendarDays size={15}/> {t('STUDY INSIGHTS', 'نقشه مطالعه')}</div><h2>{t('A year of progress, one day at a time', 'یک سال پیشرفت، روزبه‌روز')}</h2><p>{t('Your private study history, organized by the Iranian solar calendar.', 'تاریخچه خصوصی مطالعه، مرتب‌شده بر اساس سال شمسی و ساعت تهران.')}</p></div>
      <button type="button" className="study-insights-export" onClick={exportCsv}><Download size={16}/>{t('Export CSV', 'خروجی CSV')}</button>
    </header>
    <div className="study-insights-summary">
      <div><small>{t('Study time this solar year', 'مطالعه این سال شمسی')}</small><strong>{durationLabel(yearSeconds, fa)}</strong></div>
      <div><small>{t('Active days', 'روزهای فعال')}</small><strong>{fmt(activeDays, fa)}</strong></div>
      <div><small>{t('Most focused day', 'پُرکارترین روز')}</small><strong className="study-insights-summary-date">{(values.get(bestDay)?.seconds ?? 0) ? localDayLabel(bestDay,fa) : '—'}</strong></div>
    </div>
    <div className="study-insights-toolbar">
      <div className="study-insights-year"><button type="button" onClick={()=>changeYear(year-1)} aria-label={t('Previous year','سال قبل')}><ChevronLeft size={17}/></button><strong>{t('Solar year ', 'سال شمسی ')}{fmt(year,fa)}</strong><button type="button" disabled={year>=currentYear} onClick={()=>changeYear(year+1)} aria-label={t('Next year','سال بعد')}><ChevronRight size={17}/></button></div>
      <div className="study-insights-filters" role="group" aria-label={t('Study record type','نوع ثبت مطالعه')}>{sourceTabs.map(tab=><button type="button" key={tab.id} className={source===tab.id?'active':''} aria-pressed={source===tab.id} onClick={()=>{setSource(tab.id);setSelectedSlot(null);}}>{fa?tab.fa:tab.en}</button>)}</div>
    </div>
    <div className="study-insights-months" aria-label={t('Persian annual heatmap','تقویم حرارتی سال شمسی')}>
      {monthDays.map((days,monthIndex)=><div className="study-insights-month" key={`${year}-${monthIndex}`}>
        <div className="study-insights-month-title"><strong>{fa?PERSIAN_MONTHS[monthIndex]:EN_MONTHS[monthIndex]}</strong><small>{fmt(Math.round(days.reduce((sum,d)=>sum+(values.get(d.key)?.seconds??0),0)/60),fa)} {t('min', 'دقیقه')}</small></div>
        <div className="study-insights-week-labels">{(fa?FA_WEEK:EN_WEEK).map((label,index)=><span key={index}>{label}</span>)}</div>
        <div className="study-insights-daygrid">{Array.from({length:days[0]?.weekdayIndex??0},(_,i)=><span aria-hidden="true" key={`blank-${i}`}/>)}
          {days.map(d=>{const seconds=values.get(d.key)?.seconds??0;return <button type="button" key={d.key} title={`${localDayLabel(d.key,fa)} · ${durationLabel(seconds,fa)}`} aria-label={`${localDayLabel(d.key,fa)}: ${durationLabel(seconds,fa)}`} aria-pressed={selectedDay===d.key} onClick={()=>{setSelectedDay(d.key);setSelectedSlot(null);}} className={`study-insights-day level-${insightLevel(seconds)} ${selectedDay===d.key?'selected':''} ${today===d.key?'is-today':''}`}><span>{fmt(d.day,fa)}</span></button>;})}
        </div>
      </div>)}
    </div>
    <div className="study-insights-legend"><span>{t('Less study', 'مطالعه کمتر')}</span>{[0,1,2,3,4].map(level=><i className={`level-${level}`} key={level}/>)}<span>{t('More study', 'مطالعه بیشتر')}</span></div>
    <div className="study-insights-timeline" id="study-day-timeline">
      <div className="study-insights-timeline-head"><div><div className="study-insights-eyebrow"><Focus size={15}/>{t('TEN-MINUTE REPLAY', 'بازپخش ده‌دقیقه‌ای')}</div><h3>{localDayLabel(selectedDay,fa)}</h3><p>{durationLabel(dayTotal,fa)} · {t('estimated placement of net focus time', 'جای‌گذاری تقریبی زمان خالص مطالعه')}</p></div><button type="button" className="study-insights-history" onClick={()=>navigate('/history')}><History size={16}/>{t('Full history','تاریخچه کامل')}</button></div>
      <div className="study-insights-timegrid" role="group" aria-label={t('10-minute study timeline', 'تایم‌لاین مطالعه ده‌دقیقه‌ای')}>
        {Array.from({length:24},(_,hour)=><div className="study-insights-time-row" key={hour}><span className="study-insights-hour" dir="ltr">{String(hour).padStart(2,'0')}:00</span><div className="study-insights-buckets">{Array.from({length:6},(_,segment)=>{const index=hour*6+segment;const cell=day?.cells[index];const amount=cell?.seconds??0;return <button key={index} type="button" className={`study-insights-bucket level-${insightLevel(amount)} ${selectedSlot===index?'selected':''}`} aria-pressed={selectedSlot===index} aria-label={`${String(hour).padStart(2,'0')}:${String(segment*10).padStart(2,'0')} · ${durationLabel(amount,fa)}`} title={`${String(hour).padStart(2,'0')}:${String(segment*10).padStart(2,'0')} · ${durationLabel(amount,fa)}`} onClick={()=>setSelectedSlot(selectedSlot===index?null:index)}/>;})}</div></div>)}
      </div>
      {selectedSlot!==null && <div className="study-insights-detail" role="status"><strong dir="ltr">{String(Math.floor(selectedSlot/6)).padStart(2,'0')}:{String((selectedSlot%6)*10).padStart(2,'0')}</strong><span>{durationLabel(selectedCell?.seconds??0,fa)}</span>{Object.entries(selectedCell?.bySubject??{}).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([id,seconds])=><span key={id} className="study-insights-subject"><i style={{backgroundColor:subjectMap.get(id)?.color??'#8e83e8'}}/>{subjectMap.get(id)?.name??t('General','عمومی')}: {durationLabel(seconds,fa)}</span>)}</div>}
      <p className="study-insights-note"><Info size={15}/>{t('Buckets estimate where net study time occurred within each session; pauses are not timestamped individually. Empty cells do not mean distraction. Stored sessions, rewards and leaderboard are unchanged.', 'خانه‌ها زمان خالص مطالعه را در طول جلسه به‌صورت تقریبی توزیع می‌کنند؛ زمان دقیق هر توقف ذخیره نشده است. خانه خالی نشانه حواس‌پرتی نیست. جلسات، پاداش و لیدربورد تغییر نمی‌کنند.')}</p>
    </div>
  </section>;
}

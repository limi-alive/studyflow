import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarDays, Sparkles } from 'lucide-react';
import { GrowthHub } from '../components/GrowthHub';
import { SocialChallenge } from '../components/SocialChallenge';
import { StudyInsights } from '../components/StudyInsights';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useSettings } from '../hooks/useSettings';
import { db } from '../lib/db';
import { localText } from '../lib/locale';

/** Older growth and invitation tools remain intact behind a secondary tab. */
export default function ProgressPage() {
  const { userId } = useCurrentUser();
  const settings = useSettings(userId);
  const navigate = useNavigate();
  const [tab, setTab] = useState<'insights'|'challenges'>('insights');
  const rows = useLiveQuery(() => db.sessions.where('userId').equals(userId).filter(s => !s.deletedAt).toArray(), [userId]);
  const sessions = useMemo(() => rows ?? [], [rows]);
  const subjectsQuery = useLiveQuery(() => db.subjects.where('userId').equals(userId).filter(s => !s.deletedAt).toArray(), [userId]);
  const subjects = useMemo(() => subjectsQuery ?? [], [subjectsQuery]);
  const t = (en: string, fa: string) => localText(settings, en, fa);
  return <div className="page progress-page">
    <header className="page-header"><div><div className="eyebrow"><Sparkles size={15}/> {t('PRIVATE STUDY INSIGHTS','گزارش خصوصی مطالعه')}</div><h1>{t('Progress & insights','پیشرفت و تحلیل')}</h1><p className="subtle">{t('Explore your study patterns or open your existing challenges.', 'الگوی مطالعه‌ات را ببین یا سراغ چالش‌های قبلی برو.')}</p></div>
      <button className="button" type="button" onClick={()=>navigate('/studyos')}><CalendarDays size={17}/> {t('Today in StudyOS','برنامه امروز')} <ArrowRight size={16}/></button>
    </header>
    <div className="progress-tabs" role="tablist" aria-label={t('Progress views', 'بخش‌های پیشرفت')}>
      <button type="button" role="tab" aria-selected={tab==='insights'} className={tab==='insights'?'active':''} onClick={()=>setTab('insights')}>{t('Study map & timeline', 'نقشه و تایم‌لاین')}</button>
      <button type="button" role="tab" aria-selected={tab==='challenges'} className={tab==='challenges'?'active':''} onClick={()=>setTab('challenges')}>{t('Challenges & sharing', 'چالش و اشتراک‌گذاری')}</button>
    </div>
    {tab === 'insights' ? <div role="tabpanel"><StudyInsights userId={userId} sessions={sessions} subjects={subjects} settings={settings}/></div> :
      <div role="tabpanel"><GrowthHub sessions={sessions} settings={settings}/><SocialChallenge userId={userId} sessions={sessions}/></div>}
  </div>;
}

import { useUiText } from '../lib/uiLanguage';
import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarDays, Sparkles } from 'lucide-react';
import { GrowthHub } from '../components/GrowthHub';
import { SocialChallenge } from '../components/SocialChallenge';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useSettings } from '../hooks/useSettings';
import { db } from '../lib/db';

/** Optional features live away from the daily dashboard to reduce visual noise. */
export default function ProgressPage() {
 const uiText=useUiText();
  const {userId} = useCurrentUser();
  const settings = useSettings(userId);
  const navigate = useNavigate();
  const rows = useLiveQuery(() => db.sessions.where('userId').equals(userId).filter(s => !s.deletedAt).toArray(), [userId]);
  const sessions = useMemo(() => rows ?? [], [rows]);
  return <div className="page progress-page" >
    <header className="page-header"><div><div className="eyebrow"><Sparkles size={15}/> {uiText("گزارش شخصی")}</div><h1>{uiText("رشد و پیشرفت")}</h1><p className="subtle">{uiText("خلاصه هفتگی، کارت اشتراک‌گذاری و چالش اختیاری در یک صفحه.")}</p></div>
      <button className="button" onClick={()=>navigate('/studyos')}><CalendarDays size={17}/> {uiText("اتاق فرمان")} <ArrowRight size={16}/></button>
    </header>
    <GrowthHub sessions={sessions} settings={settings}/>
    <SocialChallenge userId={userId} sessions={sessions}/>
  </div>;
}

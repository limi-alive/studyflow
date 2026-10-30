import { useUiText, useUiLanguage, formatUiNumber } from '../lib/uiLanguage';
import { useMemo, useState } from 'react';
import { ArrowRight, Check, CheckCircle2, Copy, Flame, Share2, Sparkles, Trophy, UsersRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { StudySession } from '../types';
import type { UserSettings } from '../types';
import { useTimePulse } from '../hooks/useTimePulse';
import { localText } from '../lib/locale';
import { db } from '../lib/db';
import { shareSummaryText, studySprint, type SprintSummary } from '../utils/studySprint';
import { jalaliLabel, jalaliRange, jalaliNumber } from '../utils/jalaliDisplay';

const APP_LINK = 'https://limi-alive.github.io/studyflow/';

function hoursLabel(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function makeShareImage(summary: SprintSummary, language:'fa'|'en'): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext('2d');
  if (!ctx) return Promise.reject(new Error('Canvas is not available'));
  const { width: w, height: h } = canvas;
  const persianDates = language==='fa'?jalaliRange(summary.days.map(day=>day.key)):summary.days.map(day=>new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric'}).format(new Date(`${day.key}T12:00:00`))).filter((_,i,a)=>i===0||i===a.length-1).join(' to ');
  const gradient = ctx.createLinearGradient(0, 0, w, h);
  gradient.addColorStop(0, '#111222');
  gradient.addColorStop(.55, '#17142a');
  gradient.addColorStop(1, '#24162c');
  ctx.fillStyle = gradient;
  ctx.fillRect(0,0,w,h);

  // Decorative glows are rendered locally with no downloaded image assets.
  const glow = ctx.createRadialGradient(830,160,15,830,160,540);
  glow.addColorStop(0,'rgba(168,107,255,.28)'); glow.addColorStop(1,'rgba(168,107,255,0)');
  ctx.fillStyle = glow; ctx.fillRect(0,0,w,h);
  const gold = ctx.createRadialGradient(70,1120,20,70,1120,480);
  gold.addColorStop(0,'rgba(243,194,101,.20)'); gold.addColorStop(1,'rgba(243,194,101,0)');
  ctx.fillStyle = gold; ctx.fillRect(0,0,w,h);

  const rounded = (x:number,y:number,width:number,height:number,r:number,fill:string) => {
    ctx.fillStyle = fill; ctx.beginPath(); ctx.roundRect(x,y,width,height,r); ctx.fill();
  };
  ctx.fillStyle = '#f6edff'; ctx.font = 'bold 38px system-ui'; ctx.fillText('✦  StudyFlow', 90, 124);
  rounded(88,192,904,2,1,'rgba(255,255,255,.14)');
  ctx.fillStyle = '#b5a7cb'; ctx.font='600 31px system-ui'; ctx.fillText(language==='fa'?'گزارش تمرکز من':'MY FOCUS RECAP', 92, 292);
  ctx.fillStyle='#faf6ff'; ctx.font='bold 112px system-ui'; ctx.fillText(hoursLabel(summary.totalSeconds), 88, 430);
  ctx.fillStyle='#c9bdd8'; ctx.font='35px system-ui'; ctx.fillText(language==='fa'?'مطالعه هدفمند در ۷ روز اخیر':'of intentional study in the last 7 days',92,505);
  ctx.font='30px system-ui'; ctx.fillText(language==='fa'?'تاریخ شمسی':'Study period',92,545);

  rounded(88,570,904,363,36,'rgba(255,255,255,.075)');
  ctx.fillStyle='#f6e6ff'; ctx.font='bold 38px system-ui'; ctx.fillText(language==='fa'?'چالش ۷ روز تمرکز':'7-DAY FOCUS SPRINT',123,650);
  for (let i=0;i<7;i++) {
    const d=summary.days[i];
    const x=122+i*121;
    rounded(x,696,103,113,21,d.complete?'#a780ff':'#302b43');
    ctx.fillStyle=d.complete?'#1b122f':'#baa9cc';
    ctx.font='bold 31px system-ui'; ctx.textAlign='center'; ctx.fillText(d.complete?'✓':'·',x+51,760); ctx.textAlign='left';
    ctx.font='24px system-ui';ctx.fillStyle='#ded3ed';ctx.textAlign='center';ctx.fillText(new Intl.DateTimeFormat(language==='fa'?'fa-IR-u-ca-persian':'en-US',{weekday:'short'}).format(new Date(`${d.key}T12:00:00`)),x+51,847);ctx.textAlign='left';
  }
  ctx.font='600 29px system-ui';ctx.fillStyle='#ded3ed';ctx.fillText(language==='fa'?`${formatUiNumber(summary.completedDays)} از ۷ روز کامل`:`${summary.completedDays} / 7 days completed`,122,892);
  ctx.font='24px system-ui';ctx.fillStyle='#ccb9e6';ctx.fillText(persianDates,122,925);

  ctx.fillStyle='#f8e6fc';ctx.font='bold 42px system-ui';ctx.fillText(language==='fa'?'قدم‌های کوچک، تمرکز بزرگ':'Small steps. Strong focus.',93,1063);
  ctx.fillStyle='#b9abc8';ctx.font='30px system-ui';ctx.fillText(language==='fa'?'مسیر تمرکز خودت را شروع کن':'Start your own focus journey',93,1131);
  rounded(91,1184,898,85,25,'#9b78f3');
  ctx.fillStyle='#100b1b';ctx.font='bold 31px system-ui';ctx.textAlign='center';ctx.fillText('limi-alive.github.io/studyflow',540,1238);ctx.textAlign='left';

  return new Promise((resolve,reject) => {
    canvas.toBlob(blob => {
      if (!blob) { reject(new Error('Image export failed')); return; }
      resolve(new File([blob],'studyflow-focus-recap.png',{type:'image/png'}));
    },'image/png');
  });
}

async function saveImage(file: File) {
  const url = URL.createObjectURL(file);
  try {
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = file.name;
    document.body.appendChild(anchor); anchor.click(); anchor.remove();
  } finally { window.setTimeout(() => URL.revokeObjectURL(url), 1500); }
}

export function GrowthHub({ sessions, settings }: { sessions: StudySession[]; settings?: UserSettings }) {
 const uiText=useUiText();
  const language=useUiLanguage();
  const navigate = useNavigate();
  const nowMs = useTimePulse();
  const summary = useMemo(() => studySprint(sessions, new Date(nowMs)), [sessions, nowMs]);
  const [message, setMessage] = useState('');
  const [sharing, setSharing] = useState(false);
  const fa = language === 'fa';

  async function enableJalaliCalendar() {
    if (!settings) return;
    try {
      await db.settings.update(settings.userId, { calendarType: 'jalali', numberFormat: 'persian', weekStart: 'saturday', updatedAt: new Date().toISOString() });
      window.dispatchEvent(new CustomEvent('studyflow:sync-needed', { detail: { userId: settings.userId } }));
      setMessage('تقویم شمسی برای حساب شما فعال شد.');
    } catch { setMessage('تغییر تقویم ذخیره نشد. دوباره امتحان کن.'); }
  }

  async function shareProgress() {
    if (sharing || !summary.totalSeconds) return;
    setSharing(true); setMessage('');
    try {
      const file = await makeShareImage(summary, language);
      const text = shareSummaryText(summary, fa ? 'fa' : 'en');
      const shareData: ShareData = { title: 'My StudyFlow focus recap', text, files: [file] };
      if (navigator.share && navigator.canShare?.({files:[file]})) {
        try { await navigator.share(shareData); setMessage(localText(settings,'Share sheet opened','صفحه اشتراک‌گذاری باز شد')); }
        catch (e) { if ((e as Error).name !== 'AbortError') setMessage(localText(settings,'Sharing failed. Try downloading.','اشتراک‌گذاری انجام نشد؛ دانلود را امتحان کن.')); }
      } else {
        await saveImage(file);
        setMessage(localText(settings,'Image saved. Share it with your friends.','تصویر ذخیره شد؛ می‌توانی برای دوستانت بفرستی.'));
      }
    } catch {
      setMessage(localText(settings,'Could not create the recap image.','ساخت تصویر گزارش ممکن نشد.'));
    } finally { setSharing(false); }
  }

  async function inviteFriends() {
    const text = `Join me on StudyFlow — a clean way to study with focus challenges and a study league. ${APP_LINK}`;
    try {
      if (navigator.share) {
        await navigator.share({title:'StudyFlow',text,url:APP_LINK});
        setMessage(localText(settings,'Invite shared','دعوت‌نامه ارسال شد'));
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        setMessage(localText(settings,'Invite link copied','لینک دعوت کپی شد'));
      } else {
        setMessage(localText(settings,'Use the StudyFlow link below to invite friends.','برای دعوت دوستان از لینک زیر استفاده کن.'));
      }
    } catch(e) {
      if ((e as Error).name !== 'AbortError') setMessage(localText(settings,'Unable to share. Use the link below.','اشتراک‌گذاری نشد؛ از لینک زیر استفاده کن.'));
    }
  }

  return <section className="growth-hub" aria-label={localText(settings,'StudyFlow community and challenge','چالش و جامعه StudyFlow')}>
    <div className="growth-sprint-card">
      <div className="growth-topline"><span className="growth-eyebrow"><Flame size={14}/>{localText(settings,'7-DAY FOCUS SPRINT','چالش ۷ روزه تمرکز')}</span><span className="growth-count">{summary.completedDays}<small>/7</small></span></div>
      <h2>{localText(settings,'Build a focus streak','ریتم مطالعه‌ات را بساز')}</h2>
      <div className="growth-jalali-period" >{language==='fa'?jalaliRange(summary.days.map(day => day.key)):summary.days.map(day=>new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric'}).format(new Date(`${day.key}T12:00:00`))).filter((_,i,a)=>i===0||i===a.length-1).join(' to ')}</div>
      {settings?.calendarType === 'gregorian' && <button className="growth-jalali-switch" type="button" onClick={() => void enableJalaliCalendar()}>{uiText("فعال‌کردن تقویم شمسی برای همه تاریخ‌های اپ")}</button>}
      <p>{localText(settings,'Focus for 25 minutes a day. Each day you finish lights up your journey.','هر روز ۲۵ دقیقه مطالعه کن تا یک خانه از مسیرت روشن شود.')}</p>
      <div className="growth-week" role="list" aria-label={localText(settings,'Last seven days (Jalali)','هفت روز اخیر به تاریخ شمسی')}>
        {summary.days.map(day => <div className={`growth-day ${day.complete ? 'is-done' : ''}`} role="listitem" key={day.key} aria-label={`${jalaliLabel(day.key)}: ${day.complete?'completed':'not completed'}`}>
          <span>{day.complete ? <Check size={17} strokeWidth={3}/> : <span className="growth-day-dot"/>}</span>
          <small >{new Intl.DateTimeFormat(language==='fa'?'fa-IR-u-ca-persian':'en-US',{weekday:'short'}).format(new Date(`${day.key}T12:00:00`))}</small>
          <small className="growth-jalali-day" >{new Intl.DateTimeFormat(language==='fa'?'fa-IR-u-ca-persian':'en-US',{day:'numeric'}).format(new Date(`${day.key}T12:00:00`))}</small>
        </div>)}
      </div>
      <div className="growth-statsline"><span><CheckCircle2 size={14}/>{fa ? jalaliNumber(summary.completedDays) : summary.completedDays} {localText(settings,'days reached','روز موفق')}</span><span>{hoursLabel(summary.totalSeconds)} {localText(settings,'this week','این هفته')}</span></div>
      <button className="growth-cta" type="button" onClick={() => navigate('/timer')}><span>{localText(settings,'Start a 25-min focus','شروع تمرکز ۲۵ دقیقه‌ای')}</span><ArrowRight size={17}/></button>
    </div>
    <div className="growth-share-card">
      <div className="growth-share-icon"><Trophy size={21}/><Sparkles size={11}/></div>
      <span className="growth-eyebrow">{localText(settings,'YOUR STORY • THEIR INSPIRATION','پیشرفت تو • انگیزه دوستانت')}</span>
      <h2>{localText(settings,'Make progress shareable','پیشرفتت را به اشتراک بگذار')}</h2>
      <p>{localText(settings,'Turn your focus time into a beautiful recap card, or invite a friend to study with you.','از زمان مطالعه‌ات یک کارت زیبا بساز یا دوستانت را دعوت کن.')}</p>
      <div className="growth-highlight"><strong>{hoursLabel(summary.totalSeconds)}</strong><span>{localText(settings,'focused in the last 7 days','تمرکز در هفت روز اخیر')}</span><small className="growth-highlight-date" >{language==='fa'?jalaliRange(summary.days.map(day => day.key)):summary.days.map(day=>new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric'}).format(new Date(`${day.key}T12:00:00`))).filter((_,i,a)=>i===0||i===a.length-1).join(' to ')}</small></div>
      <div className="growth-share-actions">
        <button type="button" onClick={() => void shareProgress()} disabled={!summary.totalSeconds || sharing} aria-label={uiText("Share focus recap")}><Share2 size={16}/>{sharing?localText(settings,'Preparing...','در حال آماده‌سازی...'):localText(settings,'Share recap','اشتراک گزارش')}</button>
        <button type="button" onClick={() => void inviteFriends()}><UsersRound size={16}/>{localText(settings,'Invite','دعوت دوستان')}</button>
      </div>
      <small className="growth-privacy">{localText(settings,'Only totals are shared when you choose. Your subjects and notes stay private.','فقط با انتخاب خودت آمار کلی منتشر می‌شود؛ درس‌ها و یادداشت‌ها خصوصی می‌مانند.')}</small>
      <a className="growth-share-link" href={APP_LINK} target="_blank" rel="noopener noreferrer"><Copy size={12}/> {uiText("limi-alive.github.io/studyflow")}</a>
      {message && <div className="growth-message" role="status">{uiText(message)}</div>}
    </div>
  </section>;
}

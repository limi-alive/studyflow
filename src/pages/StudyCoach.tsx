import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BrainCircuit, CalendarClock, ChartNoAxesCombined, ChevronLeft, Clock3, Info, Leaf, Play, RefreshCcw, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useUiLanguage } from '../lib/uiLanguage';
import { useTimePulse } from '../hooks/useTimePulse';
import { db } from '../lib/db';
import { useTimerStore } from '../stores/timerStore';
import { anonymousCoachContext, buildCoachSnapshot, type CoachIntent } from '../utils/studyCoach';
import '../study-coach-v15.css';

const INTENTS: {id:CoachIntent; icon:typeof Zap; fa:string; en:string}[] = [
  {id:'next',icon:Zap,fa:'الان چی بخونم؟',en:'What should I study?'},
  {id:'plan',icon:CalendarClock,fa:'برنامه امروز',en:"Today's plan"},
  {id:'momentum',icon:ChartNoAxesCombined,fa:'روند این هفته',en:'Weekly progress'},
  {id:'exam',icon:BrainCircuit,fa:'آزمون بعدی',en:'Next exam'},
  {id:'rest',icon:Leaf,fa:'تمرکز بدون فرسودگی',en:'Avoid burnout'}
];
const CAPACITIES=[45,90,150,240] as const;
type LocalLanguageModelSession = {prompt: (text:string)=>Promise<string>;destroy?:()=>void};
type LocalLanguageModelApi = {availability:(options:{expectedInputs:{type:'text';languages:string[]}[];expectedOutputs:{type:'text';languages:string[]}[]})=>Promise<string>;create:(options:{expectedInputs:{type:'text';languages:string[]}[];expectedOutputs:{type:'text';languages:string[]}[]})=>Promise<LocalLanguageModelSession>};
const englishModelOptions={expectedInputs:[{type:'text' as const,languages:['en']}],expectedOutputs:[{type:'text' as const,languages:['en']}]};

export default function StudyCoachPage(){
  const {userId}=useCurrentUser();
  const lang=useUiLanguage();
  const fa=lang==='fa';
  const navigate=useNavigate();
  const now=useTimePulse();
  const active=useTimerStore(s=>s.active);
  const tasks=useLiveQuery(()=>db.tasks.where('userId').equals(userId).toArray(),[userId]);
  const subjects=useLiveQuery(()=>db.subjects.where('userId').equals(userId).toArray(),[userId]);
  const sessions=useLiveQuery(()=>db.sessions.where('userId').equals(userId).toArray(),[userId]);
  const exams=useLiveQuery(()=>db.exams.where('userId').equals(userId).toArray(),[userId]);
  const [capacity,setCapacity]=useState(90);
  const [intent,setIntent]=useState<CoachIntent>('next');
  const [generated,setGenerated]=useState('');
  const [generating,setGenerating]=useState(false);
  const [modelMessage,setModelMessage]=useState('');
  const loading=tasks===undefined||subjects===undefined||sessions===undefined||exams===undefined;
  useEffect(()=>{
    setIntent('next');setGenerated('');setModelMessage('');
    try {
      const value=Number(localStorage.getItem(`studyflow.coach.capacity.${userId}`));
      setCapacity(CAPACITIES.includes(value as typeof CAPACITIES[number])?value:90);
    } catch{setCapacity(90);}
  },[userId]);
  const snapshot=useMemo(()=>buildCoachSnapshot({userId,tasks:tasks??[],subjects:subjects??[],sessions:sessions??[],exams:exams??[],now:new Date(now),capacityMinutes:capacity,language:lang}),[userId,tasks,subjects,sessions,exams,now,capacity,lang]);
  const advice=snapshot.responses[intent];
  const changeCapacity=(value:number)=>{setCapacity(value);try{localStorage.setItem(`studyflow.coach.capacity.${userId}`,String(value));}catch{/* private browser mode */}};
  const startFocus=()=>{
    if(active){navigate('/timer');return;}
    const first=snapshot.plan[0];
    if(!first){navigate('/timer');return;}
    useTimerStore.getState().start({userId,subjectId:first.subjectId,taskId:first.taskId??null,timerType:'countdown',durationSeconds:first.minutes*60});
    navigate('/timer');
  };
  const generateOnDevice=async()=>{
    if(fa)return;
    setGenerating(true);setGenerated('');setModelMessage('');
    let session:LocalLanguageModelSession|undefined;
    try{
      const api=(window as unknown as {LanguageModel?:LocalLanguageModelApi}).LanguageModel;
      if(!api){setModelMessage('Your browser does not provide a compatible on-device language model. The private coach above remains free and available.');return;}
      const availability=await api.availability(englishModelOptions);
      if(availability==='unavailable'){setModelMessage('On-device generation is not available on this device. The private coach above still works.');return;}
      setModelMessage(availability==='downloadable'||availability==='downloading'?'The browser may download a language model to your device. No StudyFlow data is being uploaded.':'Creating a private on-device response…');
      session=await api.create(englishModelOptions);
      const context=anonymousCoachContext(snapshot);
      const answer=await session.prompt(`You are StudyFlow's encouraging, concise study coach. Speak English. You are NOT a doctor. The following are anonymized numeric study statistics, not a measure of learning or wellbeing. Never invent data or guarantee results. Suggest 2 actionable, flexible steps; use no more than 110 words. Do not suggest excessive study hours. Facts: ${context}`);
      setGenerated(answer.slice(0,3000));setModelMessage('Generated locally by your browser model. It can be inaccurate; verify recommendations.');
    }catch{setModelMessage('The optional local language model could not run. Your normal StudyFlow coach remains available.');}
    finally{session?.destroy?.();setGenerating(false);}
  };
  return <div className="page study-coach-page" dir={fa?'rtl':'ltr'}>
    <header className="study-coach-hero">
      <div className="study-coach-kicker"><Sparkles size={16}/>{fa?'مربی شخصی مطالعه':'YOUR STUDY COACH'}<span className="study-coach-free">{fa?'رایگان':'FREE'}</span></div>
      <h1>{fa?'هر روز یک قدم روشن‌تر':'A clearer next step, every day'}<span> ✦</span></h1>
      <p>{fa?'مربی با بررسی برنامه، امتحان‌ها و زمان مطالعه خودت، پیشنهادهای قابل اجرا می‌دهد؛ بدون ثبت‌نام تازه، اشتراک یا API پولی.':'Personalized guidance from your existing study plan, exams and focus history. No extra login, subscription or paid API.'}</p>
      <div className="study-coach-trust"><ShieldCheck size={17}/>{fa?'تحلیل پایه روی دستگاه انجام می‌شود؛ داده‌ها برای مربی به سرور AI ارسال نمی‌شوند.':'Basic coaching runs on your device; no study records are sent to an AI server.'}</div>
    </header>
    <div className="study-coach-summary" aria-label={fa?'خلاصه مطالعه':'Study summary'}>
      <div><small>{fa?'۷ روز اخیر':'Last 7 days'}</small><strong>{snapshot.weeklyMinutes.toLocaleString(fa?'fa-IR':'en-US')}</strong><span>{fa?'دقیقه مطالعه':'minutes studied'}</span></div>
      <div><small>{fa?'روزهای فعال':'Active days'}</small><strong>{snapshot.activeDays.toLocaleString(fa?'fa-IR':'en-US')}</strong><span>{fa?'از ۷ روز اخیر':'of the last 7'}</span></div>
      <div><small>{fa?'برنامه پیشنهادی':'Suggested today'}</small><strong>{snapshot.allocated.toLocaleString(fa?'fa-IR':'en-US')}</strong><span>{fa?'دقیقه':'minutes'}</span></div>
    </div>
    <div className="study-coach-layout">
      <section className="study-coach-surface" aria-label={fa?'گفتگو با مربی':'Coach guidance'}>
        <div className="study-coach-section-top"><div><span className="study-coach-section-label">{fa?'از مربی بپرس':'ASK YOUR COACH'}</span><h2>{fa?'امروز روی چی تمرکز کنیم؟':'What matters right now?'}</h2></div><BrainCircuit size={23}/></div>
        <div className="study-coach-prompts">{INTENTS.map(option=><button type="button" key={option.id} className={intent===option.id?'selected':''} aria-pressed={intent===option.id} onClick={()=>setIntent(option.id)}><option.icon size={15}/>{fa?option.fa:option.en}</button>)}</div>
        <article className="study-coach-answer" aria-live="polite"><div className="study-coach-answer-mark"><Sparkles size={18}/></div><div><small>{fa?'پیشنهاد شخصی براساس داده‌های خودت':'PERSONALIZED GUIDANCE'}</small><h3>{advice.title}</h3><p>{loading?(fa?'در حال خواندن اطلاعات محلی…':'Reading local study data…'):advice.body}</p><div className="study-coach-evidence"><Info size={14}/>{advice.evidence}</div></div></article>
        <div className="study-coach-actions"><button type="button" onClick={startFocus} className="study-coach-start"><Play size={17} fill="currentColor"/>{fa?(active?'بازگشت به جلسه فعال':'شروع برنامه پیشنهادی'):(active?'Return to active session':'Start suggested focus')}{fa?<ChevronLeft size={16}/>:<ArrowRight size={16}/>}</button><button type="button" className="study-coach-outline" onClick={()=>navigate('/studyos')}>{fa?'دیدن StudyOS':'Open StudyOS'}</button></div>
      </section>
      <aside className="study-coach-side">
        <div className="study-coach-panel"><div className="study-coach-section-label">{fa?'تنظیم شخصی':'PERSONALIZE'}</div><h3>{fa?'امروز چقدر زمان داری؟':'Time available today'}</h3><div className="study-coach-capacities" role="group" aria-label={fa?'ظرفیت امروز':'Today capacity'}>{CAPACITIES.map(value=><button type="button" key={value} aria-pressed={capacity===value} className={capacity===value?'selected':''} onClick={()=>changeCapacity(value)}>{value.toLocaleString(fa?'fa-IR':'en-US')} <small>{fa?'دقیقه':'min'}</small></button>)}</div><p>{fa?'ظرفیت فقط پیشنهادهای مربی را تغییر می‌دهد؛ برنامه و سوابق قبلی دست‌نخورده می‌مانند.':'Changes coach suggestions only; it does not edit your plans or study history.'}</p></div>
        <div className="study-coach-panel"><div className="study-coach-section-label">{fa?'گزینه پیشرفته':'OPTIONAL LOCAL GENERATION'}</div><h3>{fa?'هوش مصنوعی مولد روی دستگاه':'Generative AI on your device'}</h3><p>{fa?'در برخی مرورگرهای دسکتاپ، مدل زبانی خود مرورگر قابل استفاده است. پشتیبانی فارسی این مدل هنوز تضمین نشده و این ویژگی در موبایل در دسترس همه نیست. راهنمای شخصی بالا همیشه رایگان کار می‌کند.':'On compatible desktop browsers you can optionally ask the built-in language model for a brief coaching summary. No cloud API key or payments. Not supported on every device.'}</p>{!fa&&<button className="study-coach-outline study-coach-local-btn" disabled={generating} onClick={()=>void generateOnDevice()} type="button">{generating?<RefreshCcw size={16} className="study-coach-spin"/>:<Sparkles size={16}/>} {generating?'Generating…':'Try local AI summary'}</button>}{modelMessage&&<p role="status">{modelMessage}</p>}{generated&&<div className="study-coach-generated" role="status">{generated}</div>}</div>
        <div className="study-coach-privacy"><Clock3 size={17}/>{fa?'مربی تشخیص پزشکی یا سنجش واقعی تسلط درسی انجام نمی‌دهد. تمام توصیه‌ها قابل رد یا تغییر هستند.':'Study recommendations are optional, not a medical assessment or a direct measure of learning mastery.'}</div>
      </aside>
    </div>
  </div>;
}

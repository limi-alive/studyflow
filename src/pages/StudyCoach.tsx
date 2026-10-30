import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BrainCircuit, CalendarClock, ChartNoAxesCombined, ChevronLeft, Clock3, Info, Leaf, Play, RefreshCcw, ShieldCheck, Sparkles, Zap, MessageCircle, Send, Trash2 } from 'lucide-react';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useUiLanguage } from '../lib/uiLanguage';
import { useTimePulse } from '../hooks/useTimePulse';
import { db } from '../lib/db';
import { useTimerStore } from '../stores/timerStore';
import { anonymousCoachContext, buildCoachSnapshot, type CoachIntent } from '../utils/studyCoach';
import { getStudyCoachEndpoint, requestStudyCoachReply, type CoachChatMessage } from '../lib/studyCoachChat';
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
  const [chatMessages,setChatMessages]=useState<CoachChatMessage[]>([]);
  const [chatInput,setChatInput]=useState('');
  const [chatSending,setChatSending]=useState(false);
  const [chatHint,setChatHint]=useState('');
  const [cloudEndpoint,setCloudEndpoint]=useState<string | null>(null);
  const [shareSummary,setShareSummary]=useState(false);
  const chatAbort=useRef<AbortController | null>(null);
  const sendingRef=useRef(false);
  const loading=tasks===undefined||subjects===undefined||sessions===undefined||exams===undefined;
  useEffect(()=>{
    chatAbort.current?.abort();sendingRef.current=false;
    setChatMessages([]);setChatInput('');setChatHint('');setShareSummary(false);
    setIntent('next');setGenerated('');setModelMessage('');
    try {
      const value=Number(localStorage.getItem(`studyflow.coach.capacity.${userId}`));
      setCapacity(CAPACITIES.includes(value as typeof CAPACITIES[number])?value:90);
    } catch{setCapacity(90);}
  },[userId]);
  useEffect(()=>{let active=true;void getStudyCoachEndpoint().then(value=>{if(active)setCloudEndpoint(value);});return()=>{active=false;};},[]);
  useEffect(()=>()=>{chatAbort.current?.abort();},[]);
  const snapshot=useMemo(()=>buildCoachSnapshot({userId,tasks:tasks??[],subjects:subjects??[],sessions:sessions??[],exams:exams??[],now:new Date(now),capacityMinutes:capacity,language:lang}),[userId,tasks,subjects,sessions,exams,now,capacity,lang]);
  const advice=snapshot.responses[intent];
  const fallbackIntent=(question:string):CoachIntent=>{
    if(/(?:امتحان|آزمون|exam|test)/i.test(question))return 'exam';
    if(/(?:برنامه|schedule|plan|امروز|today)/i.test(question))return 'plan';
    if(/(?:هفته|روند|پیشرفت|progress|week)/i.test(question))return 'momentum';
    if(/(?:خسته|استراحت|فشار|burnout|rest|tired)/i.test(question))return 'rest';
    return 'next';
  };
  const sendChat=async(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault();
    const question=chatInput.trim();
    if(!question||sendingRef.current)return;
    sendingRef.current=true;setChatSending(true);setChatInput('');setChatHint('');
    const nextMessages:CoachChatMessage[]=[...chatMessages,{role:'user',content:question}];
    setChatMessages(nextMessages);
    const fallback=()=>{
      const answer=snapshot.responses[fallbackIntent(question)];
      setChatMessages(prev=>[...prev,{role:'assistant',content:`${answer.title}\n${answer.body}`}]);
    };
    try {
      if(!cloudEndpoint){
        fallback();
        setChatHint(fa?'پاسخ فعلی از موتور محلی StudyFlow است؛ سرور AI هنوز تنظیم نشده.':'This answer comes from the offline StudyFlow coach; cloud AI is not configured.');
        return;
      }
      const controller=new AbortController();chatAbort.current=controller;
      const numericContext=shareSummary?anonymousCoachContext(snapshot):undefined;
      const result=await requestStudyCoachReply({endpoint:cloudEndpoint,messages:nextMessages,language:fa?'fa':'en',numericContext,signal:controller.signal});
      if(!controller.signal.aborted){
        setChatMessages(prev=>[...prev,{role:'assistant',content:result.reply}]);
        setChatHint(fa?'پاسخ هوش مصنوعی ممکن است خطا داشته باشد.':'AI suggestions can be inaccurate.');
      }
    }catch(error){
      if((error as Error).name==='AbortError')return;
      fallback();
      setChatHint(fa?'سرویس ابری در دسترس نیست؛ پاسخ جایگزین از مربی آفلاین نمایش داده شد.':'Cloud AI is unavailable; showing offline coaching instead.');
    }finally{chatAbort.current=null;sendingRef.current=false;setChatSending(false);}
  };
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
      <div className="study-coach-trust"><ShieldCheck size={17}/>{fa?'پیشنهادهای پایه روی دستگاه آماده می‌شوند؛ فقط پیام‌های چت و خلاصه‌ای که خودت اجازه بدهی برای AI ارسال می‌شوند.':'Basic coaching runs locally; cloud AI receives chat text and optional numeric summaries only.'}</div>
    </header>
    <div className="study-coach-summary" aria-label={fa?'خلاصه مطالعه':'Study summary'}>
      <div><small>{fa?'۷ روز اخیر':'Last 7 days'}</small><strong>{snapshot.weeklyMinutes.toLocaleString(fa?'fa-IR':'en-US')}</strong><span>{fa?'دقیقه مطالعه':'minutes studied'}</span></div>
      <div><small>{fa?'روزهای فعال':'Active days'}</small><strong>{snapshot.activeDays.toLocaleString(fa?'fa-IR':'en-US')}</strong><span>{fa?'از ۷ روز اخیر':'of the last 7'}</span></div>
      <div><small>{fa?'برنامه پیشنهادی':'Suggested today'}</small><strong>{snapshot.allocated.toLocaleString(fa?'fa-IR':'en-US')}</strong><span>{fa?'دقیقه':'minutes'}</span></div>
    </div>
    <section className="study-coach-chat study-coach-surface" aria-label={fa?'گفتگو با هوش مصنوعی':'AI coach chat'}>
      <div className="study-coach-section-top"><div><span className="study-coach-section-label">{fa?'گفتگوی آزاد':'OPEN CHAT'}</span><h2><MessageCircle size={22} aria-hidden="true"/> {fa?'از مربی هوشمند بپرس':'Ask your study coach'}</h2></div><button type="button" className="study-coach-chat-clear" disabled={!chatMessages.length||chatSending} title={fa?'پاک کردن گفتگو':'Clear chat'} onClick={()=>{setChatMessages([]);setChatHint('');}}><Trash2 size={17}/></button></div>
      <p className="study-coach-chat-description">{cloudEndpoint?(fa?'گفتگو با Qwen؛ بدون سقف روزانه پیام در خود اپ. ظرفیت سرویس ابری مستقل است.':'Chat with Qwen. StudyFlow does not set a daily message quota; cloud capacity is separate.'):(fa?'مربی محلی آماده است. پس از تنظیم سرور، چت مولد Qwen فعال می‌شود.':'Offline coaching is ready. Generative Qwen chat activates after cloud setup.')}</p>
      <div className="study-coach-chat-thread" role="log" aria-live="polite" aria-label={fa?'پیام‌های گفتگو':'Chat messages'}>
        {chatMessages.length===0&&<p className="study-coach-chat-empty">{fa?'مثلاً بپرس: «برای امتحان فردا چطور برنامه‌ریزی کنم؟»':'Try: “How should I plan for my next exam?”'}</p>}
        {chatMessages.map((message,index)=><div key={index} className={`study-coach-chat-bubble ${message.role==='user'?'is-user':'is-coach'}`}><span>{message.role==='user'?(fa?'تو':'You'):(fa?'مربی':'Coach')}</span><p>{message.content}</p></div>)}
        {chatSending&&<div className="study-coach-chat-wait" role="status">{fa?'در حال پاسخ…':'Thinking…'}</div>}
      </div>
      {chatHint&&<p className="study-coach-chat-hint" role="status">{chatHint}</p>}
      <form className="study-coach-chat-compose" onSubmit={event=>void sendChat(event)}>
        <label className="study-coach-chat-visually-hidden" htmlFor="study-coach-chat-input">{fa?'پیام شما':'Your message'}</label>
        <input id="study-coach-chat-input" dir="auto" value={chatInput} onChange={e=>setChatInput(e.target.value)} maxLength={1600} disabled={chatSending} placeholder={fa?'درباره درس، برنامه یا تمرکزت بپرس…':'Ask about studying, planning, or focus…'}/>
        <button type="submit" disabled={!chatInput.trim()||chatSending}><Send size={18}/>{fa?'ارسال':'Send'}</button>
      </form>
      {cloudEndpoint&&<label className="study-coach-chat-consent"><input type="checkbox" checked={shareSummary} onChange={e=>setShareSummary(e.target.checked)}/>{fa?'اجازه می‌دهم فقط خلاصه آماری بدون نام مطالعه‌ام همراه پیام برای AI ارسال شود.':'Send anonymized numeric study summary with my messages (optional).'}</label>}
      <p className="study-coach-chat-disclaimer">{fa?'متن پیام‌ها در صورت فعال بودن سرور AI برای پردازش ارسال می‌شود. از ارسال اطلاعات حساس خودداری کن. تاریخچه گفتگو در فضای ابری StudyFlow ذخیره نمی‌شود.':'When enabled, chat text is sent to the AI service for processing. Avoid sensitive details. StudyFlow does not save this chat to its cloud database.'}</p>
    </section>
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

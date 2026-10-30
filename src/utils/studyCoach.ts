import type { Exam, StudySession, StudyTask, Subject } from '../types';
import { buildStudyOS, type StudyOSItem } from './studyOS';

/** Read-only personalized coaching. Not an LLM and not an assessment of memory retention. */
export type CoachIntent = 'next' | 'plan' | 'momentum' | 'exam' | 'rest';
export type CoachLanguage = 'fa' | 'en';
export type CoachInput = {
  userId: string;
  tasks: StudyTask[];
  subjects: Subject[];
  exams: Exam[];
  sessions: StudySession[];
  now: Date;
  capacityMinutes: number;
  language: CoachLanguage;
};
export type CoachReply = { title: string; body: string; evidence: string; intent: CoachIntent };
export type CoachSnapshot = {
  plan: StudyOSItem[];
  allocated: number;
  capacity: number;
  weeklyMinutes: number;
  previousMinutes: number;
  activeDays: number;
  upcomingExams: {name:string;daysLeft:number; dailyMinutes:number|null;remainingMinutes:number|null}[];
  responses: Record<CoachIntent, CoachReply>;
};
const minutes = (seconds: number) => Math.round(Math.max(0,seconds)/60);
const n = (value: number, language: CoachLanguage) => language === 'fa' ? value.toLocaleString('fa-IR') : value.toLocaleString('en-US');

export function buildCoachSnapshot(input: CoachInput): CoachSnapshot {
  // Shared StudyOS engine is already account-scoped, deleted-record aware, and read-only.
  const os = buildStudyOS(input);
  const fa = input.language === 'fa';
  const capacity = os.capacity;
  const allocated = os.allocated;
  const weeklyMinutes = minutes(os.weeklySeconds);
  const previousMinutes = minutes(os.previousSeconds);
  const activeDays = os.activeDays;
  const lead = os.plan[0];
  const nextExam = os.upcoming[0];
  const evidence7 = fa ? 'بر پایه جلسات معتبر همین حساب در ۷ روز اخیر، مطابق زمان محلی دستگاه' : 'Based on this account’s recorded sessions in the last 7 local calendar days';
  const evidencePlan = fa ? 'بر اساس تکلیف‌ها، اولویت‌ها و موعد امتحان‌های ثبت‌شده' : 'Based on your recorded tasks, priorities and exam deadlines';
  const response = (intent: CoachIntent, title: string, body: string, evidence: string): CoachReply => ({intent,title,body,evidence});
  const responses: Record<CoachIntent,CoachReply> = {
    next: response('next',fa?'بهترین شروع بعدی':'Your next best step', lead
      ? (fa ? `با «${lead.title}» شروع کن؛ ${n(lead.minutes,'fa')} دقیقه برای این بخش پیشنهاد می‌شود. اگر انرژی کمی داری، با ۱۰ دقیقه شروع کن.` : `Start with “${lead.title}”. I suggest ${n(lead.minutes,'en')} minutes; on a low-energy day, begin with just 10.`)
      : (fa?'هنوز تکلیف یا درس مناسبی برای اولویت‌بندی پیدا نکردم. یک درس یا کار در برنامه اضافه کن؛ می‌توانی فعلاً یک جلسه تمرکز کوتاه شروع کنی.':'I couldn’t find an eligible task or subject yet. Add one in Planner, or begin with a short focus session.'),evidencePlan),
    plan: response('plan',fa?'برنامه واقع‌بینانه امروز':'A realistic plan for today', os.plan.length
      ? (fa ? `با ظرفیت ${n(capacity,'fa')} دقیقه، ${n(os.plan.length,'fa')} بخش و مجموع ${n(allocated,'fa')} دقیقه پیشنهاد شده است: ${os.plan.map((p,i)=>`${n(i+1,'fa')}) ${p.title} (${n(p.minutes,'fa')} دقیقه)`).join('؛ ')}. این یک پیشنهاد قابل‌تغییر است، نه تعهد اجباری.`
            : `With a ${n(capacity,'en')}-minute capacity, here are ${n(os.plan.length,'en')} suggestions totaling ${n(allocated,'en')} minutes: ${os.plan.map((p,i)=>`${i+1}) ${p.title} (${p.minutes} min)`).join('; ')}. Treat this as a flexible suggestion.`)
      : (fa?'برنامه پیشنهادی فعلاً خالی است. کار یا درس جدید اضافه کن یا از تایمر آزاد استفاده کن.':'Your suggested plan is empty. Add a task or subject, or use the free timer.'), evidencePlan),
    momentum: response('momentum',fa?'روند هفت‌روزه تو':'Your 7-day momentum', fa
      ? `در ۷ روز اخیر ${n(weeklyMinutes,'fa')} دقیقه مطالعه ثبت کرده‌ای و در ${n(activeDays,'fa')} روز فعال بوده‌ای؛ ۷ روز پیش از آن ${n(previousMinutes,'fa')} دقیقه بوده است. ${weeklyMinutes < previousMinutes ? 'این کاهش لزوماً نشانه افت کیفیت یادگیری نیست؛ هدفی کوچک و قابل انجام انتخاب کن.' : 'تداوم مهم‌تر از رکوردشکنی روزانه است.'}`
      : `You logged ${n(weeklyMinutes,'en')} minutes across ${n(activeDays,'en')} active days in the last 7 days, compared with ${n(previousMinutes,'en')} minutes in the previous 7. ${weeklyMinutes < previousMinutes ? 'Less time does not necessarily mean worse learning; choose a small achievable goal.' : 'Consistency matters more than setting a record every day.'}`, evidence7),
    exam: response('exam',fa?'اولویت آزمون نزدیک':'Next exam priority', nextExam
      ? (fa ? `آزمون «${nextExam.title}» حدود ${n(nextExam.daysLeft,'fa')} روز دیگر است. ${nextExam.dailyMinutes===null?'هنوز هدف ساعتی مشخصی برای آن ثبت نشده است.':`برای رسیدن به هدف ساعتی ثبت‌شده، تقریباً روزی ${n(nextExam.dailyMinutes,'fa')} دقیقه نیاز است.`} این عدد تضمین آمادگی یا یادگیری نیست.`
             : `“${nextExam.title}” is ${n(nextExam.daysLeft,'en')} calendar days away. ${nextExam.dailyMinutes===null?'No target study hours are recorded for this exam.':`To meet your logged hour goal, the estimate is ${n(nextExam.dailyMinutes,'en')} minutes per day.`} This does not guarantee exam readiness.`)
      : (fa?'آزمون پیش‌رویی در اطلاعات این حساب ثبت نشده است. از برنامه‌ریز می‌توانی آزمون اضافه کنی.':'No upcoming exam was found in this account. Add one in Planner to personalize your guidance.'),fa?'بر اساس تاریخ آزمون و هدف ساعتی ثبت‌شده؛ بدون سنجش تسلط واقعی':'Based on recorded exam date and hour target, not a measure of actual mastery'),
    rest: response('rest',fa?'تمرکز پایدار، نه فشار بیشتر':'Sustainable focus, not overload', fa
      ? `ظرفیت امروزت ${n(capacity,'fa')} دقیقه است. مطالعه را به بخش‌های ۲۵ تا ۴۵ دقیقه‌ای با استراحت کوتاه تقسیم کن. اگر خسته‌ای ظرفیت را کمتر کن؛ این مربی به‌جای تشویق به ساعت‌های افراطی، پیشرفت پایدار را پیشنهاد می‌دهد.`
      : `Your daily capacity is ${n(capacity,'en')} minutes. Try 25–45-minute focus blocks with short breaks. Reduce capacity when tired; a sustainable routine matters more than extreme hours.`,fa?'راهنمای عمومی مطالعه، نه توصیه پزشکی یا ارزیابی سلامت':'General study guidance, not medical advice or a health assessment')
  };
  return {plan:os.plan,allocated,capacity,weeklyMinutes,previousMinutes,activeDays,
    upcomingExams:os.upcoming.map(e=>({name:e.title,daysLeft:e.daysLeft,dailyMinutes:e.dailyMinutes,remainingMinutes:e.remainingMinutes})),responses};
}

/** Minimal, private context for optional browser-provided on-device generation. */
export function anonymousCoachContext(snapshot:CoachSnapshot): string {
  return `Study capacity: ${snapshot.capacity} minutes/day; suggested time: ${snapshot.allocated} minutes; focus last 7 local days: ${snapshot.weeklyMinutes} minutes; previous 7 days: ${snapshot.previousMinutes} minutes; active days this week: ${snapshot.activeDays}; scheduled focus blocks: ${snapshot.plan.length}; days to nearest exam: ${snapshot.upcomingExams[0]?.daysLeft ?? 'not recorded'}.`;
}

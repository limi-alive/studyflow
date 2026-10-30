/** StudyFlow AI plan context: retain only relevant user messages in a single chat.
 * The raw request is always bounded by Worker's 1600-character contract.
 * No private context beyond messages already sent to the AI is introduced.
 */
type Message = {role: 'user' | 'assistant'; content: string};
const planStarter = /(?:برنامه|زمان[‌\s]*بندی|جدول\s*مطالعه|study\s*plan|study\s*schedule|schedule\s*(?:my|for)|timetable)/i;
const continuation = /(?:همین|همون|قبلی|متفاوت|دوباره|از\s*نو|same|different|again|another|previous)/i;

export function isPlanIntakeResponse(text: string): boolean {
  return /^(?:برای ساخت برنامه قابل افزودن به Planner|To build a plan you can add to Planner)/i.test(text.trim());
}

export function buildPlanImportContext(messages: ReadonlyArray<Message>, answerIndex: number): string {
  const users=messages.slice(0, Math.max(0, answerIndex))
    .filter((m): m is Message => m.role === 'user' && !!m.content.trim())
    .slice(-7);
  if (!users.length) return '';
  let start=-1;
  for(let i=users.length-1;i>=0;i--) if(planStarter.test(users[i].content)) {start=i;break;}
  const last=users.at(-1)!.content;
  // "Make another plan with the same constraints" refers to earlier turns.
  if (start === users.length - 1 && continuation.test(last)) {
    for(let i=users.length-2;i>=0;i--) if(planStarter.test(users[i].content)) {start=i;break;}
  }
  const relevant=(start>=0?users.slice(start):users.slice(-2)).map(m=>m.content.trim());
  const combined=relevant.join('\n');
  if (combined.length <= 1600) return combined;
  // Under the 1600-character Worker limit, preserve the beginning of every
  // relevant user turn. The latest instructions get the largest allocation;
  // slicing only the end of a long reply can drop its subject or duration.
  const capacity = 1600 - (relevant.length - 1); // newline separators
  const sizes = relevant.map(text => Math.min(text.length, 120));
  let remaining = capacity - sizes.reduce((sum, size) => sum + size, 0);
  const newest = relevant.length - 1;
  const priorities: Array<[number, number]> = [
    [newest, 900], [0, 450],
    ...Array.from({length: Math.max(0, newest - 1)}, (_, i) => [newest - 1 - i, 280] as [number, number]),
    [newest, Infinity], [0, Infinity],
    ...Array.from({length: Math.max(0, newest - 1)}, (_, i) => [newest - 1 - i, Infinity] as [number, number]),
  ];
  for (const [index, target] of priorities) {
    if (!remaining) break;
    const extra = Math.min(remaining, Math.max(0, Math.min(relevant[index].length, target) - sizes[index]));
    sizes[index] += extra;
    remaining -= extra;
  }
  // Keep both the beginning and the end of a long message, since late
  // corrections (e.g. "not chemistry") matter as much as the subject name.
  const excerpt = (text: string, size: number): string => {
    if (text.length <= size) return text;
    if (size < 20) return text.slice(0, size);
    const start = Math.ceil((size - 1) * 0.78);
    return text.slice(0, start) + '…' + text.slice(-(size - 1 - start));
  };
  return relevant.map((text, index) => excerpt(text, sizes[index])).join('\n');
}

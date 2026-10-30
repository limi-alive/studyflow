import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, CalendarDays, Check, ChevronDown, Clock3, Search, X } from 'lucide-react';
import type { StudyTask, Subject } from '../types';
import { focusTaskDefaults, focusTaskBucket, focusTaskDisplayTitle, focusTaskDueLabel, focusTaskSearchMatch, type FocusTaskBucket } from '../utils/focusPlan';
import '../focus-task-picker.css';

type Props = {
  tasks: StudyTask[];
  subjects: Subject[];
  selectedTaskId: string;
  onSelect: (taskId: string) => void;
  fa: boolean;
};

const LIMIT = 80;

export function FocusTaskPicker({ tasks, subjects, selectedTaskId, onSelect, fa }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [bucket, setBucket] = useState<FocusTaskBucket | 'all'>('all');
  const openButton = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const subjectNames = useMemo(() => new Map(subjects.map(subject => [subject.id, subject.name])), [subjects]);
  const selected = tasks.find(task => task.id === selectedTaskId);
  const today = new Date();
  const localToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const counts = useMemo(() => ({
    all: tasks.length,
    today: tasks.filter(task => focusTaskBucket(task, localToday) === 'today').length,
    upcoming: tasks.filter(task => focusTaskBucket(task, localToday) === 'upcoming').length,
    unscheduled: tasks.filter(task => focusTaskBucket(task, localToday) === 'unscheduled').length
  }), [tasks, localToday]);
  const matches = useMemo(() => tasks.filter(task =>
    (bucket === 'all' || focusTaskBucket(task, localToday) === bucket) &&
    focusTaskSearchMatch(task, subjectNames.get(task.subjectId ?? '') ?? '', query)
  ), [tasks, bucket, query, subjectNames, localToday]);
  const visible = matches.slice(0, LIMIT);
  const labels: Record<FocusTaskBucket | 'all', string> = fa
    ? { all: 'همه', today: 'امروز / معوق', upcoming: 'آینده', unscheduled: 'بدون تاریخ' }
    : { all: 'All', today: 'Today / overdue', upcoming: 'Upcoming', unscheduled: 'Unscheduled' };

  useEffect(() => {
    if (!open) return;
    const oldOverflow = document.body.style.overflow;
    const origin = openButton.current;
    document.body.style.overflow = 'hidden';
    searchInput.current?.focus();
    return () => { document.body.style.overflow = oldOverflow; origin?.focus(); };
  }, [open]);

  const show = () => { setQuery(''); setBucket('all'); setOpen(true); };
  const pick = (id: string) => { onSelect(id); setOpen(false); };
  const onDialogKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') { event.preventDefault(); setOpen(false); return; }
    if (event.key !== 'Tab' || !dialog.current) return;
    const focusables = Array.from(dialog.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), a[href]'))
      .filter(node => node.getClientRects().length > 0);
    if (focusables.length === 0) return;
    const first = focusables[0], last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };

  return <div className="focus-task-field">
    <span className="focus-task-field-label" id="focus-task-field-label">{fa ? 'فعالیت برنامه‌ریز' : 'Planner task'}</span>
    <button type="button" ref={openButton} className="focus-task-opener" aria-haspopup="dialog" aria-expanded={open}
      aria-labelledby="focus-task-field-label focus-task-choice" onClick={show}>
      <span className="focus-task-opener-icon"><BookOpen size={18} aria-hidden="true"/></span>
      <span className="focus-task-opener-copy" id="focus-task-choice">
        <strong dir="auto">{selected ? focusTaskDisplayTitle(selected.title, subjectNames.get(selected.subjectId ?? ''), selected.estimatedMinutes) : (fa ? 'تمرکز آزاد' : 'Free focus')}</strong>
        <small>{selected
          ? `${subjectNames.get(selected.subjectId ?? '') ?? (fa ? 'بدون درس' : 'No subject')} · ${focusTaskDefaults(selected).duration} ${fa ? 'دقیقه' : 'min'}`
          : fa ? `${tasks.length} فعالیت باز · برای انتخاب بزنید` : `${tasks.length} open tasks · Select a task`}</small>
      </span>
      <ChevronDown size={18} className="focus-task-opener-chevron" aria-hidden="true"/>
    </button>
    {selected && <button type="button" className="focus-task-clear" onClick={() => onSelect('')}>
      <X size={14} aria-hidden="true"/> {fa ? 'حذف انتخاب و تمرکز آزاد' : 'Clear selection and focus freely'}
    </button>}
    {open && createPortal(<div className="focus-task-backdrop" onMouseDown={event => {if (event.target === event.currentTarget) setOpen(false);}}>
      <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="focus-task-dialog-heading" className="focus-task-dialog" onKeyDown={onDialogKey} dir={fa ? 'rtl' : 'ltr'}>
        <div className="focus-task-dialog-head">
          <div><span className="focus-task-kicker">{fa ? 'مطالعه هدفمند' : 'Intentional focus'}</span>
            <h2 id="focus-task-dialog-heading">{fa ? 'انتخاب فعالیت برای تمرکز' : 'Choose a Planner task'}</h2>
            <p>{fa ? 'انتخاب شما به جلسه تایمر متصل می‌شود.' : 'Your selection is linked to the timer session.'}</p>
          </div>
          <button type="button" className="focus-task-dismiss" onClick={() => setOpen(false)} aria-label={fa ? 'بستن پنجره' : 'Close dialog'}><X size={19}/></button>
        </div>
        <div className="focus-task-search-wrap"><Search size={18} aria-hidden="true"/><input ref={searchInput} type="search" value={query} onChange={event => setQuery(event.target.value)}
          placeholder={fa ? 'جست‌وجوی فعالیت یا درس…' : 'Search task or subject…'} aria-label={fa ? 'جست‌وجوی فعالیت‌ها' : 'Search tasks'} dir="auto" autoComplete="off"/></div>
        <div className="focus-task-filter" role="group" aria-label={fa ? 'فیلتر زمانی' : 'Date filter'}>
          {(Object.keys(labels) as Array<FocusTaskBucket | 'all'>).map(key => <button key={key} type="button"
            className={bucket === key ? 'is-current' : ''} aria-pressed={bucket === key} onClick={() => setBucket(key)}>
            {labels[key]} <span dir="ltr">{counts[key]}</span></button>)}
        </div>
        <div className="focus-task-scroll" role="region" aria-label={fa ? 'نتایج فعالیت‌ها' : 'Task results'}>
          <button type="button" className="focus-task-choice focus-task-free" onClick={() => pick('')}>
            <span className="focus-task-choice-main"><strong>{fa ? 'تمرکز آزاد' : 'Free focus'}</strong><small>{fa ? 'بدون اتصال به فعالیت خاص' : 'Do not link a Planner task'}</small></span>
            {!selected && <Check size={19} aria-hidden="true"/>}
          </button>
          {visible.map(task => {
            const subject = subjectNames.get(task.subjectId ?? '') ?? (fa ? 'بدون درس' : 'No subject');
            return <button type="button" className={`focus-task-choice ${selectedTaskId === task.id ? 'is-selected' : ''}`} key={task.id} onClick={() => pick(task.id)} aria-pressed={selectedTaskId === task.id} title={task.title}>
              <span className="focus-task-choice-main"><strong dir="auto">{focusTaskDisplayTitle(task.title, subject, task.estimatedMinutes)}</strong>
                <span className="focus-task-meta"><span><BookOpen size={13} aria-hidden="true"/> {subject}</span>
                  <span><Clock3 size={13} aria-hidden="true"/> {focusTaskDefaults(task).duration} {fa ? 'دقیقه' : 'min'}</span>
                  {task.deadline && <span><CalendarDays size={13} aria-hidden="true"/> {focusTaskDueLabel(task.deadline, fa)}</span>}
                </span></span>
              {selectedTaskId === task.id && <Check size={19} aria-hidden="true"/>}
            </button>;
          })}
          {matches.length === 0 && <div className="focus-task-empty" role="status">{tasks.length === 0
            ? fa ? 'هنوز فعالیت بازی در Planner ندارید. ابتدا یک فعالیت بسازید یا از AI اضافه کنید.' : 'No open Planner tasks yet. Create or import one first.'
            : fa ? 'فعالیتی مطابق جست‌وجو یا فیلتر پیدا نشد.' : 'No tasks match this search or filter.'}</div>}
          {matches.length > LIMIT && <p className="focus-task-limit">{fa ? `${LIMIT} مورد اول نمایش داده می‌شود؛ جست‌وجو را دقیق‌تر کنید.` : `Showing the first ${LIMIT} results; refine your search.`}</p>}
        </div>
        <div className="focus-task-dialog-foot"><span>{fa ? `${matches.length} فعالیت پیدا شد` : `${matches.length} tasks found`}</span>
          <button type="button" onClick={() => setOpen(false)}>{fa ? 'بستن' : 'Close'}</button></div>
      </div>
    </div>, document.body)}
  </div>;
}

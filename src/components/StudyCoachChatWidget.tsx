import { useEffect, useId, useRef, useState, type CSSProperties, type FormEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { BrainCircuit, ChevronDown, MessageCircle, Send, ShieldCheck, Trash2, X } from 'lucide-react';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useUiLanguage } from '../lib/uiLanguage';
import { db } from '../lib/db';
import { anonymousCoachContext, buildCoachSnapshot } from '../utils/studyCoach';
import { getStudyCoachEndpoint, requestStudyCoachReply, type CoachChatMessage } from '../lib/studyCoachChat';
import '../study-coach-chat-widget.css';

/** Mounted once above route transitions: the conversation stays open while navigating. */
export function StudyCoachChatWidget() {
  const { userId } = useCurrentUser();
  const language = useUiLanguage();
  const fa = language === 'fa';
  const dialogId = useId();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<CoachChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [endpoint, setEndpoint] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [shareSummary, setShareSummary] = useState(false);
  const [keyboardInset, setKeyboardInset] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const busyRef = useRef(false);
  const lastAccountRef = useRef(userId);

  useEffect(() => {
    let active = true;
    void getStudyCoachEndpoint().then(value => { if (active) setEndpoint(value); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener('studyflow:open-ai-chat', onOpen);
    return () => window.removeEventListener('studyflow:open-ai-chat', onOpen);
  }, []);

  useEffect(() => {
    if (lastAccountRef.current === userId) return;
    lastAccountRef.current = userId;
    abortRef.current?.abort();
    busyRef.current = false;
    setMessages([]); setDraft(''); setStatus(''); setShareSummary(false); setSending(false);
  }, [userId]);

  useEffect(() => () => { abortRef.current?.abort(); }, []);

  useEffect(() => {
    if (!open) return;
    const raf = window.requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'auto' });
    });
    return () => window.cancelAnimationFrame(raf);
  }, [open, messages, sending]);

  useEffect(() => {
    if (!open) return;
    const raf = window.requestAnimationFrame(() => textRef.current?.focus({ preventScroll: true }));
    return () => window.cancelAnimationFrame(raf);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const update = () => {
      const viewport = window.visualViewport;
      const occluded = viewport ? Math.max(0, window.innerHeight - (viewport.height + viewport.offsetTop)) : 0;
      setKeyboardInset(occluded > 110 ? occluded : 0);
    };
    update();
    window.visualViewport?.addEventListener('resize', update);
    window.visualViewport?.addEventListener('scroll', update);
    return () => {
      window.visualViewport?.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('scroll', update);
    };
  }, [open]);

  const close = () => { setOpen(false); launcherRef.current?.focus({ preventScroll: true }); };
  const onPanelKey = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') { event.stopPropagation(); close(); }
  };
  const onComposerKey = (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };
  const clear = () => {
    abortRef.current?.abort(); busyRef.current = false; setSending(false);
    setMessages([]); setStatus(''); setDraft('');
    textRef.current?.focus();
  };
  const send = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const question = draft.trim();
    if (!question || busyRef.current) return;
    if (!endpoint) {
      setStatus(fa ? 'سرور هوش مصنوعی تنظیم نشده است. برای راهنمایی آفلاین به بخش مربی مطالعه برو.' : 'AI endpoint is not configured. Offline study guidance is still available in Study Coach.');
      return;
    }
    const accountAtStart = userId;
    const controller = new AbortController();
    abortRef.current = controller;
    busyRef.current = true; setSending(true); setDraft(''); setStatus('');
    const next: CoachChatMessage[] = [...messages, { role: 'user', content: question }];
    setMessages(next);
    try {
      let numericContext: string | undefined;
      if (shareSummary) {
        const [tasks, subjects, sessions, exams] = await Promise.all([
          db.tasks.where('userId').equals(userId).toArray(),
          db.subjects.where('userId').equals(userId).toArray(),
          db.sessions.where('userId').equals(userId).toArray(),
          db.exams.where('userId').equals(userId).toArray()
        ]);
        if (controller.signal.aborted) return;
        numericContext = anonymousCoachContext(buildCoachSnapshot({
          userId, tasks, subjects, sessions, exams, now: new Date(),
          capacityMinutes: 90, language
        }));
      }
      const result = await requestStudyCoachReply({ endpoint, messages: next, language: fa ? 'fa' : 'en', numericContext, signal: controller.signal });
      if (!controller.signal.aborted && lastAccountRef.current === accountAtStart) {
        setMessages(previous => [...previous, { role: 'assistant', content: result.reply }]);
      }
    } catch (error) {
      if (controller.signal.aborted || lastAccountRef.current !== accountAtStart) return;
      const reason = error instanceof Error ? error.message : '';
      setStatus(reason === 'login_required'
        ? (fa ? 'برای گفتگو با AI باید وارد حساب StudyFlow شوی.' : 'Sign in to StudyFlow to use cloud AI.')
        : reason === 'provider_unavailable'
          ? (fa ? 'سرور Qwen فعلاً پاسخ نمی‌دهد یا ظرفیت رایگان آن پر شده است. می‌توانی دوباره تلاش کنی.' : 'Qwen is temporarily unavailable or cloud quota is exhausted. You can retry.')
          : (fa ? 'ارتباط با AI برقرار نشد. اتصال اینترنت و تنظیمات سرور را بررسی کن.' : 'Unable to reach AI. Check the connection and server settings.'));
      // Keep the user's question for an explicit retry; do not fabricate an AI response.
      setDraft(question);
      setMessages(previous => previous.slice(0, -1));
    } finally {
      if (abortRef.current === controller) { abortRef.current = null; busyRef.current = false; setSending(false); }
    }
  };

  const greeting = fa ? 'سلام! برای برنامه‌ریزی، تمرکز و تحلیل مطالعه چه کمکی می‌خواهی؟' : 'Hi! Ask me about planning, focus or your study progress.';
  return createPortal(
    <div className="sf-ai-chat-root" data-keyboard-open={keyboardInset > 110} dir={fa ? 'rtl' : 'ltr'} style={{ '--sf-ai-keyboard': `${keyboardInset}px` } as CSSProperties}>
      {open && <section id={dialogId} className="sf-ai-chat-window" role="dialog" aria-modal="false" aria-label={fa ? 'گفتگو با مربی هوشمند' : 'AI Study Coach chat'} onKeyDown={onPanelKey}>
        <header className="sf-ai-chat-header">
          <div className="sf-ai-chat-avatar"><BrainCircuit size={21} aria-hidden="true"/></div>
          <div className="sf-ai-chat-heading"><strong>{fa ? 'مربی هوشمند StudyFlow' : 'StudyFlow AI Coach'}</strong><small>{fa ? 'همراه مطالعه تو' : 'Your study companion'}</small></div>
          <button type="button" className="sf-ai-chat-icon" aria-label={fa ? 'پاک کردن گفتگو' : 'Clear conversation'} title={fa ? 'پاک کردن گفتگو' : 'Clear conversation'} onClick={clear} disabled={messages.length === 0 && !sending}><Trash2 size={17}/></button>
          <button type="button" className="sf-ai-chat-icon" aria-label={fa ? 'بستن گفتگو' : 'Close chat'} onClick={close}><X size={19}/></button>
        </header>
        <div className="sf-ai-chat-messages" ref={listRef} role="log" aria-live="polite" aria-relevant="additions text">
          <div className="sf-ai-chat-welcome"><span className="sf-ai-chat-welcome-icon"><BrainCircuit size={20}/></span><p>{greeting}</p></div>
          {messages.map((message, index) => <div key={index} className={`sf-ai-chat-message ${message.role === 'user' ? 'from-user' : 'from-ai'}`}><p dir="auto">{message.content}</p></div>)}
          {sending && <div role="status" className="sf-ai-chat-typing"><span/><span/><span/><span className="sf-ai-visually-hidden">{fa ? 'در حال پاسخ‌گویی' : 'Thinking'}</span></div>}
        </div>
        <div className="sf-ai-chat-footer">
          {status && <div className="sf-ai-chat-status" role="status">{status}{status.includes('وارد حساب') || status.includes('Sign in') ? <button type="button" onClick={() => window.dispatchEvent(new Event('studyflow:open-auth'))}>{fa ? 'ورود' : 'Sign in'}</button> : null}</div>}
          <label className="sf-ai-chat-consent"><input type="checkbox" checked={shareSummary} onChange={event => setShareSummary(event.target.checked)} disabled={sending}/><span>{fa ? 'ارسال اختیاری خلاصه عددی مطالعه' : 'Share numeric study summary (optional)'}</span></label>
          <form className="sf-ai-chat-form" onSubmit={event => void send(event)}>
            <label className="sf-ai-visually-hidden" htmlFor={`${dialogId}-composer`}>{fa ? 'پیام تو' : 'Your message'}</label>
            <textarea ref={textRef} id={`${dialogId}-composer`} rows={1} maxLength={1600} dir="auto" value={draft} onChange={event => setDraft(event.target.value)} onKeyDown={onComposerKey} placeholder={fa ? 'پیامت را بنویس…' : 'Type a message…'}/>
            <button type="submit" disabled={!draft.trim() || sending} aria-label={fa ? 'ارسال پیام' : 'Send message'}><Send size={19}/></button>
          </form>
          <div className="sf-ai-chat-disclaimer"><ShieldCheck size={13}/>{fa ? 'متن گفتگو برای پردازش AI ارسال می‌شود؛ اطلاعات حساس نفرست.' : 'AI processes chat text. Do not send sensitive information.'}</div>
        </div>
      </section>}
      <button ref={launcherRef} type="button" className={`sf-ai-chat-launcher ${open ? 'is-open' : ''}`} aria-label={open ? (fa ? 'بستن چت هوش مصنوعی' : 'Close AI chat') : (fa ? 'باز کردن چت هوش مصنوعی' : 'Open AI chat')} aria-controls={dialogId} aria-expanded={open} onClick={() => open ? close() : setOpen(true)}>
        {open ? <ChevronDown size={26}/> : <MessageCircle size={26}/>}
        {!open && <span className="sf-ai-chat-launcher-label">AI</span>}
      </button>
    </div>, document.body
  );
}

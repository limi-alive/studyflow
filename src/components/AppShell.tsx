import { BarChart3, BookOpen, CalendarDays, Clock3, Home, Settings, UserRound, History, Plus, Search, Command, Sparkles } from 'lucide-react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { SyncBadge } from './SyncBadge';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useSettings } from '../hooks/useSettings';
import { useEffect, useState } from 'react';

export function AppShell() {
  const { userId } = useCurrentUser();
  const settings = useSettings(userId);
  const navigate = useNavigate();
  const location = useLocation();
  const [quick,setQuick]=useState(false);
  const fa = settings?.language === 'fa';
  const mobile = [
    ['/', Home, fa?'خانه':'Home'], ['/timer', Clock3, fa?'تایمر':'Timer'], ['/planner', CalendarDays, fa?'برنامه':'Planner'], ['/stats', BarChart3, fa?'آمار':'Stats'], ['/profile', UserRound, fa?'من':'Me']
  ] as const;
  const desktop = [
    ...mobile.slice(0,4), ['/subjects', BookOpen, fa?'درس‌ها':'Subjects'], ['/history', History, fa?'سابقه':'History'], ['/search', Search, fa?'جستجو':'Search'], ['/profile', UserRound, fa?'پروفایل':'Profile'], ['/settings', Settings, fa?'تنظیمات':'Settings']
  ] as const;

  useEffect(() => {
    document.documentElement.dataset.theme = settings?.themeId ?? 'plush';
    document.documentElement.dir = fa ? 'rtl' : 'ltr';
    document.documentElement.lang = settings?.language ?? 'en';
    document.documentElement.classList.toggle('reduce-motion', Boolean(settings?.reduceMotion));
  }, [settings, fa]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setQuick(true);
      }
      if (event.key === 'Escape') setQuick(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const go=(path:string)=>{setQuick(false);navigate(path);};
  const reduceMotion = Boolean(settings?.reduceMotion);

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Sparkles size={17}/></div><div><strong>StudyFlow</strong><small>focus, softly</small></div></div>
      <nav>{desktop.map(([to, Icon, label]) => <NavLink key={to} to={to} end={to === '/'}><span className="nav-icon"><Icon size={19}/></span><span>{label}</span></NavLink>)}</nav>
      <button className="command-button" onClick={()=>setQuick(true)}><Command size={16}/><span>{fa?'دسترسی سریع':'Quick actions'}</span><kbd>⌘K</kbd></button>
      <div className="sidebar-foot"><SyncBadge userId={userId}/></div>
    </aside>

    <main className="main">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname}
          className="route-frame"
          initial={reduceMotion ? false : { opacity: 0, y: 10, scale: .995 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -6, scale: .997 }}
          transition={{ duration: reduceMotion ? 0 : .24, ease: [0.22, 1, 0.36, 1] }}
        >
          <Outlet/>
        </motion.div>
      </AnimatePresence>
    </main>

    <button className="fab" onClick={() => setQuick(true)} aria-label={fa?'افزودن سریع':'Quick add'}><Plus/></button>
    <nav className="bottom-nav">{mobile.map(([to, Icon, label]) => <NavLink className={to==='/timer'?'nav-focus':''} key={to} to={to} end={to === '/'}><span className="nav-icon"><Icon size={21}/></span><small>{label}</small></NavLink>)}</nav>

    {quick&&<div className="modal-backdrop" onClick={()=>setQuick(false)}><div className="modal quick-modal" onClick={e=>e.stopPropagation()}>
      <div className="modal-grabber"/>
      <div className="eyebrow">{fa?'دسترسی سریع':'Quick actions'}</div>
      <h2>{fa?'بعدی چیه؟':'What’s next?'}</h2>
      <p className="subtle">{fa?'بدون گشتن بین صفحه‌ها، سریع شروع کن.':'Start fast without digging through menus.'}</p>
      <div className="quick-grid">
        <button className="quick-action primary" onClick={()=>go('/timer')}><Clock3/><span><strong>{fa?'شروع مطالعه':'Start focus'}</strong><small>{fa?'تایمر را باز کن':'Open the timer'}</small></span></button>
        <button className="quick-action" onClick={()=>go('/planner')}><CalendarDays/><span><strong>{fa?'افزودن کار':'Add task'}</strong><small>{fa?'برای امروز برنامه بریز':'Plan your day'}</small></span></button>
        <button className="quick-action" onClick={()=>go('/subjects')}><BookOpen/><span><strong>{fa?'افزودن درس':'Add subject'}</strong><small>{fa?'ساختار مطالعه':'Organize study'}</small></span></button>
        <button className="quick-action" onClick={()=>go('/search')}><Search/><span><strong>{fa?'جستجو':'Search'}</strong><small>{fa?'هرچیزی را پیدا کن':'Find anything'}</small></span></button>
      </div>
    </div></div>}
  </div>;
}

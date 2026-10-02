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
    ['/', Home, fa?'خانه':'Dashboard'], ['/timer', Clock3, fa?'تایمر':'Focus'], ['/planner', CalendarDays, fa?'برنامه':'Planner'], ['/stats', BarChart3, fa?'آمار':'Analytics'], ['/subjects', BookOpen, fa?'درس‌ها':'Subjects'], ['/history', History, fa?'سابقه':'History'], ['/search', Search, fa?'جستجو':'Search']
  ] as const;

  useEffect(() => {
    document.documentElement.dataset.theme = settings?.themeId ?? 'studio';
    document.documentElement.dir = fa ? 'rtl' : 'ltr';
    document.documentElement.lang = settings?.language ?? 'en';
    document.documentElement.classList.toggle('reduce-motion', Boolean(settings?.reduceMotion));
  }, [settings, fa]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setQuick(true); }
      if (event.key === 'Escape') setQuick(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const go=(path:string)=>{setQuick(false);navigate(path);};
  const reduceMotion = Boolean(settings?.reduceMotion);

  return <div className="app-shell">
    <aside className="sidebar studio-sidebar">
      <div className="brand studio-brand"><div className="brand-mark"><Sparkles size={18}/></div><div><strong>StudyFlow</strong><small>focus system</small></div></div>
      <nav className="studio-nav">{desktop.map(([to, Icon, label]) => <NavLink key={to} to={to} end={to === '/'} title={label}><span className="nav-icon"><Icon size={19}/></span><span className="nav-label">{label}</span></NavLink>)}</nav>
      <div className="sidebar-spacer"/>
      <div className="sidebar-tools">
        <button className="command-button studio-command" onClick={()=>setQuick(true)}><Command size={17}/><span>{fa?'دسترسی سریع':'Command'}</span><kbd>⌘K</kbd></button>
        <NavLink className="settings-shortcut" to="/settings" title={fa?'تنظیمات':'Settings'}><Settings size={18}/></NavLink>
      </div>
      <NavLink className="profile-shortcut" to="/profile"><span className="profile-avatar"><UserRound size={17}/></span><span><strong>{fa?'پروفایل':'Profile'}</strong><small>{fa?'حساب و پیشرفت':'Account & progress'}</small></span></NavLink>
      <div className="sidebar-foot"><SyncBadge userId={userId}/></div>
    </aside>

    <main className="main studio-main">
      <AnimatePresence mode="wait" initial={false}><motion.div key={location.pathname} className="route-frame" initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, y: -4 }} transition={{ duration: reduceMotion ? 0 : .2, ease: [0.22, 1, 0.36, 1] }}><Outlet/></motion.div></AnimatePresence>
    </main>

    <button className="fab" onClick={() => setQuick(true)} aria-label={fa?'افزودن سریع':'Quick add'}><Plus size={23}/></button>
    <nav className="bottom-nav">{mobile.map(([to, Icon, label]) => <NavLink className={to==='/timer'?'nav-focus':''} key={to} to={to} end={to === '/'}><span className="nav-icon"><Icon size={21}/></span><small>{label}</small></NavLink>)}</nav>

    {quick&&<div className="modal-backdrop" onClick={()=>setQuick(false)}><div className="modal quick-modal" onClick={e=>e.stopPropagation()}><div className="modal-grabber"/><div className="eyebrow">{fa?'دسترسی سریع':'Quick actions'}</div><h2>{fa?'بعدی چیه؟':'What’s next?'}</h2><p className="subtle">{fa?'بدون گشتن بین صفحه‌ها، سریع شروع کن.':'Start fast without digging through menus.'}</p><div className="quick-grid"><button className="quick-action primary" onClick={()=>go('/timer')}><Clock3/><span><strong>{fa?'شروع مطالعه':'Start focus'}</strong><small>{fa?'تایمر را باز کن':'Open the timer'}</small></span></button><button className="quick-action" onClick={()=>go('/planner')}><CalendarDays/><span><strong>{fa?'افزودن کار':'Add task'}</strong><small>{fa?'برای امروز برنامه بریز':'Plan your day'}</small></span></button><button className="quick-action" onClick={()=>go('/subjects')}><BookOpen/><span><strong>{fa?'افزودن درس':'Add subject'}</strong><small>{fa?'ساختار مطالعه':'Organize study'}</small></span></button><button className="quick-action" onClick={()=>go('/search')}><Search/><span><strong>{fa?'جستجو':'Search'}</strong><small>{fa?'هرچیزی را پیدا کن':'Find anything'}</small></span></button></div></div></div>}
  </div>;
}

import { BarChart3, BookOpen, CalendarDays, Clock3, Home, Settings, UserRound, History, Plus, Search } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { SyncBadge } from './SyncBadge';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useSettings } from '../hooks/useSettings';
import { useEffect, useState } from 'react';

export function AppShell() {
  const { userId } = useCurrentUser();
  const settings = useSettings(userId);
  const navigate = useNavigate();
  const [quick,setQuick]=useState(false);
  const fa = settings?.language === 'fa';
  const mobile = [
    ['/', Home, fa?'خانه':'Home'], ['/timer', Clock3, fa?'تایمر':'Timer'], ['/planner', CalendarDays, fa?'برنامه':'Planner'], ['/stats', BarChart3, fa?'آمار':'Stats'], ['/profile', UserRound, fa?'من':'Me']
  ] as const;
  const desktop = [
    ...mobile.slice(0,4), ['/subjects', BookOpen, fa?'درس‌ها':'Subjects'], ['/history', History, fa?'سابقه':'History'], ['/search', Search, fa?'جستجو':'Search'], ['/profile', UserRound, fa?'پروفایل':'Profile'], ['/settings', Settings, fa?'تنظیمات':'Settings']
  ] as const;
  useEffect(() => {
    document.documentElement.dataset.theme = settings?.themeId ?? 'liquid';
    document.documentElement.dir = fa ? 'rtl' : 'ltr';
    document.documentElement.lang = settings?.language ?? 'en';
    document.documentElement.classList.toggle('reduce-motion', Boolean(settings?.reduceMotion));
  }, [settings, fa]);
  const go=(path:string)=>{setQuick(false);navigate(path);};

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">S</div><strong>StudyFlow</strong></div>
      <nav>{desktop.map(([to, Icon, label]) => <NavLink key={to} to={to} end={to === '/'}><Icon size={20}/><span>{label}</span></NavLink>)}</nav>
      <div className="sidebar-foot"><SyncBadge userId={userId}/></div>
    </aside>
    <main className="main"><Outlet/></main>
    <button className="fab" onClick={() => setQuick(true)} aria-label={fa?'افزودن سریع':'Quick add'}><Plus/></button>
    <nav className="bottom-nav">{mobile.map(([to, Icon, label]) => <NavLink key={to} to={to} end={to === '/'}><Icon size={21}/><small>{label}</small></NavLink>)}</nav>
    {quick&&<div className="modal-backdrop" onClick={()=>setQuick(false)}><div className="modal" onClick={e=>e.stopPropagation()}><div className="eyebrow">{fa?'افزودن سریع':'Quick add'}</div><h2>{fa?'چه کاری می‌خواهید انجام دهید؟':'What do you want to do?'}</h2><div className="grid grid-2"><button className="button primary" onClick={()=>go('/timer')}>{fa?'شروع مطالعه':'Start study'}</button><button className="button" onClick={()=>go('/planner')}>{fa?'افزودن کار':'Add task'}</button><button className="button" onClick={()=>go('/subjects')}>{fa?'افزودن درس':'Add subject'}</button><button className="button" onClick={()=>go('/history')}>{fa?'افزودن جلسه':'Add session'}</button></div></div></div>}
  </div>;
}

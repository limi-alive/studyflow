import { useUiText, setUiLanguage, useUiLanguage } from '../lib/uiLanguage';
import { Trophy as TrophyIcon, BarChart3, BookOpen, CalendarDays, Clock3, Home, Settings, UserRound, History, Plus, Search, TrendingUp, ChevronDown, Command, Sparkles, LogIn, LogOut, ShieldCheck, BrainCircuit } from 'lucide-react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { SyncBadge } from './SyncBadge';
import { BackgroundSyncNotice } from './BackgroundSyncNotice';
import { StudyCoachChatWidget } from './StudyCoachChatWidget';
import { AuthGate } from './AuthGate';
import { SidebarRewardCard } from './SidebarRewardCard';
import { DashboardRewardCard } from './DashboardRewardCard';
import { GlobalLeaderboardCard } from './GlobalLeaderboardCard';
import { useAuthIdentity } from '../hooks/useAuthIdentity';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useSettings } from '../hooks/useSettings';
import { useAdminAccess } from '../hooks/useAdminAccess';
import { usePublicLeaderboard } from '../hooks/usePublicLeaderboard';
import { useEffect, useState } from 'react';

function resolvedRoutePath(pathname: string) {
  const hashPath = typeof window !== 'undefined' ? window.location.hash.replace(/^#/, '') : '';
  const raw = hashPath.startsWith('/') ? hashPath : pathname || '/';
  const clean = raw.split('?')[0].replace(/\/+$/, '');
  return clean || '/';
}

export function AppShell() {
 const uiText=useUiText();
  const { userId } = useCurrentUser();
  const settings = useSettings(userId);
  const identity = useAuthIdentity();
  const admin = useAdminAccess();
  const leaderboard = usePublicLeaderboard();
  const navigate = useNavigate();
  const location = useLocation();
  const [quick, setQuick] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [leagueOpen, setLeagueOpen] = useState(false);
  const uiLanguage = useUiLanguage();
  const fa = uiLanguage === 'fa';
  const mobile = [
    ['/', Home, fa ? 'خانه' : 'Home'], ['/timer', Clock3, fa ? 'تایمر' : 'Timer'], ['/planner', CalendarDays, fa ? 'برنامه' : 'Planner'], ['/stats', BarChart3, fa ? 'آمار' : 'Stats'], ['/profile', UserRound, fa ? 'من' : 'Me']
  ] as const;
  const primaryNav = [
    ['/', Home, fa ? 'خانه' : 'Dashboard'], ['/studyos', BrainCircuit, fa ? 'اتاق فرمان' : 'StudyOS'], ['/timer', Clock3, fa ? 'تایمر' : 'Focus'], ['/planner', CalendarDays, fa ? 'برنامه' : 'Planner'], ['/stats', BarChart3, fa ? 'آمار' : 'Analytics']
  ] as const;
  const secondaryNav = [
    ['/coach', Sparkles, fa ? 'مربی مطالعه' : 'Study Coach'],
    ['/subjects', BookOpen, fa ? 'درس‌ها' : 'Subjects'],
    ['/history', History, fa ? 'سابقه' : 'History'],
    ['/progress', TrendingUp, fa ? 'پیشرفت' : 'Progress'],
    ['/search', Search, fa ? 'جستجو' : 'Search'],
    ...(admin.isAdmin ? [['/admin', ShieldCheck, fa ? 'مدیریت' : 'Admin'] as const] : [])
  ] as const;
  const routePath = resolvedRoutePath(location.pathname);
  const routeKey = routePath === '/' ? 'dashboard' : routePath.slice(1).split('/')[0] || 'dashboard';
  const routeLabel: Record<string, string> = fa ? {
    dashboard: 'خانه', coach:'مربی مطالعه', studyos:'اتاق فرمان', progress:'پیشرفت', timer: 'تمرکز', planner: 'برنامه', stats: 'آمار', profile: 'پروفایل', settings: 'تنظیمات', subjects: 'درس‌ها', history: 'سابقه', search: 'جستجو', admin: 'مدیریت'
  } : {
    dashboard: 'Dashboard', coach:'Study Coach', studyos:'StudyOS', progress:'Progress', timer: 'Focus', planner: 'Planner', stats: 'Analytics', profile: 'Profile', settings: 'Settings', subjects: 'Subjects', history: 'History', search: 'Search', admin: 'Admin'
  };

  useEffect(() => {
    document.documentElement.dataset.theme = settings?.themeId ?? 'studio';
    if (settings?.language) setUiLanguage(settings.language);
    document.documentElement.classList.toggle('reduce-motion', Boolean(settings?.reduceMotion));
  }, [settings]);

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

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [routePath]);

  const go = (path: string) => { setQuick(false); navigate(path); };
  const reduceMotion = Boolean(settings?.reduceMotion);
  const accountLabel = identity.username || identity.displayName || identity.email || (fa ? 'حساب کاربری' : 'Account');
  const accountSub = identity.signedIn ? (identity.email ?? (fa ? 'حساب ابری' : 'Cloud account')) : (fa ? 'ورود یا ساخت حساب' : 'Sign in or create account');
  const openAuth = () => window.dispatchEvent(new Event('studyflow:open-auth'));
  const rewardCalendar = settings?.calendarType ?? 'gregorian';
  const inMore = secondaryNav.some(([to]) => routePath === to);
  useEffect(() => { if (inMore) setMoreOpen(true); }, [inMore]);

  return <div className="app-shell" data-route={routeKey} data-ui-build="14.1">
    <aside className="sidebar studio-sidebar">
      <div className="brand studio-brand"><div className="brand-mark"><Sparkles size={18}/></div><div><strong>{uiText("StudyFlow")}</strong><small>{uiText("focus system")}</small></div></div>
      <nav className="studio-nav" aria-label={fa ? 'ناوبری اصلی' : 'Primary navigation'}>
        {primaryNav.map(([to, Icon, label]) => <NavLink key={to} to={to} end={to === '/'} title={label}><span className="nav-icon"><Icon size={19}/></span><span className="nav-label">{label}</span></NavLink>)}
        <button type="button" className={`studio-more-toggle ${inMore?'active':''}`} aria-expanded={moreOpen} onClick={()=>setMoreOpen(!moreOpen)}>
          <span className="nav-icon"><BookOpen size={19}/></span><span className="nav-label">{fa ? 'کتابخانه و بیشتر' : 'Library & more'}</span><ChevronDown size={15} className={moreOpen?'expanded':''}/>
        </button>
        {moreOpen && <div className="studio-subnav">{secondaryNav.map(([to, Icon, label]) => <NavLink key={to} to={to} title={label}><span className="nav-icon"><Icon size={17}/></span><span className="nav-label">{label}</span></NavLink>)}</div>}
      </nav>

      <div className="sidebar-spacer"/>
      <div className="sidebar-league-container"><button type="button" className="sidebar-league-toggle" aria-expanded={leagueOpen} onClick={()=>setLeagueOpen(!leagueOpen)}><TrophyIcon/> {fa?'پاداش و لیگ مطالعه':'Rewards & league'} <ChevronDown size={14} className={leagueOpen?'expanded':''}/></button>
      {leagueOpen && <div className="sidebar-league-content"><SidebarRewardCard userId={userId} calendarType={rewardCalendar} onOpenDetails={() => navigate('/settings')}/><GlobalLeaderboardCard board={leaderboard} variant="sidebar"/></div>}</div>

      <div className="sidebar-tools">
        <button className="command-button studio-command" onClick={() => setQuick(true)}><Command size={17}/><span>{fa ? 'دسترسی سریع' : 'Command'}</span><kbd>{uiText("⌘K")}</kbd></button>
        <NavLink className="settings-shortcut" to="/settings" title={fa ? 'تنظیمات' : 'Settings'}><Settings size={18}/></NavLink>
      </div>

      <div className="sidebar-account-wrap">
        <button className="profile-shortcut sidebar-account-button" type="button" onClick={() => identity.signedIn ? navigate('/profile') : openAuth()}>
          <span className={`profile-avatar ${identity.signedIn ? 'signed-in' : ''}`}>{identity.signedIn ? <UserRound size={17}/> : <LogIn size={17}/>}</span>
          <span className="sidebar-account-copy"><strong>{accountLabel}</strong><small>{accountSub}</small></span>
        </button>
        {identity.signedIn && <button className="sidebar-signout" type="button" title={fa ? 'خروج' : 'Sign out'} aria-label={fa ? 'خروج' : 'Sign out'} onClick={() => void identity.signOut()}><LogOut size={16}/></button>}
      </div>
      <div className="sidebar-foot"><SyncBadge userId={userId} enabled={identity.signedIn}/></div>
    </aside>

    <header className="mobile-appbar">
      <button className="mobile-appbar-brand" type="button" onClick={() => navigate('/')} aria-label={uiText("Go to dashboard")}>
        <span className="mobile-appbar-mark"><Sparkles size={16}/></span>
        <span><strong>{uiText("StudyFlow")}</strong><small>{routeLabel[routeKey] ?? 'Focus system'}</small></span>
      </button>
      <div className="mobile-appbar-actions">
        {routeKey !== 'timer' && <button type="button" aria-label={uiText("Quick actions")} onClick={() => setQuick(true)}><Plus size={18}/></button>}
        <button type="button" aria-label={identity.signedIn ? (fa ? 'نمایش پروفایل' : 'Open profile') : (fa ? 'ورود' : 'Sign in')} onClick={() => identity.signedIn ? navigate('/profile') : openAuth()}>{identity.signedIn ? <UserRound size={18}/> : <LogIn size={18}/>}</button>
        <button type="button" aria-label={uiText("Open settings")} onClick={() => navigate('/settings')}><Settings size={18}/></button>
      </div>
    </header>

    <main className="main studio-main">
      <AnimatePresence mode="wait" initial={false}><motion.div key={routePath} className="route-frame" data-route={routeKey} initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, y: -4 }} transition={{ duration: reduceMotion ? 0 : .2, ease: [0.22, 1, 0.36, 1] }}>
        {routeKey === 'dashboard' && <details className="dashboard-mobile-widgets dashboard-widgets-fold"><summary><TrophyIcon size={17}/> {fa?'لیگ و پاداش ماهانه':'Monthly league & rewards'}</summary><div className="dashboard-reward-mobile-host"><DashboardRewardCard userId={userId} calendarType={rewardCalendar} onOpenDetails={() => navigate('/settings')}/></div><GlobalLeaderboardCard board={leaderboard} variant="dashboard"/></details>}
        <Outlet/>
      </motion.div></AnimatePresence>
    </main>

    {routeKey !== 'timer' && routeKey !== 'stats' && <button className="fab" onClick={() => setQuick(true)} aria-label={fa ? 'افزودن سریع' : 'Quick add'}><Plus size={22}/></button>}
    <nav className="bottom-nav" aria-label={uiText("Main navigation")}>{mobile.map(([to, Icon, label]) => <NavLink key={to} to={to} end={to === '/'}><span className="nav-icon"><Icon size={21}/></span><small>{label}</small></NavLink>)}</nav>

    {quick && <div className="modal-backdrop" onClick={() => setQuick(false)}><div className="modal quick-modal" onClick={event => event.stopPropagation()}><div className="modal-grabber"/><div className="eyebrow">{fa ? 'دسترسی سریع' : 'Quick actions'}</div><h2>{fa ? 'بعدی چیه؟' : 'What’s next?'}</h2><p className="subtle">{fa ? 'بدون گشتن بین صفحه‌ها، سریع شروع کن.' : 'Start fast without digging through menus.'}</p><div className="quick-grid"><button className="quick-action primary" onClick={() => go('/timer')}><Clock3/><span><strong>{fa ? 'شروع مطالعه' : 'Start focus'}</strong><small>{fa ? 'تایمر را باز کن' : 'Open the timer'}</small></span></button><button className="quick-action" onClick={() => go('/planner')}><CalendarDays/><span><strong>{fa ? 'افزودن کار' : 'Add task'}</strong><small>{fa ? 'برای امروز برنامه بریز' : 'Plan your day'}</small></span></button><button className="quick-action" onClick={() => go('/subjects')}><BookOpen/><span><strong>{fa ? 'افزودن درس' : 'Add subject'}</strong><small>{fa ? 'ساختار مطالعه' : 'Organize study'}</small></span></button><button className="quick-action" onClick={() => go('/coach')}><Sparkles/><span><strong>{fa?'مربی مطالعه':'Study Coach'}</strong><small>{fa?'راهنمای رایگان و خصوصی':'Free private guidance'}</small></span></button><button className="quick-action" onClick={() => go('/studyos')}><BrainCircuit/><span><strong>{fa ? 'اتاق فرمان' : 'StudyOS'}</strong><small>{fa ? 'برنامه هوشمند امروز' : 'Smart daily plan'}</small></span></button><button className="quick-action" onClick={() => go('/progress')}><TrendingUp/><span><strong>{fa?'پیشرفت':'Progress'}</strong><small>{fa?'گزارش‌ها و چالش‌ها':'Recaps and challenges'}</small></span></button><button className="quick-action" onClick={() => go('/history')}><History/><span><strong>{fa?'سابقه':'History'}</strong><small>{fa?'جلسه‌های قبلی':'Past sessions'}</small></span></button><button className="quick-action" onClick={() => go('/search')}><Search/><span><strong>{fa?'جستجو':'Search'}</strong><small>{fa?'در همه بخش‌ها':'Across your study space'}</small></span></button></div></div></div>}
    <BackgroundSyncNotice userId={userId} enabled={identity.signedIn}/>
    <StudyCoachChatWidget/>
    <AuthGate/>
  </div>;
}

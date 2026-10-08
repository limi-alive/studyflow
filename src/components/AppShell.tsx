import { BarChart3, BookOpen, CalendarDays, Clock3, Home, Settings, UserRound, History, Plus, Search, Command, Sparkles, LogIn, LogOut, ShieldCheck } from 'lucide-react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { SyncBadge } from './SyncBadge';
import { BackgroundSyncNotice } from './BackgroundSyncNotice';
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
  const { userId } = useCurrentUser();
  const settings = useSettings(userId);
  const identity = useAuthIdentity();
  const admin = useAdminAccess();
  const leaderboard = usePublicLeaderboard();
  const navigate = useNavigate();
  const location = useLocation();
  const [quick, setQuick] = useState(false);
  const fa = settings?.language === 'fa';
  const mobile = [
    ['/', Home, fa ? 'خانه' : 'Home'], ['/timer', Clock3, fa ? 'تایمر' : 'Timer'], ['/planner', CalendarDays, fa ? 'برنامه' : 'Planner'], ['/stats', BarChart3, fa ? 'آمار' : 'Stats'], ['/profile', UserRound, fa ? 'من' : 'Me']
  ] as const;
  const desktopBase = [
    ['/', Home, fa ? 'خانه' : 'Dashboard'], ['/timer', Clock3, fa ? 'تایمر' : 'Focus'], ['/planner', CalendarDays, fa ? 'برنامه' : 'Planner'], ['/stats', BarChart3, fa ? 'آمار' : 'Analytics'], ['/subjects', BookOpen, fa ? 'درس‌ها' : 'Subjects'], ['/history', History, fa ? 'سابقه' : 'History'], ['/search', Search, fa ? 'جستجو' : 'Search']
  ] as const;
  const desktop = admin.isAdmin ? [...desktopBase, ['/admin', ShieldCheck, fa ? 'مدیریت' : 'Admin'] as const] : desktopBase;
  const routePath = resolvedRoutePath(location.pathname);
  const routeKey = routePath === '/' ? 'dashboard' : routePath.slice(1).split('/')[0] || 'dashboard';
  const routeLabel: Record<string, string> = fa ? {
    dashboard: 'خانه', timer: 'تمرکز', planner: 'برنامه', stats: 'آمار', profile: 'پروفایل', settings: 'تنظیمات', subjects: 'درس‌ها', history: 'سابقه', search: 'جستجو', admin: 'مدیریت'
  } : {
    dashboard: 'Dashboard', timer: 'Focus', planner: 'Planner', stats: 'Analytics', profile: 'Profile', settings: 'Settings', subjects: 'Subjects', history: 'History', search: 'Search', admin: 'Admin'
  };

  useEffect(() => {
    document.documentElement.dataset.theme = settings?.themeId ?? 'studio';
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

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [routePath]);

  const go = (path: string) => { setQuick(false); navigate(path); };
  const reduceMotion = Boolean(settings?.reduceMotion);
  const accountLabel = identity.username || identity.displayName || identity.email || (fa ? 'حساب کاربری' : 'Account');
  const accountSub = identity.signedIn ? (identity.email ?? (fa ? 'حساب ابری' : 'Cloud account')) : (fa ? 'ورود یا ساخت حساب' : 'Sign in or create account');
  const openAuth = () => window.dispatchEvent(new Event('studyflow:open-auth'));
  const rewardCalendar = settings?.calendarType ?? 'gregorian';

  return <div className="app-shell" data-route={routeKey} data-ui-build="13.5">
    <aside className="sidebar studio-sidebar">
      <div className="brand studio-brand"><div className="brand-mark"><Sparkles size={18}/></div><div><strong>StudyFlow</strong><small>focus system</small></div></div>
      <nav className="studio-nav">{desktop.map(([to, Icon, label]) => <NavLink key={to} to={to} end={to === '/'} title={label}><span className="nav-icon"><Icon size={19}/></span><span className="nav-label">{label}</span></NavLink>)}</nav>

      <div className="sidebar-spacer"/>
      <SidebarRewardCard userId={userId} calendarType={rewardCalendar} onOpenDetails={() => navigate('/settings')}/>
      <GlobalLeaderboardCard board={leaderboard} variant="sidebar"/>

      <div className="sidebar-tools">
        <button className="command-button studio-command" onClick={() => setQuick(true)}><Command size={17}/><span>{fa ? 'دسترسی سریع' : 'Command'}</span><kbd>⌘K</kbd></button>
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
      <button className="mobile-appbar-brand" type="button" onClick={() => navigate('/')} aria-label="Go to dashboard">
        <span className="mobile-appbar-mark"><Sparkles size={16}/></span>
        <span><strong>StudyFlow</strong><small>{routeLabel[routeKey] ?? 'Focus system'}</small></span>
      </button>
      <div className="mobile-appbar-actions">
        {routeKey !== 'timer' && <button type="button" aria-label="Quick actions" onClick={() => setQuick(true)}><Plus size={18}/></button>}
        <button type="button" aria-label={identity.signedIn ? 'Open profile' : 'Sign in'} onClick={() => identity.signedIn ? navigate('/profile') : openAuth()}>{identity.signedIn ? <UserRound size={18}/> : <LogIn size={18}/>}</button>
        <button type="button" aria-label="Open settings" onClick={() => navigate('/settings')}><Settings size={18}/></button>
      </div>
    </header>

    <main className="main studio-main">
      <AnimatePresence mode="wait" initial={false}><motion.div key={routePath} className="route-frame" data-route={routeKey} initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, y: -4 }} transition={{ duration: reduceMotion ? 0 : .2, ease: [0.22, 1, 0.36, 1] }}>
        {routeKey === 'dashboard' && <div className="dashboard-mobile-widgets"><div className="dashboard-reward-mobile-host"><DashboardRewardCard userId={userId} calendarType={rewardCalendar} onOpenDetails={() => navigate('/settings')}/></div><GlobalLeaderboardCard board={leaderboard} variant="dashboard"/></div>}
        <Outlet/>
      </motion.div></AnimatePresence>
    </main>

    {routeKey !== 'timer' && routeKey !== 'stats' && <button className="fab" onClick={() => setQuick(true)} aria-label={fa ? 'افزودن سریع' : 'Quick add'}><Plus size={22}/></button>}
    <nav className="bottom-nav" aria-label="Main navigation">{mobile.map(([to, Icon, label]) => <NavLink key={to} to={to} end={to === '/'}><span className="nav-icon"><Icon size={21}/></span><small>{label}</small></NavLink>)}</nav>

    {quick && <div className="modal-backdrop" onClick={() => setQuick(false)}><div className="modal quick-modal" onClick={event => event.stopPropagation()}><div className="modal-grabber"/><div className="eyebrow">{fa ? 'دسترسی سریع' : 'Quick actions'}</div><h2>{fa ? 'بعدی چیه؟' : 'What’s next?'}</h2><p className="subtle">{fa ? 'بدون گشتن بین صفحه‌ها، سریع شروع کن.' : 'Start fast without digging through menus.'}</p><div className="quick-grid"><button className="quick-action primary" onClick={() => go('/timer')}><Clock3/><span><strong>{fa ? 'شروع مطالعه' : 'Start focus'}</strong><small>{fa ? 'تایمر را باز کن' : 'Open the timer'}</small></span></button><button className="quick-action" onClick={() => go('/planner')}><CalendarDays/><span><strong>{fa ? 'افزودن کار' : 'Add task'}</strong><small>{fa ? 'برای امروز برنامه بریز' : 'Plan your day'}</small></span></button><button className="quick-action" onClick={() => go('/subjects')}><BookOpen/><span><strong>{fa ? 'افزودن درس' : 'Add subject'}</strong><small>{fa ? 'ساختار مطالعه' : 'Organize study'}</small></span></button><button className="quick-action" onClick={() => go('/search')}><Search/><span><strong>{fa ? 'جستجو' : 'Search'}</strong><small>{fa ? 'هرچیزی را پیدا کن' : 'Find anything'}</small></span></button></div></div></div>}
    <BackgroundSyncNotice userId={userId} enabled={identity.signedIn}/>
    <AuthGate/>
  </div>;
}

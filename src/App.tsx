import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { AppShell } from './components/AppShell';
import { HomeGate } from './components/HomeGate';

const OnboardingPage = lazy(() => import('./pages/Onboarding'));
const TimerPage = lazy(() => import('./pages/Timer'));
const PlannerPage = lazy(() => import('./pages/Planner'));
const StatsPage = lazy(() => import('./pages/Stats'));
const SubjectsPage = lazy(() => import('./pages/Subjects'));
const HistoryPage = lazy(() => import('./pages/History'));
const ProfilePage = lazy(() => import('./pages/Profile'));
const SettingsPage = lazy(() => import('./pages/Settings'));
const LoginPage = lazy(() => import('./pages/Login'));
const SearchPage = lazy(() => import('./pages/Search'));
const AdminPage = lazy(() => import('./pages/Admin'));

function RouteFallback() {
  return <div className="route-fallback" role="status" aria-live="polite">
    <span className="route-fallback-mark"><Sparkles size={20}/></span>
    <div className="route-fallback-copy"><strong>Opening StudyFlow</strong><small>Getting this view ready...</small></div>
    <span className="route-fallback-line"/>
  </div>;
}

export default function App() {
  return <Suspense fallback={<RouteFallback/>}><Routes>
    <Route path="/login" element={<LoginPage/>}/>
    <Route path="/onboarding" element={<OnboardingPage/>}/>
    <Route element={<AppShell/>}>
      <Route index element={<HomeGate/>}/>
      <Route path="timer" element={<TimerPage/>}/>
      <Route path="planner" element={<PlannerPage/>}/>
      <Route path="stats" element={<StatsPage/>}/>
      <Route path="subjects" element={<SubjectsPage/>}/>
      <Route path="history" element={<HistoryPage/>}/>
      <Route path="profile" element={<ProfilePage/>}/>
      <Route path="settings" element={<SettingsPage/>}/>
      <Route path="search" element={<SearchPage/>}/>
      <Route path="admin" element={<AdminPage/>}/>
    </Route>
  </Routes></Suspense>;
}

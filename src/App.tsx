import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
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

export default function App() {
  return <Suspense fallback={<div className="page" style={{padding:24}}>Loading…</div>}><Routes>
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
    </Route>
  </Routes></Suspense>;
}

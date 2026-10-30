import { useUiText } from '../lib/uiLanguage';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { Award, Cloud, Flame, ShieldCheck } from 'lucide-react';
import { Card } from '../components/Card';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useAdminAccess } from '../hooks/useAdminAccess';
import { db } from '../lib/db';
import { currentStreak, longestStreak, totalStudySeconds } from '../utils/stats';
import { formatDuration } from '../utils/time';
import { supabase } from '../lib/supabase';

export default function ProfilePage(){
 const uiText=useUiText();
 const {userId,email,isCloudUser}=useCurrentUser();
 const admin=useAdminAccess();
 const sessions=useLiveQuery(()=>db.sessions.where('userId').equals(userId).filter(x=>!x.deletedAt).toArray(),[userId])??[];
 const days=new Set(sessions.map(s=>new Date(s.startTime).toLocaleDateString('en-CA'))).size;
 const streak=currentStreak(sessions);
 const bestStreak=longestStreak(sessions);
 const hours=totalStudySeconds(sessions)/3600;
 const level=Math.max(1,Math.floor(hours/5)+1);
 return <div className="page"><header className="page-header"><div><div className="eyebrow">{uiText("Your space")}</div><h1>{uiText("Profile")}</h1><p className="subtle">{email??'Offline account'}</p></div><div className="pill-row"><Link className="button" to={isCloudUser?'/settings':'/login'}><Cloud size={18}/>{isCloudUser?'Cloud connected':'Sign in'}</Link>{isCloudUser&&<button className="button ghost" onClick={()=>void supabase?.auth.signOut()}>{uiText("Sign out")}</button>}</div></header>
 <div className="grid grid-3"><Card><div className="metric"><Award/><span className="subtle">{uiText("Level")}</span><strong>{level}</strong></div></Card><Card><div className="metric"><Flame/><span className="subtle">{uiText("Current streak")}</span><strong>{streak}</strong></div></Card><Card><div className="metric"><span className="subtle">{uiText("Study hours")}</span><strong>{formatDuration(totalStudySeconds(sessions))}</strong></div></Card></div>
 {admin.isAdmin&&<Card className="admin-profile-card" style={{marginTop:18} as never}><div><span className="admin-profile-icon"><ShieldCheck size={20}/></span><div><div className="eyebrow">{uiText("ADMIN ACCESS")}</div><strong>{uiText("StudyFlow Control Room")}</strong><p className="subtle">{uiText("View rankings, study totals, subject activity and recent sessions across accounts.")}</p></div></div><Link className="button primary" to="/admin">{uiText("Open Admin Center")}</Link></Card>}
 <Card style={{marginTop:18} as never}><strong>{uiText("Achievements")}</strong><p className="subtle">{uiText("Longest streak:")} {bestStreak} {uiText("days · Active days:")} {days}</p><div className="pill-row" style={{marginTop:14}}>{sessions.length>0&&<span className="pill active">{uiText("First Session")}</span>}{hours>=10&&<span className="pill active">{uiText("10 Hours")}</span>}{hours>=50&&<span className="pill active">{uiText("50 Hours")}</span>}{hours>=100&&<span className="pill active">{uiText("100 Hours")}</span>} {!sessions.length&&<span className="subtle">{uiText("Complete your first session to unlock achievements.")}</span>}</div></Card></div>;
}

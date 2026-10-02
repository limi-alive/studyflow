import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cloudEnabled, supabase } from '../lib/supabase';
import { getLocalUserId, migrateOfflineDataToUser } from '../lib/db';
import { Card } from '../components/Card';

export default function LoginPage(){
 const nav=useNavigate(); const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [message,setMessage]=useState('');
 const authenticate=async(mode:'in'|'up')=>{if(!supabase){setMessage('Supabase is not configured. Continue offline or add environment variables.');return;} const old=getLocalUserId(); const r=mode==='in'?await supabase.auth.signInWithPassword({email,password}):await supabase.auth.signUp({email,password}); if(r.error){setMessage(r.error.message);return;} if(r.data.user){await migrateOfflineDataToUser(old,r.data.user.id);nav('/');}};
 const submit=(e:FormEvent)=>{e.preventDefault();void authenticate('in');};
 return <div className="page" style={{minHeight:'100vh',display:'grid',placeItems:'center',padding:20}}><Card className="hero-card" style={{width:'min(480px,100%)'}}><div className="eyebrow">StudyFlow</div><h1>Sign in</h1><p className="subtle">Account creation is optional. The app remains usable offline.</p>{!cloudEnabled&&<p className="subtle">Cloud authentication is disabled until VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are configured.</p>}<form className="form-row" onSubmit={submit}><input className="input" type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/><input className="input" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)}/><button className="button primary">Sign in</button><button type="button" className="button" onClick={()=>void authenticate('up')}>Create account</button><Link className="button ghost" to="/">Continue offline</Link>{message&&<p className="subtle">{message}</p>}</form></Card></div>;
}

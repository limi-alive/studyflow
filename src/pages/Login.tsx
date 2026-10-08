import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cloudEnabled, supabase } from '../lib/supabase';
import { getLocalUserId, migrateOfflineDataToUser } from '../lib/db';
import { migrateAccountPreferences } from '../lib/accountPreferences';
import { syncAll } from '../lib/sync';
import { Card } from '../components/Card';

export default function LoginPage(){
 const nav=useNavigate();
 const [email,setEmail]=useState('');
 const [password,setPassword]=useState('');
 const [message,setMessage]=useState('');
 const authenticate=async(mode:'in'|'up')=>{
   if(!supabase){setMessage('Supabase is not configured. Continue offline or add environment variables.');return;}
   const old=getLocalUserId();
   const result=mode==='in'?await supabase.auth.signInWithPassword({email,password}):await supabase.auth.signUp({email,password});
   if(result.error){setMessage(result.error.message);return;}
   if(result.data.user&&result.data.session){
     await syncAll(result.data.user.id);
     await migrateOfflineDataToUser(old,result.data.user.id);
     migrateAccountPreferences(old,result.data.user.id);
     await syncAll(result.data.user.id);
     nav('/');
   } else if(mode==='up') setMessage('Account created. Confirm your email, then sign in.');
 };
 const submit=(e:FormEvent)=>{e.preventDefault();void authenticate('in');};
 return <div className="page login-page-legacy"><Card className="hero-card login-card-legacy"><div className="eyebrow">StudyFlow</div><h1>Sign in</h1><p className="subtle">Account creation is optional. The app remains usable offline.</p>{!cloudEnabled&&<p className="subtle">Cloud authentication is disabled until VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are configured.</p>}<form className="form-row" onSubmit={submit}><input className="input" type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/><input className="input" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)}/><button className="button primary">Sign in</button><button type="button" className="button" onClick={()=>void authenticate('up')}>Create account</button><Link className="button ghost" to="/">Continue offline</Link>{message&&<p className="subtle">{message}</p>}</form></Card></div>;
}

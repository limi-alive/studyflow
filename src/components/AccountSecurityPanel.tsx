import { useEffect, useState } from 'react';
import { AlertTriangle, AtSign, Check, Eye, EyeOff, KeyRound, LoaderCircle, ShieldCheck, Trash2, UserRound, X } from 'lucide-react';
import { Card } from './Card';
import { changeAccountPassword, claimUsername, loadAccountProfile, resetAllStudyData, usernameAvailable, type AccountProfile } from '../lib/accountSecurity';

type Props={userId:string};

export function AccountSecurityPanel({userId}:Props){
  const [profile,setProfile]=useState<AccountProfile|null>(null);
  const [username,setUsername]=useState('');
  const [usernameStatus,setUsernameStatus]=useState('');
  const [usernameBusy,setUsernameBusy]=useState(false);
  const [currentPassword,setCurrentPassword]=useState('');
  const [newPassword,setNewPassword]=useState('');
  const [confirmPassword,setConfirmPassword]=useState('');
  const [passwordStatus,setPasswordStatus]=useState('');
  const [showPasswords,setShowPasswords]=useState(false);
  const [resetStage,setResetStage]=useState<0|1|2>(0);
  const [resetPhrase,setResetPhrase]=useState('');
  const [resetPassword,setResetPassword]=useState('');
  const [resetBusy,setResetBusy]=useState(false);
  const [resetError,setResetError]=useState('');

  useEffect(()=>{void loadAccountProfile().then(next=>{setProfile(next);setUsername(next.username??'');});},[]);

  const checkUsername=async()=>{setUsernameBusy(true);setUsernameStatus('Checking…');const result=await usernameAvailable(username);setUsernameBusy(false);setUsernameStatus(result.ok?(result.available?'Available ✓':'Already taken'):result.error);};
  const saveUsername=async()=>{setUsernameBusy(true);const result=await claimUsername(username);setUsernameBusy(false);setUsernameStatus(result.ok?'Username saved ✓':result.error);if(result.ok)setProfile(current=>current?{...current,username:result.username}:current);};
  const updatePassword=async()=>{if(newPassword!==confirmPassword){setPasswordStatus('New passwords do not match.');return;}setPasswordStatus('Updating…');const result=await changeAccountPassword(currentPassword,newPassword);setPasswordStatus(result.ok?'Password updated securely ✓':result.error);if(result.ok){setCurrentPassword('');setNewPassword('');setConfirmPassword('');}};
  const resetAll=async()=>{setResetBusy(true);setResetError('');const result=await resetAllStudyData(userId,resetPassword);if(!result.ok){setResetBusy(false);setResetError(result.error);return;}window.location.reload();};

  return <>
    <Card className="account-security-panel">
      <div className="section-title"><div><div className="eyebrow">Account & security</div><strong className="section-heading"><ShieldCheck size={19}/> Identity and password</strong></div><span className={`cloud-account-pill ${profile?.signedIn?'online':'offline'}`}>{profile?.signedIn?'Cloud protected':'Offline profile'}</span></div>
      {!profile?.signedIn?<div className="account-offline-note"><UserRound size={18}/><div><strong>Sign in to create a globally unique username.</strong><span>StudyFlow never stores your password locally. Username uniqueness and password security use Supabase Auth.</span></div></div>:<div className="account-security-grid">
        <div className="security-section"><div className="security-heading"><AtSign size={18}/><div><strong>Unique username</strong><small>{profile.email}</small></div></div><div className="username-row"><input className="input" value={username} maxLength={24} onChange={event=>{setUsername(event.target.value.toLowerCase().replace(/[^a-z0-9_]/g,''));setUsernameStatus('');}} placeholder="your_username"/><button className="button" onClick={()=>void checkUsername()} disabled={usernameBusy}>{usernameBusy?<LoaderCircle className="spin" size={16}/>:<Eye size={16}/>} Check</button><button className="button primary" onClick={()=>void saveUsername()} disabled={usernameBusy}><Check size={16}/> Save</button></div><p className="security-status">{usernameStatus||'3–24 characters · letters, numbers and underscore · globally unique'}</p></div>
        <div className="security-section"><div className="security-heading"><KeyRound size={18}/><div><strong>Change password</strong><small>Password is handled only by Supabase Auth.</small></div></div><div className="password-stack"><div className="password-field"><input className="input" type={showPasswords?'text':'password'} value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} placeholder="Current password"/><button type="button" onClick={()=>setShowPasswords(value=>!value)} aria-label="Toggle password visibility">{showPasswords?<EyeOff size={16}/>:<Eye size={16}/>}</button></div><input className="input" type={showPasswords?'text':'password'} value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="New password (8+ characters)"/><input className="input" type={showPasswords?'text':'password'} value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="Confirm new password"/><button className="button" onClick={()=>void updatePassword()} disabled={!currentPassword||!newPassword||!confirmPassword}>Update password</button><p className="security-status">{passwordStatus}</p></div></div>
      </div>}
      <div className="danger-zone"><div><span className="danger-icon"><Trash2 size={18}/></span><div><strong>Reset all StudyFlow data</strong><small>Deletes subjects, tasks, sessions, goals, exams, settings, XP, rewards and local progress. Your login account stays active.</small></div></div><button className="button danger-outline" disabled={!profile?.signedIn} onClick={()=>setResetStage(1)}>Reset all data</button></div>
    </Card>

    {resetStage>0&&<div className="danger-modal-backdrop"><section className="danger-modal" role="dialog" aria-modal="true"><button className="danger-close" onClick={()=>setResetStage(0)}><X size={18}/></button>{resetStage===1?<><span className="danger-big-icon"><AlertTriangle/></span><div className="eyebrow">Confirmation 1 of 2</div><h2>This cannot be undone.</h2><p>All study data for this account will be permanently deleted from this device and the connected cloud database. Export a backup first if you may need it later.</p><div className="danger-modal-actions"><button className="button" onClick={()=>setResetStage(0)}>Cancel</button><button className="button danger" onClick={()=>setResetStage(2)}>I understand — continue</button></div></>:<><span className="danger-big-icon final"><KeyRound/></span><div className="eyebrow">Confirmation 2 of 2</div><h2>Verify your password.</h2><p>Type <strong>DELETE</strong> and enter your current account password. StudyFlow does not store the password.</p><input className="input delete-phrase" value={resetPhrase} onChange={e=>setResetPhrase(e.target.value)} placeholder="Type DELETE" autoComplete="off"/><input className="input" type="password" value={resetPassword} onChange={e=>setResetPassword(e.target.value)} placeholder="Current password" autoComplete="current-password"/>{resetError&&<p className="danger-error">{resetError}</p>}<div className="danger-modal-actions"><button className="button" onClick={()=>setResetStage(1)}>Back</button><button className="button danger" disabled={resetPhrase!=='DELETE'||!resetPassword||resetBusy} onClick={()=>void resetAll()}>{resetBusy?<LoaderCircle className="spin" size={16}/>:<Trash2 size={16}/>} Permanently reset</button></div></>}</section></div>}
  </>;
}

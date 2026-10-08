import { createPortal } from 'react-dom';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { AtSign, CheckCircle2, Eye, EyeOff, KeyRound, LoaderCircle, LockKeyhole, Mail, ShieldCheck, Sparkles, UserPlus, X } from 'lucide-react';
import { claimUsername, validateUsername, usernameAvailable } from '../lib/accountSecurity';
import { cloudEnabled, supabase } from '../lib/supabase';
import { useAuthIdentity } from '../hooks/useAuthIdentity';
import { getLocalUserId, migrateOfflineDataToUser } from '../lib/db';
import { migrateAccountPreferences } from '../lib/accountPreferences';
import { syncAll } from '../lib/sync';

type Mode = 'signin' | 'signup' | 'forgot' | 'new-password';
const OFFLINE_KEY = 'studyflow.auth.continueOffline';

function safeRedirectUrl() {
  const url = new URL(window.location.href);
  url.hash = '';
  url.search = '';
  return url.toString();
}

function authErrorMessage(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes('invalid login')) return 'Email or password is incorrect.';
  if (lower.includes('already registered')) return 'An account with this email already exists.';
  if (lower.includes('database error')) return 'Account setup is not installed yet. Run migration 004 in Supabase.';
  return message;
}

export function AuthGate() {
  const dialogRef = useRef<HTMLDivElement>(null);
  const identity = useAuthIdentity();
  const [mode, setMode] = useState<Mode>('signin');
  const [manualOpen, setManualOpen] = useState(false);
  const [offlineAllowed, setOfflineAllowed] = useState(() => localStorage.getItem(OFFLINE_KEY) === '1');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [success, setSuccess] = useState('');
  const [usernameState, setUsernameState] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

  const shouldOpen = manualOpen || (!identity.loading && !identity.signedIn && !offlineAllowed);
  const canUseCloud = cloudEnabled && Boolean(supabase);
  const normalizedUsername = useMemo(() => validateUsername(username), [username]);

  useEffect(() => {
    const open = () => {
      setManualOpen(true);
      setStatus('');
      setSuccess('');
      setMode('signin');
    };
    window.addEventListener('studyflow:open-auth', open);
    return () => window.removeEventListener('studyflow:open-auth', open);
  }, [identity.signedIn]);

  useEffect(() => {
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMode('new-password');
        setManualOpen(true);
        setOfflineAllowed(false);
        localStorage.removeItem(OFFLINE_KEY);
      }
      if (event === 'SIGNED_IN') {
        setOfflineAllowed(false);
        localStorage.removeItem(OFFLINE_KEY);
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (identity.signedIn && mode !== 'new-password') {
      setManualOpen(false);
      setPassword('');
      setConfirmPassword('');
      setStatus('');
    }
  }, [identity.signedIn, mode]);

  // Keep the account sheet outside transformed route containers. Its own
  // scroll area follows the visual viewport when a mobile keyboard opens.
  useEffect(() => {
    if (!shouldOpen) return;
    const previousOverflow = document.body.style.overflow;
    const returnFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    const viewport = window.visualViewport;
    const updateViewport = () => {
      const node = dialogRef.current;
      if (!node) return;
      node.style.setProperty('--sf-auth-height', `${viewport?.height ?? window.innerHeight}px`);
      node.style.setProperty('--sf-auth-top', `${viewport?.offsetTop ?? 0}px`);
    };
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && manualOpen && mode !== 'new-password') {
        setManualOpen(false);
        return;
      }
      if (event.key !== 'Tab') return;
      const nodes = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not(:disabled), input:not(:disabled), select:not(:disabled), a[href], [tabindex="0"]'
      ) ?? []).filter(node => node.getClientRects().length > 0);
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    };
    updateViewport();
    dialogRef.current?.focus({ preventScroll: true });
    viewport?.addEventListener('resize', updateViewport);
    viewport?.addEventListener('scroll', updateViewport);
    window.addEventListener('resize', updateViewport);
    document.addEventListener('keydown', trapFocus);
    return () => {
      document.body.style.overflow = previousOverflow;
      viewport?.removeEventListener('resize', updateViewport);
      viewport?.removeEventListener('scroll', updateViewport);
      window.removeEventListener('resize', updateViewport);
      document.removeEventListener('keydown', trapFocus);
      if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
    };
  }, [shouldOpen, manualOpen, mode]);

  const continueOffline = () => {
    localStorage.setItem(OFFLINE_KEY, '1');
    setOfflineAllowed(true);
    setManualOpen(false);
  };

  const checkUsername = async () => {
    setStatus('');
    setSuccess('');
    if (!normalizedUsername.ok) {
      setUsernameState('taken');
      setStatus(normalizedUsername.error);
      return false;
    }
    setUsernameState('checking');
    const result = await usernameAvailable(normalizedUsername.username);
    if (!result.ok) {
      setUsernameState('taken');
      setStatus(result.error);
      return false;
    }
    setUsernameState(result.available ? 'available' : 'taken');
    if (!result.available) setStatus('That username is already taken.');
    return result.available;
  };

  const signIn = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    const offlineUserId = getLocalUserId();
    setBusy(true); setStatus(''); setSuccess('');
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) { setBusy(false); setStatus(authErrorMessage(error.message)); return; }
    if (data.user) {
      // Pull the account first, then merge any true offline work from this device.
      // This order prevents a fresh phone's defaults from overwriting established cloud settings.
      await syncAll(data.user.id);
      await migrateOfflineDataToUser(offlineUserId, data.user.id);
      migrateAccountPreferences(offlineUserId, data.user.id);
      await syncAll(data.user.id);
    }
    setBusy(false);
    localStorage.removeItem(OFFLINE_KEY);
    setOfflineAllowed(false);
    setSuccess('Signed in. Your latest StudyFlow data is syncing to this device…');
  };

  const signUp = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    if (password.length < 8) { setStatus('Use a password with at least 8 characters.'); return; }
    if (password !== confirmPassword) { setStatus('Passwords do not match.'); return; }
    const available = usernameState === 'available' ? true : await checkUsername();
    if (!available || !normalizedUsername.ok) return;

    const offlineUserId = getLocalUserId();
    setBusy(true); setStatus(''); setSuccess('');
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { username: normalizedUsername.username, display_name: normalizedUsername.username } }
    });
    if (error) {
      setBusy(false);
      setStatus(authErrorMessage(error.message));
      return;
    }

    const signedUpUserId = data.session?.user.id ?? data.user?.id ?? null;

    if (data.session && signedUpUserId) {
      const claimed = await claimUsername(normalizedUsername.username);
      if (!claimed.ok) {
        setBusy(false);
        setStatus(claimed.error);
        return;
      }
      // Pull the account first, then merge any true offline work from this device.
      // This order prevents a fresh phone's defaults from overwriting established cloud settings.
      await syncAll(signedUpUserId);
      await migrateOfflineDataToUser(offlineUserId, signedUpUserId);
      migrateAccountPreferences(offlineUserId, signedUpUserId);
      await syncAll(signedUpUserId);
      window.dispatchEvent(new Event('studyflow:profile-updated'));
      localStorage.removeItem(OFFLINE_KEY);
      setOfflineAllowed(false);
      setSuccess('Account created. Your username is reserved and your data space is private.');
    } else {
      setSuccess('Account created. Check your email to confirm it, then sign in. Your username is reserved.');
    }
    setBusy(false);
  };

  const requestReset = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    if (!email.trim()) { setStatus('Enter your account email first.'); return; }
    setBusy(true); setStatus(''); setSuccess('');
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: safeRedirectUrl() });
    setBusy(false);
    if (error) { setStatus(authErrorMessage(error.message)); return; }
    setSuccess('Password reset link sent. Open the email on this device and return to StudyFlow.');
  };

  const updateRecoveredPassword = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    if (password.length < 8) { setStatus('Use a password with at least 8 characters.'); return; }
    if (password !== confirmPassword) { setStatus('Passwords do not match.'); return; }
    setBusy(true); setStatus(''); setSuccess('');
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { setStatus(authErrorMessage(error.message)); return; }
    setSuccess('Password updated. You are signed in.');
    window.setTimeout(() => { setManualOpen(false); setMode('signin'); }, 900);
  };

  if (!shouldOpen) return null;

  return createPortal(<div ref={dialogRef} tabIndex={-1} className="auth-gate-backdrop" role="dialog" aria-modal="true" aria-label="StudyFlow account">
    <div className="auth-gate-shell">
      <section className="auth-gate-brand-panel">
        <div className="auth-gate-orb auth-gate-orb-one" aria-hidden="true"/>
        <div className="auth-gate-orb auth-gate-orb-two" aria-hidden="true"/>
        <span className="auth-gate-brand"><span><Sparkles size={18}/></span> StudyFlow</span>
        <div className="auth-gate-brand-copy">
          <span className="auth-gate-kicker">YOUR PRIVATE STUDY SPACE</span>
          <h1>One account.<br/>Your progress only.</h1>
          <p>Sessions, subjects, rewards and settings stay separated by your account ID. You can still use StudyFlow offline.</p>
        </div>
        <div className="auth-gate-proof">
          <span><ShieldCheck size={17}/><b>Private data</b><small>RLS isolates each account</small></span>
          <span><AtSign size={17}/><b>Unique username</b><small>No duplicates</small></span>
          <span><KeyRound size={17}/><b>Secure password</b><small>Handled by Supabase Auth</small></span>
        </div>
      </section>

      <section className="auth-gate-form-panel">
        {manualOpen && <button className="auth-gate-close" type="button" onClick={() => setManualOpen(false)} aria-label="Close"><X size={18}/></button>}
        {!canUseCloud && <div className="auth-cloud-warning"><LockKeyhole size={18}/><div><strong>Cloud account is not configured yet.</strong><span>Add the Supabase URL and anon key, then reload. Offline mode still works.</span></div></div>}

        {mode === 'signin' && <>
          <div className="auth-form-heading"><span className="auth-form-icon"><LockKeyhole size={19}/></span><div><small>WELCOME BACK</small><h2>Sign in</h2></div></div>
          <form className="auth-form" onSubmit={signIn}>
            <label><span>Email</span><div className="auth-input-wrap"><Mail size={16}/><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required/></div></label>
            <label><span>Password</span><div className="auth-input-wrap"><KeyRound size={16}/><input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" autoComplete="current-password" required/><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(value => !value)}>{showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}</button></div></label>
            <button className="auth-primary-button" disabled={busy || !canUseCloud}>{busy ? <LoaderCircle className="spin" size={17}/> : <LockKeyhole size={17}/>} Sign in</button>
          </form>
          <button className="auth-text-button" type="button" onClick={() => { setMode('forgot'); setStatus(''); setSuccess(''); }}>Forgot password?</button>
          <div className="auth-divider"><span>or</span></div>
          <button className="auth-secondary-button" type="button" onClick={() => { setMode('signup'); setStatus(''); setSuccess(''); setPassword(''); }}> <UserPlus size={17}/> Create a new account</button>
        </>}

        {mode === 'signup' && <>
          <div className="auth-form-heading"><span className="auth-form-icon"><UserPlus size={19}/></span><div><small>NEW STUDYFLOW ID</small><h2>Create account</h2></div></div>
          <form className="auth-form" onSubmit={signUp}>
            <label><span>Username</span><div className={`auth-input-wrap username ${usernameState}`}><AtSign size={16}/><input value={username} onChange={e => { setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')); setUsernameState('idle'); }} maxLength={24} placeholder="your_username" autoComplete="username" required/><button type="button" className="username-check-button" onClick={() => void checkUsername()}>{usernameState === 'checking' ? <LoaderCircle className="spin" size={15}/> : usernameState === 'available' ? <CheckCircle2 size={15}/> : 'Check'}</button></div><small className="auth-field-note">3–24 characters · letters, numbers and underscore</small></label>
            <label><span>Email</span><div className="auth-input-wrap"><Mail size={16}/><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required/></div></label>
            <label><span>Password</span><div className="auth-input-wrap"><KeyRound size={16}/><input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="8+ characters" autoComplete="new-password" required/><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(value => !value)}>{showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}</button></div></label>
            <label><span>Confirm password</span><div className="auth-input-wrap"><ShieldCheck size={16}/><input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat password" autoComplete="new-password" required/></div></label>
            <button className="auth-primary-button" disabled={busy || !canUseCloud}>{busy ? <LoaderCircle className="spin" size={17}/> : <UserPlus size={17}/>} Create private account</button>
          </form>
          <button className="auth-text-button" type="button" onClick={() => { setMode('signin'); setStatus(''); setSuccess(''); }}>Already have an account? Sign in</button>
        </>}

        {mode === 'forgot' && <>
          <div className="auth-form-heading"><span className="auth-form-icon"><Mail size={19}/></span><div><small>RECOVER ACCESS</small><h2>Reset password</h2></div></div>
          <p className="auth-form-copy">Enter the email used for this account. Supabase will send a secure recovery link.</p>
          <form className="auth-form" onSubmit={requestReset}>
            <label><span>Email</span><div className="auth-input-wrap"><Mail size={16}/><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required/></div></label>
            <button className="auth-primary-button" disabled={busy || !canUseCloud}>{busy ? <LoaderCircle className="spin" size={17}/> : <Mail size={17}/>} Send recovery link</button>
          </form>
          <button className="auth-text-button" type="button" onClick={() => { setMode('signin'); setStatus(''); setSuccess(''); }}>Back to sign in</button>
        </>}

        {mode === 'new-password' && <>
          <div className="auth-form-heading"><span className="auth-form-icon"><KeyRound size={19}/></span><div><small>SECURE RECOVERY</small><h2>Choose a new password</h2></div></div>
          <form className="auth-form" onSubmit={updateRecoveredPassword}>
            <label><span>New password</span><div className="auth-input-wrap"><KeyRound size={16}/><input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="8+ characters" autoComplete="new-password" required/></div></label>
            <label><span>Confirm password</span><div className="auth-input-wrap"><ShieldCheck size={16}/><input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat password" autoComplete="new-password" required/></div></label>
            <button className="auth-primary-button" disabled={busy}>{busy ? <LoaderCircle className="spin" size={17}/> : <CheckCircle2 size={17}/>} Save new password</button>
          </form>
        </>}

        {status && <div className="auth-message error">{status}</div>}
        {success && <div className="auth-message success"><CheckCircle2 size={16}/>{success}</div>}

        {mode !== 'new-password' && <button className="auth-offline-button" type="button" onClick={continueOffline}>Continue offline <span>Local data stays on this device</span></button>}
      </section>
    </div>
  </div>, document.body);
}

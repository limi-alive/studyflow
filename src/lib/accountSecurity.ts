import { db } from './db';
import { cloudEnabled, supabase } from './supabase';

export type AccountProfile = { username: string | null; displayName: string | null; email: string | null; signedIn: boolean };

function cleanUsername(value:string){return value.trim().toLowerCase().replace(/[^a-z0-9_]/g,'');}

export function validateUsername(value:string){
  const username=cleanUsername(value);
  if(username.length<3)return {ok:false as const,username,error:'Use at least 3 characters.'};
  if(username.length>24)return {ok:false as const,username,error:'Use at most 24 characters.'};
  if(!/^[a-z0-9_]+$/.test(username))return {ok:false as const,username,error:'Only letters, numbers and underscore are allowed.'};
  return {ok:true as const,username};
}

export async function loadAccountProfile():Promise<AccountProfile>{
  if(!cloudEnabled||!supabase)return {username:null,displayName:null,email:null,signedIn:false};
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return {username:null,displayName:null,email:null,signedIn:false};
  const {data}=await supabase.from('profiles').select('username,display_name').eq('id',user.id).maybeSingle();
  return {username:(data?.username as string|undefined)??null,displayName:(data?.display_name as string|undefined)??null,email:user.email??null,signedIn:true};
}

export async function usernameAvailable(raw:string){
  const valid=validateUsername(raw);if(!valid.ok)return {ok:false as const,available:false,error:valid.error};
  if(!cloudEnabled||!supabase)return {ok:false as const,available:false,error:'Cloud account is not enabled.'};
  const {data,error}=await supabase.rpc('is_username_available',{candidate:valid.username});
  if(error)return {ok:false as const,available:false,error:'Account migration is not installed yet.'};
  return {ok:true as const,available:Boolean(data),username:valid.username};
}

export async function claimUsername(raw:string,displayName?:string){
  const valid=validateUsername(raw);if(!valid.ok)return {ok:false as const,error:valid.error};
  if(!cloudEnabled||!supabase)return {ok:false as const,error:'Sign in to a cloud account first.'};
  const {data,error}=await supabase.rpc('claim_username',{candidate:valid.username,display_name_input:displayName?.trim()||null});
  if(error)return {ok:false as const,error:error.message.includes('function')?'Run the new Supabase account migration first.':error.message};
  if(!data)return {ok:false as const,error:'That username is already taken.'};
  window.dispatchEvent(new Event('studyflow:profile-updated'));
  return {ok:true as const,username:valid.username};
}

export async function reauthenticate(password:string){
  if(!cloudEnabled||!supabase)return {ok:false as const,error:'Cloud account is not enabled.'};
  const {data:{user}}=await supabase.auth.getUser();
  if(!user?.email)return {ok:false as const,error:'No signed-in email account was found.'};
  const {error}=await supabase.auth.signInWithPassword({email:user.email,password});
  return error?{ok:false as const,error:'Password is incorrect.'}:{ok:true as const,user};
}

export async function changeAccountPassword(currentPassword:string,newPassword:string){
  if(newPassword.length<8)return {ok:false as const,error:'New password must be at least 8 characters.'};
  const auth=await reauthenticate(currentPassword);if(!auth.ok)return auth;
  if(!supabase)return {ok:false as const,error:'Cloud account is not enabled.'};
  const {error}=await supabase.auth.updateUser({password:newPassword});
  return error?{ok:false as const,error:error.message}:{ok:true as const};
}

async function wipeLocalUser(userId:string){
  await db.transaction('rw',[db.subjects,db.topics,db.tasks,db.sessions,db.goals,db.exams,db.settings],async()=>{
    await db.subjects.where('userId').equals(userId).delete();
    await db.topics.where('userId').equals(userId).delete();
    await db.tasks.where('userId').equals(userId).delete();
    await db.sessions.where('userId').equals(userId).delete();
    await db.goals.where('userId').equals(userId).delete();
    await db.exams.where('userId').equals(userId).delete();
    await db.settings.delete(userId);
  });
  const removals:string[]=[];
  for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key&&key.startsWith('studyflow.')&&(key.includes(userId)||key==='studyflow.timer'||key==='studyflow.activeTimer'||key==='studyflow.lastSafetyBackup'))removals.push(key);}
  removals.forEach(key=>localStorage.removeItem(key));
}

async function fallbackCloudWipe(userId:string){
  if(!supabase)return;
  const tables=['distractions','user_achievements','study_sessions','tasks','topics','goals','exams','subjects','user_settings','user_preferences'];
  for(const table of tables){try{await supabase.from(table).delete().eq('user_id',userId);}catch{/* optional table */}}
}

export async function resetAllStudyData(userId:string,password:string){
  const auth=await reauthenticate(password);if(!auth.ok)return auth;
  if(!supabase)return {ok:false as const,error:'Cloud account is not enabled.'};
  const {error}=await supabase.rpc('wipe_my_study_data');
  if(error)await fallbackCloudWipe(userId);
  await wipeLocalUser(userId);
  return {ok:true as const};
}

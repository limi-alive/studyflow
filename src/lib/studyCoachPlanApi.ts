import { supabase } from './supabase';
import { parseCoachPlan, type CoachPlanItem } from './studyCoachPlan';

/** Call a separate authenticated extraction endpoint, never let the browser trust AI text as DB operations. */
export async function requestCoachPlan(params: {
  endpoint: string;
  userPrompt: string;
  assistantReply: string;
  language: 'fa' | 'en';
  today: string;
  signal?: AbortSignal;
}): Promise<CoachPlanItem[]> {
  if (!supabase) throw new Error('login_required');
  const {data} = await supabase.auth.getSession();
  if (!data.session?.access_token) throw new Error('login_required');
  const url = new URL(params.endpoint);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost','127.0.0.1'].includes(url.hostname))) throw new Error('config_error');
  if (!url.pathname.endsWith('/coach')) throw new Error('config_error');
  url.pathname = url.pathname.slice(0,-'/coach'.length) + '/plan';
  const response = await fetch(url.toString(), {
    method:'POST',
    headers:{'Content-Type':'application/json',Authorization:`Bearer ${data.session.access_token}`},
    body:JSON.stringify({userPrompt:params.userPrompt.slice(0,1600),assistantReply:params.assistantReply.slice(0,4500),language:params.language,today:params.today}),
    signal:params.signal
  });
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) throw new Error('login_required');
    if (response.status === 422) throw new Error('no_plan');
    if (response.status === 429 || response.status >= 500) throw new Error('provider_unavailable');
    throw new Error('network_error');
  }
  return parseCoachPlan(await response.json());
}

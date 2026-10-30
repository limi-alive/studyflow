/** Transport and privacy boundary for the optional generative StudyFlow coach. */
import { supabase } from './supabase';

export type CoachChatMessage = { role: 'user' | 'assistant'; content: string };
export type CoachChatResult = { reply: string };
const MAX_HISTORY = 12;
const MAX_MESSAGE_CHARS = 1600;
const MAX_CONTEXT_CHARS = 700;

export function prepareCoachMessages(messages: CoachChatMessage[]): CoachChatMessage[] {
  return messages.slice(-MAX_HISTORY).filter(message =>
    (message.role === 'user' || message.role === 'assistant') &&
    typeof message.content === 'string' && message.content.trim().length > 0
  ).map(message => ({ role: message.role, content: message.content.slice(0, MAX_MESSAGE_CHARS) }));
}

function validHttpsEndpoint(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost','127.0.0.1'].includes(url.hostname))) return null;
    if (url.username || url.password || url.search || url.hash) return null;
    return url.toString();
  } catch { return null; }
}

let endpointPromise: Promise<string | null> | null = null;
export function getStudyCoachEndpoint(): Promise<string | null> {
  if (!endpointPromise) endpointPromise = (async () => {
    const envUrl = validHttpsEndpoint(import.meta.env.VITE_STUDYFLOW_AI_URL);
    if (envUrl) return envUrl;
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}studyflow-ai-config.json`, {cache: 'no-store'});
      if (!response.ok) return null;
      const config = await response.json() as {endpoint?: unknown};
      return validHttpsEndpoint(config.endpoint);
    } catch { return null; }
  })();
  return endpointPromise;
}

/** Browser passes a Supabase user session; Worker independently validates it. */
export async function requestStudyCoachReply(params: {
  endpoint: string;
  messages: CoachChatMessage[];
  language: 'fa' | 'en';
  numericContext?: string;
  signal?: AbortSignal;
}): Promise<CoachChatResult> {
  if (!supabase) throw new Error('login_required');
  const session = await supabase.auth.getSession();
  const accessToken = session.data.session?.access_token;
  if (!accessToken) throw new Error('login_required');
  const endpoint = validHttpsEndpoint(params.endpoint);
  if (!endpoint) throw new Error('config_error');
  const messages = prepareCoachMessages(params.messages);
  if (!messages.length || messages[messages.length - 1].role !== 'user') throw new Error('invalid_message');
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}`},
    body: JSON.stringify({messages, language: params.language, numericContext: params.numericContext?.slice(0, MAX_CONTEXT_CHARS) ?? ''}),
    signal: params.signal
  });
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) throw new Error('login_required');
    if (response.status === 429 || response.status === 503) throw new Error('provider_unavailable');
    throw new Error('network_error');
  }
  const data = await response.json() as {reply?: unknown};
  if (typeof data.reply !== 'string' || !data.reply.trim()) throw new Error('invalid_response');
  return {reply: data.reply.slice(0, 4500)};
}

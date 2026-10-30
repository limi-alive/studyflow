/** Determine each cloud coach reply language without coupling it to navigation locale.
 * Explicit language instructions persist only within the current in-memory chat.
 * No user content or language preference is stored or transmitted separately.
 */
export type CoachReplyLanguage = 'fa' | 'en';
export type CoachLanguageHistory = ReadonlyArray<{role: 'user' | 'assistant'; content: string}>;

const persianScript = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/u;
const latinScript = /[a-z]/i;

/** Only imperative language requests override the language of a message. */
function explicitPreference(text: string): CoachReplyLanguage | null {
  const normalized = text.toLowerCase().replace(/\s+/g, ' ').trim();
  const englishRequest = /(?:به\s+(?:زبان\s+)?انگلیسی|انگلیسی\s+(?:حرف\s+بزن|جواب\s+بده|پاسخ\s+بده|بنویس)|(?:speak|write|reply|respond|answer)\s+(?:only\s+)?(?:in\s+)?english|english\s+only)/iu;
  const persianRequest = /(?:به\s+(?:زبان\s+)?فارسی|فارسی\s+(?:حرف\s+بزن|جواب\s+بده|پاسخ\s+بده|بنویس)|(?:speak|write|reply|respond|answer)\s+(?:only\s+)?(?:in\s+)?(?:persian|farsi)|(?:persian|farsi)\s+only)/iu;
  if (englishRequest.test(normalized)) return 'en';
  if (persianRequest.test(normalized)) return 'fa';
  return null;
}

export function selectCoachReplyLanguage(
  question: string,
  previousMessages: CoachLanguageHistory,
  interfaceLanguage: CoachReplyLanguage
): CoachReplyLanguage {
  const preference = explicitPreference(question);
  if (preference) return preference;

  // Last explicit user preference persists until another explicit instruction.
  for (let i = previousMessages.length - 1; i >= 0; i--) {
    const prior = previousMessages[i];
    if (prior.role !== 'user') continue;
    const saved = explicitPreference(prior.content);
    if (saved) return saved;
  }

  if (persianScript.test(question)) return 'fa';
  if (latinScript.test(question)) return 'en';

  // Emoji- or number-only message: keep the language of the last user message.
  for (let i = previousMessages.length - 1; i >= 0; i--) {
    const prior = previousMessages[i];
    if (prior.role !== 'user') continue;
    if (persianScript.test(prior.content)) return 'fa';
    if (latinScript.test(prior.content)) return 'en';
  }
  return interfaceLanguage;
}

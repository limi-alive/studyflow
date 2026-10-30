/** Safe client-side challenge links: never include user IDs or study records. */
export const CHALLENGE_GOALS = [25, 45, 60] as const;
export type ChallengeGoal = typeof CHALLENGE_GOALS[number];
export function isChallengeGoal(value: number): value is ChallengeGoal {
  return CHALLENGE_GOALS.includes(value as ChallengeGoal);
}
export function goalFromInvite(queryString: string): ChallengeGoal | null {
  const raw = new URLSearchParams(queryString).get('challenge');
  if(!raw || !/^\d{1,2}$/.test(raw))return null;
  const n=Number(raw);
  return isChallengeGoal(n)?n:null;
}
export function challengeInviteUrl(goal: ChallengeGoal) {
  return `https://limi-alive.github.io/studyflow/?challenge=${goal}#/`;
}

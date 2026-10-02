import type { FocusCompanionId } from '../hooks/useCompanionPreferences';

export type CompanionMeta = {
  id: FocusCompanionId;
  name: string;
  subtitle: string;
  emoji: string;
};

export const companionMeta: CompanionMeta[] = [
  { id:'bunni', name:'Bunni', subtitle:'Soft desk buddy', emoji:'🐰' },
  { id:'mochi', name:'Mochi', subtitle:'Cozy study cat', emoji:'🐱' },
  { id:'moss', name:'Moss', subtitle:'Tiny study frog', emoji:'🐸' },
  { id:'orbit', name:'Orbit', subtitle:'Floating space pal', emoji:'🪐' }
];

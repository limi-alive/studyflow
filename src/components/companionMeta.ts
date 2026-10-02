import type { FocusCompanionId } from '../hooks/useCompanionPreferences';

export type CompanionMeta = {
  id: FocusCompanionId;
  name: string;
  subtitle: string;
  vibe: string;
  emoji: string;
  accent: string;
};

export const companionMeta: CompanionMeta[] = [
  { id:'kuromi', name:'Kuromi', subtitle:'Mischievous study mode', vibe:'page turns · ear flicks · eye tracking · sparkle bursts · cheeky celebration', emoji:'🖤', accent:'#e38bc8' },
  { id:'buttercup', name:'Buttercup', subtitle:'Power focus mode', vibe:'hover physics · energy rings · eye tracking · charge trails · victory burst', emoji:'💚', accent:'#5ed34b' },
  { id:'tom-jerry', name:'Tom & Jerry', subtitle:'Cat-and-mouse study chaos', vibe:'desk chase · pencil taps · reactive eyes · cheese bounce · comic finish', emoji:'🐭', accent:'#e5a35f' }
];

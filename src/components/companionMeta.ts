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
  { id:'kuromi', name:'Kuromi', subtitle:'Mischievous study mode', vibe:'ear bounce · page taps · cheeky celebration', emoji:'🖤', accent:'#e38bc8' },
  { id:'buttercup', name:'Buttercup', subtitle:'Power focus mode', vibe:'hover · energy charge · victory burst', emoji:'💚', accent:'#5ed34b' },
  { id:'tom-jerry', name:'Tom & Jerry', subtitle:'Cat-and-mouse study chaos', vibe:'desk chase · reactive faces · comic finish', emoji:'🐭', accent:'#e5a35f' }
];

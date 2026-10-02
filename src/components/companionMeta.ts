import type { FocusCompanionId } from '../hooks/useCompanionPreferences';

export type CompanionMeta = {
  id: FocusCompanionId;
  name: string;
  subtitle: string;
  vibe: string;
  emoji: string;
  runtimeUrl: string;
  author: string;
  sourceUrl: string;
  license: 'CC BY';
  accent: string;
};

export const companionMeta: CompanionMeta[] = [
  {
    id:'chrome',
    name:'Chrome',
    subtitle:'Interactive chrome robot',
    vibe:'Reactive expressions · cursor-aware',
    emoji:'🤖',
    runtimeUrl:'https://public.rive.app/community/runtime-files/18720-35184-robot-expressions.riv',
    author:'deborah.n.oliveira',
    sourceUrl:'https://rive.app/community/files/18720-35184-robot-expressions/',
    license:'CC BY',
    accent:'#aab4ff'
  },
  {
    id:'volt',
    name:'Volt',
    subtitle:'Levitating power hero',
    vibe:'Fast, green-energy superhero mood',
    emoji:'⚡',
    runtimeUrl:'https://public.rive.app/community/runtime-files/4125-8521-glowing-girl-levitation.riv',
    author:'gouthamravisankar',
    sourceUrl:'https://rive.app/community/files/4125-8521-glowing-girl-levitation/',
    license:'CC BY',
    accent:'#62e58b'
  },
  {
    id:'mischief',
    name:'Mischief',
    subtitle:'Interactive cat chase',
    vibe:'Classic cat-and-mouse energy · pointer-reactive',
    emoji:'🐈',
    runtimeUrl:'https://public.rive.app/community/runtime-files/3920-8202-cat-following-the-mouse.riv',
    author:'pedroalpera',
    sourceUrl:'https://rive.app/community/files/3920-8202-cat-following-the-mouse/',
    license:'CC BY',
    accent:'#f3a55f'
  }
];

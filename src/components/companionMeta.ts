import type { FocusCompanionId } from '../hooks/useCompanionPreferences';

export type CompanionMeta = {
  id: FocusCompanionId;
  name: string;
  subtitle: string;
  emoji: string;
  runtimeUrl: string;
  stateMachine: string;
  artboard?: string;
  author: string;
  sourceUrl: string;
  license: 'CC BY';
};

export const companionMeta: CompanionMeta[] = [
  {
    id:'dash',
    name:'Dash',
    subtitle:'Playful focus bird',
    emoji:'🐦',
    runtimeUrl:'https://public.rive.app/community/runtime-files/2063-4080-flutter-puzzle-hack-project.riv',
    stateMachine:'birb',
    author:'drawsgood',
    sourceUrl:'https://rive.app/community/files/2063-4080-flutter-puzzle-hack-project/',
    license:'CC BY'
  },
  {
    id:'teddy',
    name:'Teddy',
    subtitle:'Expressive study bear',
    emoji:'🧸',
    runtimeUrl:'https://public.rive.app/community/runtime-files/2244-4463-animated-login-screen.riv',
    stateMachine:'Login Machine',
    author:'JcToon',
    sourceUrl:'https://rive.app/marketplace/2244-4463-animated-login-screen/',
    license:'CC BY'
  },
  {
    id:'avatar',
    name:'Avatar',
    subtitle:'Reactive character',
    emoji:'🙂',
    runtimeUrl:'https://public.rive.app/community/runtime-files/2195-4346-avatar-pack-use-case.riv',
    stateMachine:'avatar',
    artboard:'Avatar 1',
    author:'drawsgood',
    sourceUrl:'https://rive.app/community/files/2195-4346-avatar-pack-use-case/',
    license:'CC BY'
  },
  {
    id:'star',
    name:'Star',
    subtitle:'Interactive star face',
    emoji:'⭐',
    runtimeUrl:'https://public.rive.app/community/runtime-files/9330-17748-star-face.riv',
    stateMachine:'State Machine',
    author:'augustin.hiebel',
    sourceUrl:'https://rive.app/community/files/9330-17748-star-face/',
    license:'CC BY'
  }
];

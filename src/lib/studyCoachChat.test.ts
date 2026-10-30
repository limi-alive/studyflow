import { describe, expect, it } from 'vitest';
import { prepareCoachMessages } from './studyCoachChat';

describe('StudyCoach chat privacy/input boundaries', () => {
  it('keeps a bounded recent conversation', () => {
    const history = Array.from({length: 16}, (_, i) => ({role: i%2 ? 'assistant' as const : 'user' as const, content: `${i}`}));
    const prepared = prepareCoachMessages(history);
    expect(prepared).toHaveLength(12);
    expect(prepared[0].content).toBe('4');
  });
  it('rejects blank messages and truncates large text', () => {
    expect(prepareCoachMessages([{role:'user',content:' '},{role:'user',content:'x'.repeat(2000)}])).toEqual([{role:'user',content:'x'.repeat(1600)}]);
  });
});

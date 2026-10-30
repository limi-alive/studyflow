import { describe, expect, it } from 'vitest';
import { selectCoachReplyLanguage } from './studyCoachLanguage';

describe('AI chat reply language independent of app navigation locale', () => {
  it('answers Persian user messages in Persian even in English UI', () => {
    expect(selectCoachReplyLanguage('سلام، برنامه مطالعه می‌خوام', [], 'en')).toBe('fa');
  });
  it('answers English messages in English even in Persian UI', () => {
    expect(selectCoachReplyLanguage('How can I review for tomorrow?', [], 'fa')).toBe('en');
  });
  it('follows an explicit Persian request for subsequent turns', () => {
    const history = [{ role: 'user' as const, content: 'فارسی حرف بزن' }, { role: 'assistant' as const, content: 'حتماً' }];
    expect(selectCoachReplyLanguage('Can you make me a plan?', history, 'en')).toBe('fa');
  });
  it('allows switching back to English explicitly', () => {
    const history = [{ role: 'user' as const, content: 'فارسی حرف بزن' }, { role: 'user' as const, content: 'Please answer in English' }];
    expect(selectCoachReplyLanguage('یک برنامه برای فردا', history, 'fa')).toBe('en');
  });
  it('prefers explicit instructions on the current turn', () => {
    expect(selectCoachReplyLanguage('به انگلیسی جواب بده', [{ role: 'user', content: 'فارسی حرف بزن' }], 'fa')).toBe('en');
    expect(selectCoachReplyLanguage('Please respond in Farsi', [], 'en')).toBe('fa');
  });
  it('keeps the prior language for emoji and numeric follow ups', () => {
    expect(selectCoachReplyLanguage('👌', [{ role: 'user', content: 'سلام' }], 'en')).toBe('fa');
    expect(selectCoachReplyLanguage('5', [], 'en')).toBe('en');
  });
  it('does not misread studying English as a request to answer in English', () => {
    expect(selectCoachReplyLanguage('چطور زبان انگلیسی بخونم؟', [], 'en')).toBe('fa');
  });
});

import { afterEach, describe, expect, it } from 'vitest';
import { getUiLanguage, setUiLanguage, translateUi, englishToPersian, persianToEnglish } from './uiLanguage';
import { formatAppDate } from './locale';

afterEach(() => setUiLanguage('fa'));
describe('StudyFlow complete UI-language switch', () => {
  it('translates actual page labels in both directions', () => {
    expect(translateUi('Settings','fa')).toBe('تنظیمات');
    expect(translateUi('اتاق فرمان مطالعه','en')).toBe('Study command center');
    expect(translateUi('No study sessions yet.','fa')).not.toContain('sessions');
  });
  it('leaves user-entered subject labels unchanged when not in the UI dictionary', () => {
    const personalTitle='Quantum membranes — my notes';
    expect(translateUi(personalTitle,'fa')).toBe(personalTitle);
    expect(translateUi(personalTitle,'en')).toBe(personalTitle);
  });
  it('switches the locale without changing stored dates', () => {
    const date=new Date(2026,9,30,12,0,0);
    const stored=date.toISOString();
    setUiLanguage('en');
    expect(getUiLanguage()).toBe('en');
    expect(formatAppDate(date)).toMatch(/Oct|October/);
    setUiLanguage('fa');
    expect(formatAppDate(date)).toContain('آبان');
    expect(date.toISOString()).toBe(stored);
  });
  it('contains source labels for all main navigation sections', () => {
    for (const label of ['Settings','Planner','Subjects','History','Search','Statistics','Study time']) expect(englishToPersian[label]).toBeTruthy();
    expect(translateUi('Subjects','fa')).toBe('درس‌ها');
    expect(translateUi('درس‌ها','en')).toBe('Subjects');
    for (const label of ['روز','ماه','سال','مرور فعال','رشد و پیشرفت']) expect(persianToEnglish[label]).toBeTruthy();
  });
});

import {describe, expect, it} from 'vitest';
import {buildPlanImportContext, isPlanIntakeResponse} from './studyCoachPlanContext';
const u=(content:string)=>({role:'user' as const, content});
const a=(content:string)=>({role:'assistant' as const, content});
describe('coach plan import conversation context',()=>{
 it('includes guided intake and subsequent answers',()=>{
  const msg=[u('برای فردا برنامه مطالعه می‌خوام'),a('برای ساخت برنامه قابل افزودن به Planner، چه درس‌ها و چقدر زمان داری؟'),u('زیست و ریاضی، سه ساعت'),a('ریاضی | تمرین | ۴۵ دقیقه')];
  const result=buildPlanImportContext(msg,3);
  expect(result).toContain('برای فردا');expect(result).toContain('سه ساعت');
 });
 it('does not include future messages or assistant text as instructions',()=>{
  expect(buildPlanImportContext([u('برنامه ریاضی بده'),a('داستان'),u('سلام')],1)).toBe('برنامه ریاضی بده');
 });
 it('keeps previous constraints when asking for a different plan',()=>{
  const msg=[u('برای ریاضی و زیست ۴ ساعت برنامه بده'),a('پیشنهاد'),u('یه برنامه متفاوت برای همین درس‌ها بده'),a('پاسخ')];
  expect(buildPlanImportContext(msg,3)).toContain('۴ ساعت');
 });
 it('bounds long conversations',()=>{
  const msg=[u('برنامه مطالعه '+ 'x'.repeat(1400)),a('سؤال'),u('ریاضی '+ 'y'.repeat(1450))];
  const result=buildPlanImportContext(msg,3);expect(result.length).toBeLessThanOrEqual(1600);expect(result).toMatch(/برنامه/);expect(result).toMatch(/ریاضی/);
 });
 it('preserves a late correction at the end of an oversized message',()=>{
  const msg=[u('برنامه مطالعه برای فردا '+ 'a'.repeat(1200)),a('سؤال'),u('ریاضی سه ساعت '+ 'b'.repeat(1200) + ' به جای زیست، شیمی')];
  const result=buildPlanImportContext(msg,3);
  expect(result.length).toBeLessThanOrEqual(1600);
  expect(result).toContain('ریاضی سه ساعت');
  expect(result).toContain('به جای زیست، شیمی');
 });
 it('retains the last user turn with seven oversized planning answers',()=>{
  const msg=[u('برنامه هفتگی، درس شیمی '+ 'a'.repeat(650))];
  for(let i=0;i<5;i++) msg.push(u(`تغییر ${i} `+'m'.repeat(600)));
  msg.push(u('اولویت جدید زیست '+ 'z'.repeat(1500)));
  const result=buildPlanImportContext(msg,7);
  expect(result.length).toBeLessThanOrEqual(1600);
  expect(result).toContain('برنامه هفتگی');
  expect(result).toContain('اولویت جدید زیست');
 });
 it('suppresses import button on intake questions',()=>{
  expect(isPlanIntakeResponse('برای ساخت برنامه قابل افزودن به Planner، درس‌ها را بگو')).toBe(true);
  expect(isPlanIntakeResponse('To build a plan you can add to Planner, please tell me')).toBe(true);
  expect(isPlanIntakeResponse('ریاضی | تمرین | ۴۵ دقیقه')).toBe(false);
 });
});

import {describe,expect,it} from 'vitest';
import {challengeInviteUrl,goalFromInvite} from './challengeInvite';
describe('shareable focus challenge links',()=>{
  it('accepts only allowed challenge goals',()=>{
    expect(goalFromInvite('?challenge=25')).toBe(25);
    expect(goalFromInvite('?challenge=45')).toBe(45);
    expect(goalFromInvite('?challenge=60')).toBe(60);
    expect(goalFromInvite('?challenge=1')).toBe(null);
    expect(goalFromInvite('?challenge=%3Cscript%3E')).toBe(null);
  });
  it('does not include account details in invitation link',()=>{
    expect(challengeInviteUrl(45)).toBe('https://limi-alive.github.io/studyflow/?challenge=45#/');
  });
});

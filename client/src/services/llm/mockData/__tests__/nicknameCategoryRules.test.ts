import { describe, expect, it } from 'vitest';
import { classifyByKeywords } from '../nicknameCategoryRules';

describe('classifyByKeywords', () => {
  it('classifies family terms as A', () => {
    expect(classifyByKeywords('엄마')).toBe('A');
    expect(classifyByKeywords('우리아빠')).toBe('A');
    expect(classifyByKeywords('Mom')).toBe('A');
  });

  it('classifies dark words as D', () => {
    expect(classifyByKeywords('어둠')).toBe('D');
    expect(classifyByKeywords('잊혀진')).toBe('D');
    expect(classifyByKeywords('그림자')).toBe('D');
  });

  it('classifies common Korean names as B', () => {
    expect(classifyByKeywords('민수')).toBe('B');
    expect(classifyByKeywords('영희')).toBe('B');
    expect(classifyByKeywords('지영')).toBe('B');
    expect(classifyByKeywords('철수네집')).toBe('B'); // 부분 매칭
  });

  it('returns H for unmapped general nicknames', () => {
    expect(classifyByKeywords('Simon')).toBe('H');
    expect(classifyByKeywords('파란하늘')).toBe('H');
    expect(classifyByKeywords('야간비행')).toBe('H');
  });

  it('respects priority D > A > B > H', () => {
    // D > A
    expect(classifyByKeywords('엄마의어둠')).toBe('D');
    // D > B
    expect(classifyByKeywords('민수의그림자')).toBe('D');
    // A > B
    expect(classifyByKeywords('엄마민수')).toBe('A');
  });
});

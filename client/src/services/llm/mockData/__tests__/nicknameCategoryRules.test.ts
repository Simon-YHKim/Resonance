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

  it('returns H for general nicknames', () => {
    expect(classifyByKeywords('민수')).toBe('H');
    expect(classifyByKeywords('Simon')).toBe('H');
    expect(classifyByKeywords('파란하늘')).toBe('H');
  });

  it('prefers D over A when both keywords present', () => {
    // "엄마" + "어둠" 동시 — 우선순위 D
    expect(classifyByKeywords('엄마의어둠')).toBe('D');
  });
});

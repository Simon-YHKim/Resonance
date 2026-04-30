import { describe, expect, it } from 'vitest';
import { CHAPTERS, chapterForTier } from '../chapters';

describe('CHAPTERS', () => {
  it('has 5 chapters with non-empty fields', () => {
    const ids = [1, 2, 3, 4, 5] as const;
    for (const id of ids) {
      const c = CHAPTERS[id];
      expect(c.id).toBe(id);
      expect(c.numeral).toMatch(/\d장/);
      expect(c.title.length).toBeGreaterThan(0);
      expect(c.intro.length).toBeGreaterThan(0);
    }
  });

  it('all 5 chapter intros are unique', () => {
    const intros = [1, 2, 3, 4, 5].map((id) => CHAPTERS[id as 1 | 2 | 3 | 4 | 5].intro);
    expect(new Set(intros).size).toBe(5);
  });
});

describe('chapterForTier', () => {
  it('novice → 1장', () => {
    expect(chapterForTier('novice', 0)).toBe(1);
    expect(chapterForTier('novice', 49)).toBe(1);
  });

  it('echo → 2장', () => {
    expect(chapterForTier('echo', 50)).toBe(2);
    expect(chapterForTier('echo', 149)).toBe(2);
  });

  it('resonant → 3장', () => {
    expect(chapterForTier('resonant', 150)).toBe(3);
    expect(chapterForTier('resonant', 399)).toBe(3);
  });

  it('origin (400~999) → 4장', () => {
    expect(chapterForTier('origin', 400)).toBe(4);
    expect(chapterForTier('origin', 999)).toBe(4);
  });

  it('origin (1000+) → 5장 (어린 너 등장)', () => {
    expect(chapterForTier('origin', 1000)).toBe(5);
    expect(chapterForTier('origin', 5000)).toBe(5);
  });
});

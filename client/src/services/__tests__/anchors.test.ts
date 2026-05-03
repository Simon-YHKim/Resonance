import { describe, expect, it } from 'vitest';
import { ANCHOR_META, anchorForKeyword, anchorsFor } from '../anchors';
import type { Keyword } from '@/types/game';

describe('ANCHOR_META', () => {
  it('has 4 anchors with non-empty fields', () => {
    const ids = Object.keys(ANCHOR_META);
    expect(ids).toHaveLength(4);
    for (const id of ids) {
      const m = ANCHOR_META[id as keyof typeof ANCHOR_META];
      expect(m.label.length).toBeGreaterThan(0);
      expect(m.description.length).toBeGreaterThan(0);
    }
  });

  it('all 4 keywords are mapped (1:1)', () => {
    const keywords: Keyword[] = ['희생', '꿈과현실', '어린시절', '추억'];
    const mapped = keywords.map(anchorForKeyword);
    // 4 unique anchors
    expect(new Set(mapped).size).toBe(4);
  });
});

describe('anchorForKeyword', () => {
  it('maps 4 keywords to 4 distinct anchors', () => {
    expect(anchorForKeyword('추억')).toBe('family');
    expect(anchorForKeyword('희생')).toBe('home');
    expect(anchorForKeyword('어린시절')).toBe('school');
    expect(anchorForKeyword('꿈과현실')).toBe('work');
  });
});

describe('anchorsFor', () => {
  it('returns single anchor for single keyword', () => {
    expect(anchorsFor(['추억'])).toEqual(['family']);
    expect(anchorsFor(['어린시절'])).toEqual(['school']);
  });

  it('returns multiple anchors for multiple keywords (보너스 캐릭터)', () => {
    const result = anchorsFor(['어린시절', '추억']);
    expect(result).toHaveLength(2);
    expect(result).toContain('school');
    expect(result).toContain('family');
  });

  it('returns empty array for empty keywords', () => {
    expect(anchorsFor([])).toEqual([]);
  });
});

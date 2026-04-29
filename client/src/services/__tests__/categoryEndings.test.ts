import { describe, expect, it } from 'vitest';
import { endingFooter } from '../categoryEndings';
import type { CombatOutcome, NicknameCategory } from '@/types/game';

describe('endingFooter', () => {
  const categories: NicknameCategory[] = ['A', 'B', 'D', 'H'];
  const outcomes: CombatOutcome[] = ['victory', 'defeat', 'fled', 'stalemate'];

  it('returns a non-empty string for every category × outcome pairing (16 cells)', () => {
    for (const c of categories) {
      for (const o of outcomes) {
        const text = endingFooter(c, o);
        expect(typeof text).toBe('string');
        expect(text.length).toBeGreaterThan(0);
      }
    }
  });

  it('A category emphasizes 그 이름 motif', () => {
    expect(endingFooter('A', 'victory')).toContain('그 이름');
  });

  it('B category emphasizes 같은 이름 motif', () => {
    expect(endingFooter('B', 'victory')).toMatch(/같은 이름|이름을 가진/);
  });

  it('D category uses abstract 그림자/잿빛 vocabulary, no 자해 keywords', () => {
    const forbidden = ['자살', '자해', '죽었', '베었'];
    for (const o of outcomes) {
      const text = endingFooter('D', o);
      for (const word of forbidden) {
        expect(text).not.toContain(word);
      }
    }
    // 그림자 또는 잿빛 또는 안개 같은 추상 어휘 사용 확인
    const hasAbstract = outcomes.some((o) =>
      /그림자|잿빛|안개|잊지/.test(endingFooter('D', o)),
    );
    expect(hasAbstract).toBe(true);
  });

  it('different categories produce different footers for same outcome', () => {
    expect(endingFooter('A', 'victory')).not.toBe(endingFooter('B', 'victory'));
    expect(endingFooter('A', 'victory')).not.toBe(endingFooter('D', 'victory'));
    expect(endingFooter('A', 'victory')).not.toBe(endingFooter('H', 'victory'));
  });
});

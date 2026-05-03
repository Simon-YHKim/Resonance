import { describe, expect, it } from 'vitest';
import { SHAPE_META, classifyShape } from '../contribution';
import type { CombatStats } from '../contribution';

const stats = (overrides: Partial<CombatStats> = {}): CombatStats => ({
  attackCount: 0,
  dialogueCount: 0,
  fleeCount: 0,
  totalTurns: 0,
  ...overrides,
});

describe('SHAPE_META', () => {
  it('has 4 shapes with non-empty fields', () => {
    const ids = Object.keys(SHAPE_META);
    expect(ids).toHaveLength(4);
    for (const id of ids) {
      const m = SHAPE_META[id as keyof typeof SHAPE_META];
      expect(m.label.length).toBeGreaterThan(0);
      expect(m.description.length).toBeGreaterThan(0);
      expect(m.color.length).toBeGreaterThan(0);
    }
  });
});

describe('classifyShape', () => {
  it('fled outcome → pause', () => {
    expect(classifyShape(stats({ attackCount: 5 }), 'fled')).toBe('pause');
  });

  it('flee 사용 → pause (outcome != fled여도)', () => {
    expect(classifyShape(stats({ attackCount: 3, fleeCount: 1 }), 'victory')).toBe('pause');
  });

  it('총 액션 < 2 → pause', () => {
    expect(classifyShape(stats({ attackCount: 1 }), 'victory')).toBe('pause');
    expect(classifyShape(stats({ dialogueCount: 1 }), 'stalemate')).toBe('pause');
  });

  it('attack 우세 (> dialogue + 2) → sword', () => {
    expect(classifyShape(stats({ attackCount: 4, dialogueCount: 1 }), 'victory')).toBe('sword');
    expect(classifyShape(stats({ attackCount: 5, dialogueCount: 0 }), 'victory')).toBe('sword');
  });

  it('dialogue 우세 (> attack + 2) → word', () => {
    expect(classifyShape(stats({ attackCount: 1, dialogueCount: 4 }), 'victory')).toBe('word');
    expect(classifyShape(stats({ attackCount: 0, dialogueCount: 5 }), 'victory')).toBe('word');
  });

  it('비등 (차이 ≤ 2) → balance', () => {
    expect(classifyShape(stats({ attackCount: 3, dialogueCount: 3 }), 'victory')).toBe('balance');
    expect(classifyShape(stats({ attackCount: 3, dialogueCount: 1 }), 'victory')).toBe('balance');
    expect(classifyShape(stats({ attackCount: 2, dialogueCount: 4 }), 'victory')).toBe('balance');
  });

  it('정확히 +2 차이는 balance (경계 상)', () => {
    // attackCount > dialogueCount + 2 만 sword. 정확히 +2는 balance.
    expect(classifyShape(stats({ attackCount: 4, dialogueCount: 2 }), 'victory')).toBe('balance');
  });
});

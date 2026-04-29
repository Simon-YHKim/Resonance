import { describe, expect, it } from 'vitest';
import {
  TURN_LIMIT,
  evaluateOutcome,
  resonanceBonusFor,
} from '../combatOutcome';

describe('evaluateOutcome', () => {
  it('returns fled for flee action regardless of HP/turn', () => {
    expect(
      evaluateOutcome({ nextTurn: 1, playerHp: 100, enemyHp: 60, action: 'flee' }),
    ).toBe('fled');
  });

  it('returns victory when enemy HP <= 0', () => {
    expect(
      evaluateOutcome({ nextTurn: 2, playerHp: 50, enemyHp: 0, action: 'attack' }),
    ).toBe('victory');
    expect(
      evaluateOutcome({ nextTurn: 1, playerHp: 50, enemyHp: -10, action: 'attack' }),
    ).toBe('victory');
  });

  it('returns defeat when player HP <= 0', () => {
    expect(
      evaluateOutcome({ nextTurn: 3, playerHp: 0, enemyHp: 30, action: 'attack' }),
    ).toBe('defeat');
  });

  it('prioritizes victory over defeat when both HP <= 0', () => {
    // 동시 도달 시 victory 우선 (player가 마지막 일격을 먼저 가했다고 본다)
    expect(
      evaluateOutcome({ nextTurn: 4, playerHp: 0, enemyHp: 0, action: 'attack' }),
    ).toBe('victory');
  });

  it('returns stalemate at TURN_LIMIT with both HP > 0', () => {
    expect(
      evaluateOutcome({
        nextTurn: TURN_LIMIT,
        playerHp: 30,
        enemyHp: 20,
        action: 'attack',
      }),
    ).toBe('stalemate');
  });

  it('returns null when combat continues', () => {
    expect(
      evaluateOutcome({ nextTurn: 2, playerHp: 80, enemyHp: 40, action: 'attack' }),
    ).toBeNull();
    expect(
      evaluateOutcome({ nextTurn: 3, playerHp: 50, enemyHp: 50, action: 'dialogue' }),
    ).toBeNull();
  });
});

describe('resonanceBonusFor', () => {
  it('victory grants the highest bonus', () => {
    expect(resonanceBonusFor('victory')).toBe(10);
  });

  it('stalemate grants a small bonus (above flee)', () => {
    expect(resonanceBonusFor('stalemate')).toBe(3);
  });

  it('fled and defeat grant no bonus', () => {
    expect(resonanceBonusFor('fled')).toBe(0);
    expect(resonanceBonusFor('defeat')).toBe(0);
  });
});

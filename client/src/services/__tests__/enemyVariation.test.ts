import { describe, expect, it } from 'vitest';
import { instantiateEnemy } from '../enemyVariation';
import type { EnemyArchetype } from '../llm/mockData/combatNarrations';

const arche: EnemyArchetype = {
  name: '잊혀진 자 — 남겨진 거인',
  description: '...',
  encounter: '...',
  hp: 60,
  background: '...',
};

describe('instantiateEnemy', () => {
  it('preserves name/description/encounter', () => {
    const e = instantiateEnemy(arche, 0.5);
    expect(e.name).toBe(arche.name);
    expect(e.description).toBe(arche.description);
    expect(e.encounter).toBe(arche.encounter);
  });

  it('hp = maxHp (full at instantiation)', () => {
    const e = instantiateEnemy(arche, 0.5);
    expect(e.hp).toBe(e.maxHp);
  });

  it('seed=0.5 → variance 0 → exact archetype.hp', () => {
    const e = instantiateEnemy(arche, 0.5);
    expect(e.hp).toBe(60);
  });

  it('seed=0 → -10% variance', () => {
    const e = instantiateEnemy(arche, 0);
    expect(e.hp).toBe(54); // 60 * 0.9
  });

  it('seed=1 → +10% variance (close to)', () => {
    const e = instantiateEnemy(arche, 0.99);
    expect(e.hp).toBeGreaterThanOrEqual(65);
    expect(e.hp).toBeLessThanOrEqual(66);
  });

  it('always within ±10% range', () => {
    for (let i = 0; i < 100; i++) {
      const e = instantiateEnemy(arche);
      expect(e.hp).toBeGreaterThanOrEqual(54); // 60 * 0.9
      expect(e.hp).toBeLessThanOrEqual(66); // 60 * 1.1
    }
  });

  it('different seeds typically produce different hp values', () => {
    const hps = new Set<number>();
    for (let i = 0; i < 20; i++) {
      hps.add(instantiateEnemy(arche, i / 20).hp);
    }
    // 20 different seeds should give multiple distinct hp values
    expect(hps.size).toBeGreaterThanOrEqual(5);
  });

  it('hp never falls below 1 (defensive against very small base)', () => {
    const tiny: EnemyArchetype = { ...arche, hp: 1 };
    const e = instantiateEnemy(tiny, 0); // -10% of 1 = 0.9 → rounds to 1
    expect(e.hp).toBeGreaterThanOrEqual(1);
  });
});

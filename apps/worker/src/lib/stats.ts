/**
 * 5 스탯 시스템 룰 — 디아블로식 전투 계산.
 *
 * - 힘 (strength)      : 공격 데미지 ×(1 + (str-10)/50). 10=×1.0, 15=×1.1, 20=×1.2.
 * - 민첩 (dexterity)   :
 *     - 회피 확률 = clamp((dex - enemy_dex)/100 + 0.05, 0, 0.30)
 *     - 선제공격: dex ≥ enemy_dex + 3 → 적 반격 데미지 ×0.5
 * - 지능 (intelligence): 잔잔(殘殘) +Δ 보너스 = (int-10)/5 (반올림). 10=+0, 15=+1, 20=+2.
 * - 에너지 (energy)    : stamina max = 100 + (energy-10)×5
 * - 체력 (vitality)    : HP max = 100 + (vit-10)×5
 *
 * Refs: 2026-05-06 사용자 결정 — 디아블로식 5스탯
 */

import type { Stats } from '@resonance/shared';
import { STATS_DEFAULT } from '@resonance/shared';

export const STATS_FALLBACK = STATS_DEFAULT;

/** 힘 → 적 HP delta 보정 (음수 → 더 큰 음수) */
export function applyStrengthToEnemyDelta(rawDelta: number, str: number): number {
  if (rawDelta >= 0) return rawDelta;
  const multiplier = 1 + (str - 10) / 50;
  return Math.round(rawDelta * Math.max(0.5, multiplier));
}

/** 회피 확률 (0~0.30) */
export function dodgeChance(playerStats: Stats, enemyStats: Stats): number {
  const diff = playerStats.dexterity - enemyStats.dexterity;
  return Math.max(0, Math.min(0.3, diff / 100 + 0.05));
}

/** 선제공격 (적 반격 약화) */
export function isPreemptive(playerStats: Stats, enemyStats: Stats): boolean {
  return playerStats.dexterity >= enemyStats.dexterity + 3;
}

/** 적 반격 데미지 (player HP delta) — 회피 / 선제공격 적용 */
export function applyDexterityToPlayerDelta(
  rawDelta: number,
  playerStats: Stats,
  enemyStats: Stats,
  rng: () => number = Math.random,
): { delta: number; dodged: boolean; preemptive: boolean } {
  if (rawDelta >= 0) return { delta: rawDelta, dodged: false, preemptive: false };
  const dodge = rng() < dodgeChance(playerStats, enemyStats);
  if (dodge) return { delta: 0, dodged: true, preemptive: false };
  const pre = isPreemptive(playerStats, enemyStats);
  if (pre) return { delta: Math.round(rawDelta * 0.5), dodged: false, preemptive: true };
  return { delta: rawDelta, dodged: false, preemptive: false };
}

/** 지능 → 잔잔 보너스 */
export function applyIntelligenceToResonance(rawDelta: number, int: number): number {
  if (rawDelta <= 0) return rawDelta;
  return rawDelta + Math.round((int - 10) / 5);
}

/** 체력 → HP max */
export function maxHpFromVitality(vit: number, base = 100): number {
  return base + (vit - 10) * 5;
}

/** 에너지 → stamina max */
export function maxStaminaFromEnergy(energy: number, base = 100): number {
  return base + (energy - 10) * 5;
}

/** 회복 아이템 효과 — 체력 보너스 적용 */
export function recoverHp(rawAmount: number, vit: number): number {
  return Math.round(rawAmount * (1 + (vit - 10) / 50));
}

/** 회복 아이템 효과 — 에너지 보너스 적용 */
export function recoverStamina(rawAmount: number, energy: number): number {
  return Math.round(rawAmount * (1 + (energy - 10) / 50));
}

/** 인벤토리 cosmetic stat_bonus → base stats 합산 (장비 효과) */
export function getEffectiveStats(
  baseStats: Stats,
  cosmeticBonuses: Array<Partial<Stats>>,
): Stats {
  const out = { ...baseStats };
  for (const b of cosmeticBonuses) {
    for (const k of Object.keys(b) as Array<keyof Stats>) {
      out[k] = Math.min(20, out[k] + (b[k] ?? 0));
    }
  }
  return out;
}

/** 인벤토리 row → cosmetic stat_bonus 추출 (purchaseable JSON parse) */
export function extractCosmeticBonuses(
  inventoryRows: Array<{ category: string; effect_json: string }>,
): Array<Partial<Stats>> {
  const bonuses: Array<Partial<Stats>> = [];
  for (const row of inventoryRows) {
    if (row.category !== 'cosmetic') continue;
    try {
      const e = JSON.parse(row.effect_json) as { stat_bonus?: Partial<Stats> };
      if (e.stat_bonus) bonuses.push(e.stat_bonus);
    } catch {
      /* ignore */
    }
  }
  return bonuses;
}

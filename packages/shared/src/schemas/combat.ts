/**
 * 잔향 전투 스키마 — Phase 1.6 (1턴 전투 mock).
 *
 * Stateless: 클라이언트가 state 관리, 서버는 Gemini 호출 + delta 계산.
 * 5턴 제한 + 잊혀진 자 1체 (어린 시절의 잔해 placeholder, HP 60).
 */

import { z } from 'zod';

export const CombatActionSchema = z.enum(['attack', 'dialogue', 'flee']);
export type CombatAction = z.infer<typeof CombatActionSchema>;

/**
 * 잔잔(殘殘) 임계 — 누적 잔잔이 깊어질수록 *대화의 결*이 다른 단계로.
 * descend (0~29) → empathy (30~59) → memory (60~99) → origin (100+)
 *
 * Refs: Design+Story agent layer 2 (영혼 4번 *대화 깊이* 분기).
 */
export const RESONANCE_TIERS = {
  empathy: 30,
  memory: 60,
  origin: 100,
} as const;
export type ResonanceTier = 'descend' | 'empathy' | 'memory' | 'origin';
export function getResonanceTier(resonance: number): ResonanceTier {
  if (resonance >= RESONANCE_TIERS.origin) return 'origin';
  if (resonance >= RESONANCE_TIERS.memory) return 'memory';
  if (resonance >= RESONANCE_TIERS.empathy) return 'empathy';
  return 'descend';
}
export const RESONANCE_TIER_LABELS: Record<ResonanceTier, string> = {
  descend: '평이',
  empathy: '공감 한 마디',
  memory: '오래된 기억',
  origin: '원의 답',
};

/**
 * 5 스탯 시스템 — 디아블로식 (1~20).
 *
 * - 힘 (strength)      : 공격 데미지 ×(1 + (str-10)/50)
 * - 민첩 (dexterity)   : 회피 확률 + 선제공격 (적 반격 약화)
 * - 지능 (intelligence): 잔잔(殘殘) +Δ 보너스 ((int-10)/5)
 * - 에너지 (energy)    : stamina max = 100 + (energy-10)×5
 * - 체력 (vitality)    : HP max = 100 + (vit-10)×5
 *
 * 닉네임 분석 시 LLM이 *결*에 맞춰 자동 분배 (합 50 권장, 1~20 범위).
 *
 * Refs: 2026-05-06 사용자 결정 — 디아블로처럼 5스탯
 */
export const StatsSchema = z.object({
  strength: z.number().int().min(1).max(20),
  dexterity: z.number().int().min(1).max(20),
  intelligence: z.number().int().min(1).max(20),
  energy: z.number().int().min(1).max(20),
  vitality: z.number().int().min(1).max(20),
});
export type Stats = z.infer<typeof StatsSchema>;

export const STATS_DEFAULT: Stats = {
  strength: 10,
  dexterity: 10,
  intelligence: 10,
  energy: 10,
  vitality: 10,
};

export const STAT_LABELS: Record<keyof Stats, string> = {
  strength: '힘',
  dexterity: '민첩',
  intelligence: '지능',
  energy: '에너지',
  vitality: '체력',
};

export const CombatOutcomeSchema = z.enum(['victory', 'defeat', 'fled', 'stalemate']);
export type CombatOutcome = z.infer<typeof CombatOutcomeSchema>;

export const EnemySchema = z.object({
  name: z.string(),
  description: z.string(),
  encounter: z.string(),
  hp: z.number().int().nonnegative(),
  maxHp: z.number().int().positive(),
  stats: StatsSchema.optional(),
});

export const CombatStateSchema = z.object({
  player: z.object({
    hp: z.number().int().nonnegative(),
    maxHp: z.number().int().positive(),
    stamina: z.number().int().nonnegative(),
    maxStamina: z.number().int().positive(),
    stats: StatsSchema.optional(),
  }),
  enemy: EnemySchema,
  turn: z.number().int().nonnegative(),
  resonance: z.number().int().nonnegative(),
  log: z.array(z.string()).default([]),
});

export type CombatState = z.infer<typeof CombatStateSchema>;

export const CombatTurnRequestSchema = z.object({
  state: CombatStateSchema,
  action: CombatActionSchema,
  /** 사용자 자유 텍스트 (옵션, 매크로) */
  userText: z.string().max(200).optional(),
});

export const CombatTurnResultSchema = z.object({
  narration: z.string(),
  enemyNarration: z.string(),
  playerHpDelta: z.number().int(),
  enemyHpDelta: z.number().int(),
  resonanceDelta: z.number().int().nonnegative(),
  /** 자살예방법 §27조의8 안전 트리거 — 'high' 시 앱이 1393 모달 표시 */
  safety_concern: z.enum(['none', 'high']).default('none'),
});

export type CombatTurnResult = z.infer<typeof CombatTurnResultSchema>;

/** Gemini가 반환하는 schema (LLM 응답 검증) */
export const CombatLLMResponseSchema = z.object({
  narration: z.string().min(1),
  enemyNarration: z.string().min(1),
  enemyHpDelta: z.number().int().min(-30).max(0),
  playerHpDelta: z.number().int().min(-25).max(0),
  resonanceDelta: z.number().int().min(0).max(20),
  safety_concern: z.enum(['none', 'high']).optional().default('none'),
});

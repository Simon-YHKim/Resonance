/**
 * 잔향 전투 스키마 — Phase 1.6 (1턴 전투 mock).
 *
 * Stateless: 클라이언트가 state 관리, 서버는 Gemini 호출 + delta 계산.
 * 5턴 제한 + 잊혀진 자 1체 (어린 시절의 잔해 placeholder, HP 60).
 */

import { z } from 'zod';

export const CombatActionSchema = z.enum(['attack', 'dialogue', 'flee']);
export type CombatAction = z.infer<typeof CombatActionSchema>;

export const CombatOutcomeSchema = z.enum(['victory', 'defeat', 'fled', 'stalemate']);
export type CombatOutcome = z.infer<typeof CombatOutcomeSchema>;

export const EnemySchema = z.object({
  name: z.string(),
  description: z.string(),
  encounter: z.string(),
  hp: z.number().int().nonnegative(),
  maxHp: z.number().int().positive(),
});

export const CombatStateSchema = z.object({
  player: z.object({
    hp: z.number().int().nonnegative(),
    maxHp: z.number().int().positive(),
    stamina: z.number().int().nonnegative(),
    maxStamina: z.number().int().positive(),
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

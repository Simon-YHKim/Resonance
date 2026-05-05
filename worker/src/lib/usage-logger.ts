/**
 * llm_usage_log 기록.
 *
 * 모든 LLM 호출 (mock 포함) 시 input·output 토큰 + 비용 자동 기록.
 * Day 5에서 paid-api-guard 분석 활용.
 *
 * Refs: 잔향_시스템명세_v1.4.md §4.2
 */

export type LLMContext =
  | 'battle'
  | 'story'
  | 'character_gen'
  | 'ending'
  | 'macro'
  | 'mob_gen';

export interface LLMUsageEntry {
  userId: string;
  llmModel: string; // 'claude-haiku-4-5' | 'mock' | ...
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  context: LLMContext;
  isPremium: boolean;
}

export async function logLLMUsage(
  db: D1Database,
  e: LLMUsageEntry,
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO llm_usage_log
       (user_id, llm_model, input_tokens, output_tokens, cost_usd, context, is_premium, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      e.userId,
      e.llmModel,
      e.inputTokens,
      e.outputTokens,
      e.costUsd,
      e.context,
      e.isPremium ? 1 : 0,
      Date.now(),
    )
    .run();
}

/**
 * 사용자 일일 토큰 소비 — paid-api-guard 임계값 체크용.
 * Day 5 rate limit 에서 활용.
 */
export async function getUserDailyTokens(
  db: D1Database,
  userId: string,
  fromMs: number = Date.now() - 24 * 60 * 60 * 1000,
): Promise<{ tokens: number; calls: number; costUsd: number }> {
  const row = await db
    .prepare(
      `SELECT
         COALESCE(SUM(input_tokens + output_tokens), 0) AS tokens,
         COUNT(*) AS calls,
         COALESCE(SUM(cost_usd), 0) AS cost_usd
       FROM llm_usage_log
       WHERE user_id = ? AND timestamp >= ?`,
    )
    .bind(userId, fromMs)
    .first<{ tokens: number; calls: number; cost_usd: number }>();
  return {
    tokens: row?.tokens ?? 0,
    calls: row?.calls ?? 0,
    costUsd: row?.cost_usd ?? 0,
  };
}

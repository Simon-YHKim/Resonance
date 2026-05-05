/**
 * Rate limiter — D1 기반.
 *
 * paid-api-guard:
 *   - 닉네임 분석은 비용 高 (LLM 호출). 사용자당 1회/시간.
 *   - 시간당 호출 수 = llm_usage_log COUNT (timestamp >= 1시간 전).
 *   - 초과 시 429.
 *
 * Phase 2+ 에서 KV 또는 Durable Object 로 교체 (D1 부하 분산).
 *
 * Refs: 잔향_시스템명세_v1.4.md §4.2 / PHASE1_BUILD_PROMPT.md Day 5
 */

const HOUR_MS = 60 * 60 * 1000;

export interface RateLimitResult {
  allowed: boolean;
  callsInWindow: number;
  limit: number;
  retryAfterMs: number;
}

/**
 * 특정 context (ex: 'character_gen') 의 시간당 호출 수 검사.
 *
 * @param db          D1 binding
 * @param userId      사용자
 * @param context     llm_usage_log.context 값 (analyze 는 'character_gen')
 * @param limit       시간당 최대 호출 수
 * @param windowMs    시간 창 (기본 1시간)
 */
export async function checkRateLimit(
  db: D1Database,
  userId: string,
  context: string,
  limit: number,
  windowMs: number = HOUR_MS,
): Promise<RateLimitResult> {
  const fromMs = Date.now() - windowMs;
  const row = await db
    .prepare(
      `SELECT COUNT(*) AS calls
       FROM llm_usage_log
       WHERE user_id = ? AND context = ? AND timestamp >= ?`,
    )
    .bind(userId, context, fromMs)
    .first<{ calls: number }>();

  const calls = row?.calls ?? 0;
  return {
    allowed: calls < limit,
    callsInWindow: calls,
    limit,
    retryAfterMs: calls < limit ? 0 : windowMs,
  };
}

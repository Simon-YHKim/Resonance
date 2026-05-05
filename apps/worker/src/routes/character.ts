/**
 * POST /api/character/analyze
 *
 * 닉네임 → LLM 분석 → user_wiki 저장 → 응답.
 *
 * paid-api-guard:
 *   - rate limit (Day 5 추가)
 *   - 시크릿 .env 검증 (lib에서)
 * security-checklist:
 *   - SQL prepared statements (D1.prepare)
 *   - 입력 검증 (validateNickname)
 *
 * Refs: 잔향_시스템명세_v1.4.md §2.1, §2.2 / PHASE1_BUILD_PROMPT.md Day 2
 */

import { Hono } from 'hono';
import { Bindings } from '../types/bindings';
import {
  analyzeNickname,
  InvalidNicknameError,
  LLMError,
} from '../lib/nickname-analyzer';
import { logLLMUsage } from '../lib/usage-logger';
import { getCurrentUserId, ensureUserExists } from '../middleware/auth';
import { upsertUserWiki } from '../lib/wiki-store';
import { checkRateLimit } from '../middleware/rate-limit';

/** paid-api-guard: 사용자당 시간당 닉네임 분석 호출 수 */
const ANALYZE_RATE_LIMIT_PER_HOUR = 5;

export const characterRouter = new Hono<{ Bindings: Bindings }>();

interface AnalyzeBody {
  nickname?: unknown;
}

characterRouter.post('/analyze', async (c) => {
  const userId = getCurrentUserId(c);
  if (!userId) {
    return c.json(
      { success: false, error: '로그인이 필요합니다.', code: 'UNAUTHORIZED' },
      401,
    );
  }

  let body: AnalyzeBody;
  try {
    body = await c.req.json();
  } catch {
    return c.json(
      { success: false, error: 'JSON body 가 필요합니다.', code: 'INVALID_BODY' },
      400,
    );
  }

  // paid-api-guard: rate limit 검사 (시간당 N회)
  const rl = await checkRateLimit(c.env.DB, userId, 'character_gen', ANALYZE_RATE_LIMIT_PER_HOUR);
  if (!rl.allowed) {
    return c.json(
      {
        success: false,
        error: `시간당 ${rl.limit}회까지 가능합니다. 잠시 후 다시 시도해주세요.`,
        code: 'RATE_LIMITED',
        retry_after_ms: rl.retryAfterMs,
      },
      429,
    );
  }

  try {
    // 1. LLM 분석 (Mock 또는 Haiku)
    const result = await analyzeNickname(body.nickname, c.env);

    // 2. users 행 보장 (FK)
    await ensureUserExists(c.env.DB, userId);

    // 3. user_wiki upsert
    await upsertUserWiki(c.env.DB, userId, result.analysis);

    // 4. LLM usage 로깅 (mock 도 기록 — 0 cost)
    await logLLMUsage(c.env.DB, {
      userId,
      llmModel: result.model,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      costUsd: result.costUsd,
      context: 'character_gen',
      isPremium: false,
    });

    return c.json({
      success: true,
      user_wiki: {
        user_id: userId,
        nickname_analysis: result.analysis,
      },
      meta: {
        model: result.model,
        input_tokens: result.inputTokens,
        output_tokens: result.outputTokens,
        cost_usd: result.costUsd,
      },
    });
  } catch (err) {
    if (err instanceof InvalidNicknameError) {
      return c.json({ success: false, error: err.message, code: err.code }, 400);
    }
    if (err instanceof LLMError) {
      return c.json({ success: false, error: err.message, code: err.code }, 500);
    }
    console.error('[character/analyze] unexpected', err);
    return c.json(
      { success: false, error: '서버 오류가 발생했습니다.', code: 'SERVER_ERROR' },
      500,
    );
  }
});

/**
 * GET /api/character/wiki — 현재 사용자의 wiki 조회.
 * Day 4 E2E 시나리오에서 활용.
 */
characterRouter.get('/wiki', async (c) => {
  const userId = getCurrentUserId(c);
  if (!userId) {
    return c.json(
      { success: false, error: '로그인이 필요합니다.', code: 'UNAUTHORIZED' },
      401,
    );
  }

  const row = await c.env.DB.prepare('SELECT * FROM user_wiki WHERE user_id = ?')
    .bind(userId)
    .first();

  if (!row) {
    return c.json(
      { success: false, error: 'user_wiki 가 없습니다. /api/character/analyze 먼저.', code: 'NO_WIKI' },
      404,
    );
  }

  return c.json({
    success: true,
    user_wiki: {
      user_id: row.user_id,
      nickname_analysis: JSON.parse(row.nickname_analysis_json as string),
      milestones: row.milestones_json ? JSON.parse(row.milestones_json as string) : [],
      gaehwa_axis: row.gaehwa_axis,
      yeojeon_axis: row.yeojeon_axis,
      hangno_axis: row.hangno_axis,
      axis_locked_at: row.axis_locked_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
    },
  });
});

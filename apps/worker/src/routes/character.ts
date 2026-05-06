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
import { checkBudget, parseBudget } from '../lib/budget-guard';
import {
  ensureCodeForUser,
  findUserByCode,
  isValidCode,
} from '../lib/character-code';

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

  // paid-api-guard: 일일 비용 캡 검사 — 초과 시 분석 거절 (캐릭터 생성은 1회성·핵심 → mock fallback 대신 명시 차단)
  const userBudget = parseBudget(c.env.USER_DAILY_BUDGET_USD, 0.1);
  const globalBudget = parseBudget(c.env.DAILY_BUDGET_USD, 1.0);
  const budget = await checkBudget(c.env.DB, userId, userBudget, globalBudget);
  if (!budget.withinBudget) {
    return c.json(
      {
        success: false,
        error:
          budget.reason === 'user_cap'
            ? '오늘 잔향이 잦아드는 시간입니다. 내일 다시 와주세요.'
            : '잠시 잔향이 멈춥니다. 잠시 후 다시 시도해주세요.',
        code: 'BUDGET_EXCEEDED',
        reason: budget.reason,
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

    // 5. 잔향 코드 발급 (plan9 영감 — 친구 공유용)
    const code = await ensureCodeForUser(c.env.DB, userId);

    return c.json({
      success: true,
      user_wiki: {
        user_id: userId,
        nickname_analysis: result.analysis,
        nickname_code: code,
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
      nickname_code: row.nickname_code,
      created_at: row.created_at,
      updated_at: row.updated_at,
    },
  });
});

/**
 * GET /api/character/code — 내 잔향 코드 (없으면 발급).
 *
 * plan9 영감: 캐릭터 코드 공유 → 친구가 코드로 내 잊혀진 자 만나기.
 */
characterRouter.get('/code', async (c) => {
  const userId = getCurrentUserId(c);
  if (!userId) {
    return c.json(
      { success: false, error: '로그인이 필요합니다.', code: 'UNAUTHORIZED' },
      401,
    );
  }

  // wiki 가 있어야 코드 발급 가능
  const wiki = await c.env.DB.prepare(
    'SELECT user_id FROM user_wiki WHERE user_id = ?',
  )
    .bind(userId)
    .first();
  if (!wiki) {
    return c.json(
      {
        success: false,
        error: '먼저 닉네임을 분석해주세요.',
        code: 'NO_WIKI',
      },
      404,
    );
  }

  const code = await ensureCodeForUser(c.env.DB, userId);
  return c.json({ success: true, code });
});

/**
 * GET /api/character/by-code/:code — 코드로 다른 사람 wiki 조회 (익명).
 *
 * 공개 정보만 노출 (user_id 마스킹·축점수 비노출).
 * Phase 2에서 *공감 미션* (이 코드의 잊혀진 자와 만나기) 로 확장.
 */
characterRouter.get('/by-code/:code', async (c) => {
  const code = c.req.param('code');
  if (!isValidCode(code)) {
    return c.json(
      { success: false, error: '잘못된 코드 형식입니다.', code: 'INVALID_CODE' },
      400,
    );
  }
  const found = await findUserByCode(c.env.DB, code);
  if (!found) {
    return c.json(
      { success: false, error: '코드를 찾을 수 없습니다.', code: 'NOT_FOUND' },
      404,
    );
  }
  const analysis = JSON.parse(found.nickname_analysis_json);
  return c.json({
    success: true,
    code,
    nickname_analysis: {
      nickname: analysis.nickname,
      category: analysis.category,
      추정직업: analysis.추정직업,
      추정연령: analysis.추정연령,
      정서적결: analysis.정서적결,
      주요키워드: analysis.주요키워드,
    },
  });
});

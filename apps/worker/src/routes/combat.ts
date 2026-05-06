/**
 * POST /api/combat/start  — 잊혀진 자 1체 + 초기 state
 * POST /api/combat/turn   — 사용자 액션 → Gemini 묘사 + delta + 새 state
 *
 * Stateless: 클라이언트가 state 보내고 받음.
 * Phase 2+ 에서 D1 combat_sessions 도입.
 */

import { Hono } from 'hono';
import {
  CombatStateSchema,
  CombatTurnRequestSchema,
  type CombatOutcome,
} from '@resonance/shared';
import { Bindings } from '../types/bindings';
import {
  FORGETTER_OF_CHILDHOOD,
  combatTurnWithGemini,
  combatTurnMock,
} from '../lib/combat';
import { logLLMUsage } from '../lib/usage-logger';
import { getCurrentUserId, ensureUserExists } from '../middleware/auth';
import { LLMError, detectSafetyConcern } from '../lib/nickname-analyzer';
import { checkRateLimit } from '../middleware/rate-limit';
import { checkBudget, parseBudget } from '../lib/budget-guard';
import { consumeStamina } from '../lib/stamina';
import { earnResonanceDust } from './shop';
import { STORY_CONSTANTS } from '../lib/forgetters';

export const combatRouter = new Hono<{ Bindings: Bindings }>();

const TURN_LIMIT = 5;
// paid-api-guard: 사용자당 시간당 전투 턴 호출 수 (5턴 × 6배틀)
const COMBAT_RATE_LIMIT_PER_HOUR = 30;

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

combatRouter.post('/start', async (c) => {
  return c.json({
    success: true,
    state: {
      player: { hp: 100, maxHp: 100, stamina: 100, maxStamina: 100 },
      enemy: { ...FORGETTER_OF_CHILDHOOD },
      turn: 0,
      resonance: 0,
      log: [],
    },
  });
});

combatRouter.post('/turn', async (c) => {
  const userId = getCurrentUserId(c) ?? 'anonymous';

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ success: false, error: 'JSON body 필요', code: 'INVALID_BODY' }, 400);
  }

  const parsed = CombatTurnRequestSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      {
        success: false,
        error: '잘못된 전투 요청',
        code: 'INVALID_BODY',
        detail: parsed.error.message,
      },
      400,
    );
  }
  const { state, action, userText } = parsed.data;

  // 자살예방법 §27조의8 — userText 입력단 차단 (LLM 도달 X, 신고채널 운영 회피)
  if (userText && detectSafetyConcern(userText) === 'high') {
    return c.json(
      {
        success: false,
        error: '잔향이 한 번 멈춥니다. 다른 말로 — 너의 결을 들려주시겠어요?',
        code: 'INPUT_BLOCKED_SAFETY',
        safety_concern: 'high',
      },
      400,
    );
  }

  if (state.turn >= TURN_LIMIT) {
    return c.json(
      { success: false, error: '5턴 한도 초과', code: 'TURN_LIMIT' },
      400,
    );
  }

  // paid-api-guard: rate limit (시간당 N턴)
  // 익명 사용자도 IP 기반 rate limit (헤더 우회 방어)
  const ip =
    c.req.header('cf-connecting-ip') ?? c.req.header('x-forwarded-for') ?? 'anonymous';
  const rateLimitKey = userId !== 'anonymous' ? userId : `ip:${ip}`;
  const rl = await checkRateLimit(c.env.DB, rateLimitKey, 'battle', COMBAT_RATE_LIMIT_PER_HOUR);
  if (!rl.allowed) {
    return c.json(
      {
        success: false,
        error: `시간당 ${rl.limit}턴까지 가능합니다. 잠시 후 다시 시도해주세요.`,
        code: 'RATE_LIMITED',
        retry_after_ms: rl.retryAfterMs,
      },
      429,
    );
  }

  // paid-api-guard: 일일 비용 캡 — 사용자/IP 기반 (헤더 위조 방어)
  const userBudget = parseBudget(c.env.USER_DAILY_BUDGET_USD, 0.1);
  const globalBudget = parseBudget(c.env.DAILY_BUDGET_USD, 1.0);
  const budget = await checkBudget(c.env.DB, rateLimitKey, userBudget, globalBudget);

  // Phase 2 — 스테미나 차감 (combat turn = 1)
  let stamSnapshot: { current: number; max_daily: number; cost: number; willResetAtMs: number } | null = null;
  if (userId !== 'anonymous') {
    await ensureUserExists(c.env.DB, userId);
    const stam = await consumeStamina(c.env.DB, userId, 'combat_turn');
    if (!stam.allowed) {
      return c.json(
        {
          success: false,
          error: '잔향이 잠시 잦아드는 시간입니다. 자정에 다시 깨어나요.',
          code: 'STAMINA_EMPTY',
          stamina: { current: stam.current, max_daily: stam.max_daily, cost: stam.cost, willResetAtMs: stam.willResetAtMs },
        },
        429,
      );
    }
    stamSnapshot = { current: stam.current, max_daily: stam.max_daily, cost: stam.cost, willResetAtMs: stam.willResetAtMs };
  }

  // Gemini 호출 (또는 mock)
  const useMock =
    !c.env.GEMINI_API_KEY ||
    c.env.JANSAE_LLM_PRIMARY_MODEL === 'mock' ||
    !budget.withinBudget;

  let result;
  let model = 'mock';
  let inputTokens = 0;
  let outputTokens = 0;
  let costUsd = 0;

  try {
    if (useMock) {
      result = combatTurnMock(state, action, userText);
    } else {
      const call = await combatTurnWithGemini(
        state,
        action,
        userText,
        c.env.GEMINI_API_KEY!,
        { model: c.env.JANSAE_LLM_PRIMARY_MODEL },
      );
      result = call.result;
      model = c.env.JANSAE_LLM_PRIMARY_MODEL ?? 'gemini-flash-lite-latest';
      inputTokens = call.inputTokens;
      outputTokens = call.outputTokens;
      // Gemini Flash-Lite: $0.10 / $0.40 per 1M tokens
      costUsd = (inputTokens * 0.1 + outputTokens * 0.4) / 1_000_000;
    }
  } catch (err) {
    if (c.env.JANSAE_LLM_FALLBACK_MODEL === 'mock') {
      result = combatTurnMock(state, action, userText);
    } else {
      if (err instanceof LLMError) {
        return c.json(
          { success: false, error: err.message, code: 'LLM_ERROR' },
          500,
        );
      }
      throw err;
    }
  }

  // 새 state 계산 (룰 기반 — 클라이언트가 보낸 state + delta)
  const nextState = {
    player: {
      ...state.player,
      hp: clamp(state.player.hp + result.playerHpDelta, 0, state.player.maxHp),
    },
    enemy: {
      ...state.enemy,
      hp: clamp(state.enemy.hp + result.enemyHpDelta, 0, state.enemy.maxHp),
    },
    turn: state.turn + 1,
    resonance: state.resonance + result.resonanceDelta,
    log: [
      ...state.log,
      `[${state.turn + 1}턴 · ${action === 'attack' ? '공격' : action === 'dialogue' ? '대화' : '도망'}] ${result.narration}`,
      `  ↳ ${result.enemyNarration}`,
    ],
  };

  // 결말 판정
  let outcome: CombatOutcome | null = null;
  if (action === 'flee') outcome = 'fled';
  else if (nextState.enemy.hp <= 0) outcome = 'victory';
  else if (nextState.player.hp <= 0) outcome = 'defeat';
  else if (nextState.turn >= TURN_LIMIT) outcome = 'stalemate';

  // 잔향가루 적립 — arcade victory (스토리 외) +20
  let dustEarned = 0;
  if (outcome === 'victory' && userId !== 'anonymous') {
    try {
      await earnResonanceDust(c.env.DB, userId, STORY_CONSTANTS.ARCADE_VICTORY_DUST);
      dustEarned = STORY_CONSTANTS.ARCADE_VICTORY_DUST;
    } catch {
      /* 적립 실패는 응답 막지 않음 */
    }
  }

  // LLM 사용량 로깅 (실 호출 시)
  if (model !== 'mock') {
    try {
      await logLLMUsage(c.env.DB, {
        userId,
        llmModel: model,
        inputTokens,
        outputTokens,
        costUsd,
        context: 'battle',
        isPremium: false,
      });
    } catch {
      // 로깅 실패는 응답 막지 않음
    }
  }

  return c.json({
    success: true,
    state: nextState,
    turnResult: result,
    outcome,
    isEnded: outcome !== null,
    stamina: stamSnapshot,
    dustEarned,
    meta: { model, input_tokens: inputTokens, output_tokens: outputTokens, cost_usd: costUsd },
  });
});

// validate state schema (E2E debug용)
combatRouter.post('/validate', async (c) => {
  const body = await c.req.json();
  const r = CombatStateSchema.safeParse(body);
  return c.json({ valid: r.success, errors: r.success ? null : r.error.message });
});

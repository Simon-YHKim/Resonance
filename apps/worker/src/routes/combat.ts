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
import { getCurrentUserId } from '../middleware/auth';
import { LLMError } from '../lib/nickname-analyzer';

export const combatRouter = new Hono<{ Bindings: Bindings }>();

const TURN_LIMIT = 5;

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

  if (state.turn >= TURN_LIMIT) {
    return c.json(
      { success: false, error: '5턴 한도 초과', code: 'TURN_LIMIT' },
      400,
    );
  }

  // Gemini 호출 (또는 mock)
  const useMock =
    !c.env.GEMINI_API_KEY || c.env.JANSAE_LLM_PRIMARY_MODEL === 'mock';

  let result;
  let model = 'mock';
  let inputTokens = 0;
  let outputTokens = 0;
  let costUsd = 0;

  try {
    if (useMock) {
      result = combatTurnMock(state, action);
    } else {
      result = await combatTurnWithGemini(
        state,
        action,
        userText,
        c.env.GEMINI_API_KEY!,
        { model: c.env.JANSAE_LLM_PRIMARY_MODEL },
      );
      // Gemini 호출 비용 — 대략 추정 (실 토큰은 별도 추적 X, 평균값)
      model = c.env.JANSAE_LLM_PRIMARY_MODEL ?? 'gemini-flash-lite-latest';
      inputTokens = 400;
      outputTokens = 200;
      costUsd = (400 * 0.1 + 200 * 0.4) / 1_000_000;
    }
  } catch (err) {
    if (c.env.JANSAE_LLM_FALLBACK_MODEL === 'mock') {
      result = combatTurnMock(state, action);
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
    meta: { model, input_tokens: inputTokens, output_tokens: outputTokens, cost_usd: costUsd },
  });
});

// validate state schema (E2E debug용)
combatRouter.post('/validate', async (c) => {
  const body = await c.req.json();
  const r = CombatStateSchema.safeParse(body);
  return c.json({ valid: r.success, errors: r.success ? null : r.error.message });
});

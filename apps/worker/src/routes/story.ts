/**
 * 스토리 모드 라우트 — Phase 2-5.
 *
 * 일반 combat 와 차이:
 *   - stamina X (사용자 §5)
 *   - story_chapter_N inventory 보유 검사 (별도 구매)
 *   - 5체 순차 (1→5), 보스 격파 시 자동 다음 보스
 *   - 잔잔(殘殘) 누적 이월 → 5체 격파 시 100 임계로 화해/재봉인 분기
 *   - 격파 시 잔향가루 자동 적립
 *
 * Refs: 2026-05-06 사용자 결정 §5
 */

import { Hono } from 'hono';
import {
  CombatTurnRequestSchema,
  type CombatOutcome,
} from '@resonance/shared';
import type { Bindings } from '../types/bindings';
import {
  combatTurnWithGemini,
  combatTurnMock,
} from '../lib/combat';
import { logLLMUsage } from '../lib/usage-logger';
import { getCurrentUserId, ensureUserExists } from '../middleware/auth';
import { LLMError, detectSafetyConcern } from '../lib/nickname-analyzer';
import { checkBudget, parseBudget } from '../lib/budget-guard';
import { getForgetter, STORY_CONSTANTS } from '../lib/forgetters';
import { earnResonanceDust } from './shop';
import {
  applyStrengthToEnemyDelta,
  applyDexterityToPlayerDelta,
  applyIntelligenceToResonance,
  maxHpFromVitality,
  maxStaminaFromEnergy,
  STATS_FALLBACK,
} from '../lib/stats';

export const storyRouter = new Hono<{ Bindings: Bindings }>();

const TURN_LIMIT = 5;
const CHAPTER_ITEM_PREFIX = 'story_chapter_';

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

interface StoryProgressRow {
  user_id: string;
  chapter: string;
  current_boss: number;
  cumulative_resonance: number;
  status: string;
}

async function getOrCreateProgress(
  db: D1Database,
  userId: string,
  chapter: string,
): Promise<StoryProgressRow> {
  const existing = await db
    .prepare(
      'SELECT user_id, chapter, current_boss, cumulative_resonance, status FROM story_progress WHERE user_id = ? AND chapter = ?',
    )
    .bind(userId, chapter)
    .first<StoryProgressRow>();
  if (existing) return existing;

  const now = Date.now();
  await db
    .prepare(
      `INSERT INTO story_progress (user_id, chapter, current_boss, cumulative_resonance, status, started_at, updated_at)
       VALUES (?, ?, 1, 0, 'in_progress', ?, ?)`,
    )
    .bind(userId, chapter, now, now)
    .run();
  return {
    user_id: userId,
    chapter,
    current_boss: 1,
    cumulative_resonance: 0,
    status: 'in_progress',
  };
}

async function hasChapter(
  db: D1Database,
  userId: string,
  chapter: string,
): Promise<boolean> {
  const itemId = CHAPTER_ITEM_PREFIX + chapter.replace(/^ch/, '');
  const row = await db
    .prepare('SELECT quantity FROM user_inventory WHERE user_id = ? AND item_id = ?')
    .bind(userId, itemId)
    .first<{ quantity: number }>();
  return (row?.quantity ?? 0) > 0;
}

storyRouter.get('/progress', async (c) => {
  const userId = getCurrentUserId(c);
  if (!userId) {
    return c.json({ success: false, error: '로그인이 필요합니다.', code: 'UNAUTHORIZED' }, 401);
  }
  const rows = await c.env.DB.prepare(
    'SELECT chapter, current_boss, cumulative_resonance, status, started_at, updated_at, completed_at FROM story_progress WHERE user_id = ? ORDER BY updated_at DESC',
  )
    .bind(userId)
    .all();
  return c.json({ success: true, progress: rows.results ?? [] });
});

storyRouter.post('/start', async (c) => {
  const userId = getCurrentUserId(c);
  if (!userId) {
    return c.json({ success: false, error: '로그인이 필요합니다.', code: 'UNAUTHORIZED' }, 401);
  }
  let body: { chapter?: unknown };
  try {
    body = await c.req.json();
  } catch {
    body = {};
  }
  const chapter = typeof body.chapter === 'string' && body.chapter.length > 0 ? body.chapter : 'ch1';

  await ensureUserExists(c.env.DB, userId);

  // 인벤토리 게이트 — 챕터 미보유 시 차단
  if (!(await hasChapter(c.env.DB, userId, chapter))) {
    return c.json(
      {
        success: false,
        error: '잔향이 — 아직 그 챕터를 듣지 않았어요. 상점에서 새겨주세요.',
        code: 'CHAPTER_LOCKED',
        chapter,
      },
      403,
    );
  }

  const progress = await getOrCreateProgress(c.env.DB, userId, chapter);
  const enemy = getForgetter(progress.current_boss);

  // 사용자 wiki 에서 스탯 추출
  let playerStats = STATS_FALLBACK;
  const wiki = await c.env.DB.prepare(
    'SELECT nickname_analysis_json FROM user_wiki WHERE user_id = ?',
  )
    .bind(userId)
    .first<{ nickname_analysis_json: string }>();
  if (wiki) {
    try {
      const analysis = JSON.parse(wiki.nickname_analysis_json);
      if (analysis.stats) playerStats = analysis.stats;
    } catch {
      /* default */
    }
  }
  const playerMaxHp = maxHpFromVitality(playerStats.vitality);
  const playerMaxStamina = maxStaminaFromEnergy(playerStats.energy);

  return c.json({
    success: true,
    chapter,
    chapterTitle: STORY_CONSTANTS.CHAPTERS[chapter as keyof typeof STORY_CONSTANTS.CHAPTERS] ?? chapter,
    progress,
    state: {
      player: {
        hp: playerMaxHp,
        maxHp: playerMaxHp,
        stamina: playerMaxStamina,
        maxStamina: playerMaxStamina,
        stats: playerStats,
      },
      enemy: { ...enemy },
      turn: 0,
      resonance: progress.cumulative_resonance,
      log: [],
    },
  });
});

storyRouter.post('/turn', async (c) => {
  const userId = getCurrentUserId(c);
  if (!userId) {
    return c.json({ success: false, error: '로그인이 필요합니다.', code: 'UNAUTHORIZED' }, 401);
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ success: false, error: 'JSON body 필요', code: 'INVALID_BODY' }, 400);
  }
  const baseParsed = CombatTurnRequestSchema.safeParse(body);
  if (!baseParsed.success) {
    return c.json(
      { success: false, error: '잘못된 요청', code: 'INVALID_BODY', detail: baseParsed.error.message },
      400,
    );
  }
  const { state, action, userText } = baseParsed.data;
  const chapter = (body as { chapter?: string }).chapter ?? 'ch1';

  // 자살 위험 입력 차단 (자살예방법 §27조의8 — 입력단)
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
    return c.json({ success: false, error: '5턴 한도 초과', code: 'TURN_LIMIT' }, 400);
  }

  await ensureUserExists(c.env.DB, userId);

  // 챕터 게이트
  if (!(await hasChapter(c.env.DB, userId, chapter))) {
    return c.json(
      { success: false, error: '챕터 미보유', code: 'CHAPTER_LOCKED', chapter },
      403,
    );
  }

  const progress = await getOrCreateProgress(c.env.DB, userId, chapter);
  if (progress.status !== 'in_progress') {
    return c.json(
      { success: false, error: `이 챕터는 이미 끝났습니다 (${progress.status}).`, code: 'CHAPTER_ENDED', progress },
      400,
    );
  }

  // budget cap (스테미나 X 지만 LLM 비용은 여전히 캡)
  const userBudget = parseBudget(c.env.USER_DAILY_BUDGET_USD, 0.1);
  const globalBudget = parseBudget(c.env.DAILY_BUDGET_USD, 1.0);
  const budget = await checkBudget(c.env.DB, userId, userBudget, globalBudget);

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
      costUsd = (inputTokens * 0.1 + outputTokens * 0.4) / 1_000_000;
    }
  } catch (err) {
    if (c.env.JANSAE_LLM_FALLBACK_MODEL === 'mock') {
      result = combatTurnMock(state, action, userText);
    } else {
      if (err instanceof LLMError) {
        return c.json({ success: false, error: err.message, code: 'LLM_ERROR' }, 500);
      }
      throw err;
    }
  }

  // 5 스탯 룰 적용
  const playerStats = state.player.stats ?? STATS_FALLBACK;
  const enemyStats = state.enemy.stats ?? STATS_FALLBACK;
  const adjustedEnemyDelta = applyStrengthToEnemyDelta(result.enemyHpDelta, playerStats.strength);
  const playerImpact = applyDexterityToPlayerDelta(result.playerHpDelta, playerStats, enemyStats);
  const adjustedResonanceDelta = applyIntelligenceToResonance(result.resonanceDelta, playerStats.intelligence);

  const statLog: string[] = [];
  if (playerImpact.dodged) statLog.push('  ↳ 너의 발이 한 박자 빨랐다 — 회피.');
  else if (playerImpact.preemptive) statLog.push('  ↳ 너의 결단이 한 박자 앞섰다 — 적의 호선이 흩어진다.');

  const nextState = {
    player: {
      ...state.player,
      hp: clamp(state.player.hp + playerImpact.delta, 0, state.player.maxHp),
    },
    enemy: {
      ...state.enemy,
      hp: clamp(state.enemy.hp + adjustedEnemyDelta, 0, state.enemy.maxHp),
    },
    turn: state.turn + 1,
    resonance: state.resonance + adjustedResonanceDelta,
    log: [
      ...state.log,
      `[${state.turn + 1}턴 · ${action === 'attack' ? '공격' : action === 'dialogue' ? '대화' : '도망'}] ${result.narration}`,
      `  ↳ ${result.enemyNarration}`,
      ...statLog,
    ],
  };

  // 단일 보스 outcome
  let bossOutcome: CombatOutcome | null = null;
  if (action === 'flee') bossOutcome = 'fled';
  else if (nextState.enemy.hp <= 0) bossOutcome = 'victory';
  else if (nextState.player.hp <= 0) bossOutcome = 'defeat';
  else if (nextState.turn >= TURN_LIMIT) bossOutcome = 'stalemate';

  let storyOutcome: 'in_progress' | 'reconciled' | 'resealed' | 'fled' | 'failed' = 'in_progress';
  let nextBoss = progress.current_boss;
  let cumulative = nextState.resonance;
  let dustEarned = 0;
  let nextEnemy = null;

  if (bossOutcome === 'victory') {
    if (progress.current_boss < 5) {
      // 다음 보스
      nextBoss = progress.current_boss + 1;
      nextEnemy = getForgetter(nextBoss);
      dustEarned = STORY_CONSTANTS.PER_BOSS_DUST;
    } else {
      // 5체 격파 — 잔잔 임계로 분기
      if (cumulative >= STORY_CONSTANTS.RECONCILE_THRESHOLD) {
        storyOutcome = 'reconciled';
        dustEarned = STORY_CONSTANTS.RECONCILE_DUST;
      } else {
        storyOutcome = 'resealed';
        dustEarned = STORY_CONSTANTS.RESEAL_DUST;
      }
    }
  } else if (bossOutcome === 'defeat') {
    storyOutcome = 'failed';
    nextBoss = 1; // 다시 1체부터
    cumulative = 0; // 누적 리셋
  } else if (bossOutcome === 'fled') {
    storyOutcome = 'fled';
  }

  // DB 갱신
  const now = Date.now();
  if (storyOutcome === 'in_progress') {
    await c.env.DB.prepare(
      'UPDATE story_progress SET current_boss = ?, cumulative_resonance = ?, updated_at = ? WHERE user_id = ? AND chapter = ?',
    )
      .bind(nextBoss, cumulative, now, userId, chapter)
      .run();
  } else {
    await c.env.DB.prepare(
      `UPDATE story_progress
       SET current_boss = ?, cumulative_resonance = ?, status = ?, updated_at = ?, completed_at = ?
       WHERE user_id = ? AND chapter = ?`,
    )
      .bind(nextBoss, cumulative, storyOutcome, now, now, userId, chapter)
      .run();
  }

  // 잔향가루 적립
  if (dustEarned > 0) {
    await earnResonanceDust(c.env.DB, userId, dustEarned);
  }

  // LLM 사용량 로깅
  if (model !== 'mock') {
    try {
      await logLLMUsage(c.env.DB, {
        userId,
        llmModel: model,
        inputTokens,
        outputTokens,
        costUsd,
        context: 'story',
        isPremium: false,
      });
    } catch {
      /* 로깅 실패는 응답 막지 않음 */
    }
  }

  return c.json({
    success: true,
    state: nextState,
    turnResult: result,
    bossOutcome,
    storyOutcome,
    progress: {
      chapter,
      current_boss: nextBoss,
      cumulative_resonance: cumulative,
      status: storyOutcome,
    },
    dustEarned,
    nextEnemy: nextEnemy
      ? {
          ...nextEnemy,
          // 다음 보스 자동 진입 — state 초기화 (HP 풀, turn 0, resonance 이월)
          starterState: {
            player: {
              hp: maxHpFromVitality(playerStats.vitality),
              maxHp: maxHpFromVitality(playerStats.vitality),
              stamina: maxStaminaFromEnergy(playerStats.energy),
              maxStamina: maxStaminaFromEnergy(playerStats.energy),
              stats: playerStats,
            },
            enemy: { ...nextEnemy },
            turn: 0,
            resonance: cumulative,
            log: nextState.log,
          },
        }
      : null,
    isEnded: storyOutcome !== 'in_progress',
    meta: { model, input_tokens: inputTokens, output_tokens: outputTokens, cost_usd: costUsd },
  });
});

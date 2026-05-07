/**
 * paid-api-guard — 일일 LLM 비용 캡.
 *
 * 두 단계 보호:
 *   1. 사용자별 24h 누적 비용 < USER_DAILY_BUDGET_USD
 *   2. 전 시스템 24h 누적 비용 < DAILY_BUDGET_USD (운영 안전판)
 *
 * 초과 시 useMock=true 강제 — 응답은 계속 가지만 mock fallback.
 * 사용자에게 "오늘 잔향이 잦아드는 시간" 메시지 노출.
 *
 * Refs: 잔향_v1.0.md §5 / 30일 sprint Week 2
 */
import { getUserDailyTokens } from './usage-logger';

export interface BudgetCheckResult {
  withinBudget: boolean;
  userCostUsd: number;
  userBudgetUsd: number;
  globalCostUsd: number;
  globalBudgetUsd: number;
  reason?: 'user_cap' | 'global_cap';
}

const DAY_MS = 24 * 60 * 60 * 1000;

async function getGlobalDailyCost(db: D1Database): Promise<number> {
  const fromMs = Date.now() - DAY_MS;
  const row = await db
    .prepare(
      `SELECT COALESCE(SUM(cost_usd), 0) AS cost_usd
       FROM llm_usage_log
       WHERE timestamp >= ?`,
    )
    .bind(fromMs)
    .first<{ cost_usd: number }>();
  return row?.cost_usd ?? 0;
}

export async function checkBudget(
  db: D1Database,
  userId: string,
  userBudgetUsd: number,
  globalBudgetUsd: number,
): Promise<BudgetCheckResult> {
  const [user, globalCost] = await Promise.all([
    getUserDailyTokens(db, userId),
    getGlobalDailyCost(db),
  ]);

  if (user.costUsd >= userBudgetUsd) {
    return {
      withinBudget: false,
      userCostUsd: user.costUsd,
      userBudgetUsd,
      globalCostUsd: globalCost,
      globalBudgetUsd,
      reason: 'user_cap',
    };
  }
  if (globalCost >= globalBudgetUsd) {
    return {
      withinBudget: false,
      userCostUsd: user.costUsd,
      userBudgetUsd,
      globalCostUsd: globalCost,
      globalBudgetUsd,
      reason: 'global_cap',
    };
  }
  return {
    withinBudget: true,
    userCostUsd: user.costUsd,
    userBudgetUsd,
    globalCostUsd: globalCost,
    globalBudgetUsd,
  };
}

export function parseBudget(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

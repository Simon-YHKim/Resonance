/**
 * 스테미나 시스템 — Phase 2 BM 핵심.
 *
 * LLM 회사식 일일 사용량 캡:
 *   - max_daily=100 일일 한도
 *   - KST 자정 (UTC 15:00) 기준 reset
 *   - 상점 포션으로 current 증가 (max_daily 초과 가능)
 *
 * 차감 비용 (사용자 결정 §5):
 *   - analyze       : 5
 *   - reroll        : 5
 *   - combat turn   : 1
 *   - story mode    : 0 (별도 구매)
 *
 * Refs: 2026-05-06 사용자 결정
 */

export const STAMINA_COST = {
  analyze: 5,
  reroll: 5,
  combat_turn: 1,
  story: 0,
} as const;

export type StaminaContext = keyof typeof STAMINA_COST;

export interface StaminaState {
  current: number;
  max_daily: number;
  willResetAtMs: number;
}

export interface StaminaConsumeResult {
  allowed: boolean;
  current: number;
  max_daily: number;
  willResetAtMs: number;
  cost: number;
}

const KST_OFFSET_MS = 9 * 60 * 60 * 1000; // KST = UTC+9

/** 다음 KST 자정 (UTC ms) — reset 시점 */
export function nextKstMidnightMs(nowMs: number = Date.now()): number {
  const kstNow = nowMs + KST_OFFSET_MS;
  const kstDayStart = Math.floor(kstNow / 86_400_000) * 86_400_000;
  const kstNextMidnight = kstDayStart + 86_400_000;
  return kstNextMidnight - KST_OFFSET_MS;
}

/** 마지막 reset 시점 이후 KST 자정이 지났는지 */
function shouldReset(lastResetAtMs: number, nowMs: number = Date.now()): boolean {
  const lastKstDay = Math.floor((lastResetAtMs + KST_OFFSET_MS) / 86_400_000);
  const nowKstDay = Math.floor((nowMs + KST_OFFSET_MS) / 86_400_000);
  return nowKstDay > lastKstDay;
}

/**
 * 스테미나 조회 + 필요 시 자동 reset.
 * 신규 사용자 (행 없음) = 100 max 로 초기화.
 */
export async function getStamina(
  db: D1Database,
  userId: string,
): Promise<StaminaState> {
  const now = Date.now();
  const row = await db
    .prepare('SELECT current, max_daily, last_reset_at FROM user_stamina WHERE user_id = ?')
    .bind(userId)
    .first<{ current: number; max_daily: number; last_reset_at: number }>();

  if (!row) {
    // 신규 사용자 — 행 생성 (max_daily=100)
    await db
      .prepare(
        `INSERT INTO user_stamina (user_id, current, max_daily, last_reset_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .bind(userId, 100, 100, now, now, now)
      .run();
    return { current: 100, max_daily: 100, willResetAtMs: nextKstMidnightMs(now) };
  }

  if (shouldReset(row.last_reset_at, now)) {
    await db
      .prepare(
        `UPDATE user_stamina SET current = max_daily, last_reset_at = ?, updated_at = ?
         WHERE user_id = ?`,
      )
      .bind(now, now, userId)
      .run();
    return {
      current: row.max_daily,
      max_daily: row.max_daily,
      willResetAtMs: nextKstMidnightMs(now),
    };
  }

  return {
    current: row.current,
    max_daily: row.max_daily,
    willResetAtMs: nextKstMidnightMs(now),
  };
}

/**
 * 스테미나 차감 — 부족하면 allowed=false (차감 X).
 * 비용 0 (story mode) 은 항상 allowed=true.
 */
export async function consumeStamina(
  db: D1Database,
  userId: string,
  context: StaminaContext,
): Promise<StaminaConsumeResult> {
  const cost = STAMINA_COST[context];
  const state = await getStamina(db, userId);

  if (cost === 0) {
    return {
      allowed: true,
      current: state.current,
      max_daily: state.max_daily,
      willResetAtMs: state.willResetAtMs,
      cost: 0,
    };
  }

  if (state.current < cost) {
    return {
      allowed: false,
      current: state.current,
      max_daily: state.max_daily,
      willResetAtMs: state.willResetAtMs,
      cost,
    };
  }

  const now = Date.now();
  await db
    .prepare(
      `UPDATE user_stamina
       SET current = current - ?, total_consumed = total_consumed + ?, updated_at = ?
       WHERE user_id = ? AND current >= ?`,
    )
    .bind(cost, cost, now, userId, cost)
    .run();

  return {
    allowed: true,
    current: state.current - cost,
    max_daily: state.max_daily,
    willResetAtMs: state.willResetAtMs,
    cost,
  };
}

/** 상점 포션 구매 — current 증가 (max_daily 초과 가능) */
export async function addStamina(
  db: D1Database,
  userId: string,
  amount: number,
): Promise<StaminaState> {
  if (amount <= 0) throw new Error('amount must be > 0');
  // 신규 사용자도 행 보장
  await getStamina(db, userId);
  const now = Date.now();
  await db
    .prepare(
      `UPDATE user_stamina
       SET current = current + ?, total_purchased = total_purchased + ?, updated_at = ?
       WHERE user_id = ?`,
    )
    .bind(amount, amount, now, userId)
    .run();
  return await getStamina(db, userId);
}

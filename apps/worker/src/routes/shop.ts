/**
 * 상점 라우트 — Phase 2 BM.
 *
 * GET  /api/shop/items         — 활성 카탈로그
 * GET  /api/shop/inventory     — 내 인벤토리 + 잔향가루 잔액
 * POST /api/shop/purchase      — 잔향가루(resonance_dust) 구매 (즉시 결제)
 *                                 free 카테고리도 처리 (가격 0)
 *                                 krw 결제는 Phase 2-6 (Toss) — 현재 차단
 *
 * Refs: 2026-05-06 사용자 결정 §5
 */

import { Hono } from 'hono';
import type { Bindings } from '../types/bindings';
import { getCurrentUserId, ensureUserExists } from '../middleware/auth';
import { addStamina } from '../lib/stamina';

export const shopRouter = new Hono<{ Bindings: Bindings }>();

interface ShopItem {
  item_id: string;
  display_name: string;
  description: string;
  category: string;
  currency: string;
  price: number;
  effect_json: string;
  active: number;
  sort_order: number;
}

shopRouter.get('/items', async (c) => {
  const rows = await c.env.DB.prepare(
    `SELECT item_id, display_name, description, category, currency, price, effect_json, sort_order
     FROM shop_items WHERE active = 1 ORDER BY sort_order ASC`,
  ).all<Omit<ShopItem, 'active'>>();
  const items = (rows.results ?? []).map((r) => ({
    item_id: r.item_id,
    display_name: r.display_name,
    description: r.description,
    category: r.category,
    currency: r.currency,
    price: r.price,
    effect: JSON.parse(r.effect_json),
  }));
  return c.json({ success: true, items });
});

shopRouter.get('/inventory', async (c) => {
  const userId = getCurrentUserId(c);
  if (!userId) {
    return c.json({ success: false, error: '로그인이 필요합니다.', code: 'UNAUTHORIZED' }, 401);
  }
  await ensureUserExists(c.env.DB, userId);

  const inv = await c.env.DB.prepare(
    `SELECT i.item_id, i.quantity, s.display_name, s.category, s.effect_json
     FROM user_inventory i JOIN shop_items s ON s.item_id = i.item_id
     WHERE i.user_id = ? AND i.quantity > 0
     ORDER BY i.updated_at DESC`,
  )
    .bind(userId)
    .all<{ item_id: string; quantity: number; display_name: string; category: string; effect_json: string }>();

  const dust = await c.env.DB.prepare(
    'SELECT resonance_dust FROM user_currency WHERE user_id = ?',
  )
    .bind(userId)
    .first<{ resonance_dust: number }>();

  return c.json({
    success: true,
    resonance_dust: dust?.resonance_dust ?? 0,
    items: (inv.results ?? []).map((r) => ({
      item_id: r.item_id,
      quantity: r.quantity,
      display_name: r.display_name,
      category: r.category,
      effect: JSON.parse(r.effect_json),
    })),
  });
});

shopRouter.post('/purchase', async (c) => {
  const userId = getCurrentUserId(c);
  if (!userId) {
    return c.json({ success: false, error: '로그인이 필요합니다.', code: 'UNAUTHORIZED' }, 401);
  }
  let body: { item_id?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ success: false, error: 'JSON body 필요', code: 'INVALID_BODY' }, 400);
  }
  if (typeof body.item_id !== 'string') {
    return c.json({ success: false, error: 'item_id 필요', code: 'INVALID_BODY' }, 400);
  }
  await ensureUserExists(c.env.DB, userId);

  const item = await c.env.DB.prepare(
    `SELECT item_id, display_name, category, currency, price, effect_json
     FROM shop_items WHERE item_id = ? AND active = 1`,
  )
    .bind(body.item_id)
    .first<{ item_id: string; display_name: string; category: string; currency: string; price: number; effect_json: string }>();

  if (!item) {
    return c.json({ success: false, error: '아이템을 찾을 수 없습니다.', code: 'ITEM_NOT_FOUND' }, 404);
  }

  const now = Date.now();
  const effect = JSON.parse(item.effect_json) as Record<string, unknown>;

  if (item.currency === 'krw') {
    return c.json(
      {
        success: false,
        error: '실 결제는 곧 열립니다. (Toss 통합 준비 중)',
        code: 'KRW_PAYMENT_NOT_AVAILABLE',
      },
      503,
    );
  }

  if (item.currency === 'resonance_dust') {
    // 잔액 확인
    const dustRow = await c.env.DB.prepare(
      'SELECT resonance_dust FROM user_currency WHERE user_id = ?',
    )
      .bind(userId)
      .first<{ resonance_dust: number }>();
    const have = dustRow?.resonance_dust ?? 0;
    if (have < item.price) {
      return c.json(
        {
          success: false,
          error: `잔향가루가 부족합니다. (${have}/${item.price})`,
          code: 'INSUFFICIENT_DUST',
          have,
          need: item.price,
        },
        402,
      );
    }
    // 차감 (UPSERT 패턴)
    if (dustRow) {
      await c.env.DB.prepare(
        `UPDATE user_currency
         SET resonance_dust = resonance_dust - ?, total_spent = total_spent + ?, updated_at = ?
         WHERE user_id = ? AND resonance_dust >= ?`,
      )
        .bind(item.price, item.price, now, userId, item.price)
        .run();
    } else {
      // 행 없음 = have=0 = 위에서 거절됐어야 함. 안전 가드.
      return c.json({ success: false, error: '잔향가루 잔액 없음', code: 'INSUFFICIENT_DUST' }, 402);
    }
  }

  // 효과 적용
  if (item.category === 'stamina_potion' && typeof effect.stamina === 'number') {
    await addStamina(c.env.DB, userId, effect.stamina);
  } else {
    // 인벤토리 추가 (cosmetic / reroll_token / story_chapter / code_slot)
    await c.env.DB.prepare(
      `INSERT INTO user_inventory (user_id, item_id, quantity, acquired_at, updated_at)
       VALUES (?, ?, 1, ?, ?)
       ON CONFLICT(user_id, item_id) DO UPDATE SET
         quantity = quantity + 1,
         updated_at = excluded.updated_at`,
    )
      .bind(userId, item.item_id, now, now)
      .run();
  }

  // 구매 로그
  await c.env.DB.prepare(
    `INSERT INTO purchase_log (user_id, item_id, currency, price, quantity, status, timestamp)
     VALUES (?, ?, ?, ?, 1, 'confirmed', ?)`,
  )
    .bind(userId, item.item_id, item.currency, item.price, now)
    .run();

  return c.json({
    success: true,
    item: { item_id: item.item_id, display_name: item.display_name, effect },
  });
});

/** 잔향가루 적립 (잔잔 누적·결말 보상 — 내부 유틸) */
export async function earnResonanceDust(
  db: D1Database,
  userId: string,
  amount: number,
): Promise<void> {
  if (amount <= 0) return;
  const now = Date.now();
  const exists = await db
    .prepare('SELECT user_id FROM user_currency WHERE user_id = ?')
    .bind(userId)
    .first();
  if (exists) {
    await db
      .prepare(
        `UPDATE user_currency
         SET resonance_dust = resonance_dust + ?, total_earned = total_earned + ?, updated_at = ?
         WHERE user_id = ?`,
      )
      .bind(amount, amount, now, userId)
      .run();
  } else {
    await db
      .prepare(
        `INSERT INTO user_currency (user_id, resonance_dust, total_earned, total_spent, updated_at)
         VALUES (?, ?, ?, 0, ?)`,
      )
      .bind(userId, amount, amount, now)
      .run();
  }
}

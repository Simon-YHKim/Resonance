-- 0011_shop.sql — 상점 시스템 (Phase 2 BM 핵심)
--
-- 카탈로그(shop_items) + 인벤토리(user_inventory) + 구매 로그(purchase_log).
--
-- 화폐 (Phase 2):
--   - stamina (스테미나) — 게임 내 소비 자원 (포션으로 충전)
--   - resonance_dust (잔향가루) — 누적 잔잔(殘殘) 보상 + 광고 시청 적립 (광고는 추후, 현재는 적립만)
--   - krw — 실 결제 (Toss 우선, Phase 2-6)
--
-- Refs: 2026-05-06 사용자 결정 §5

CREATE TABLE IF NOT EXISTS shop_items (
  item_id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  description TEXT NOT NULL,
  -- 'stamina_potion' | 'cosmetic' | 'code_slot' | 'reroll_token' | 'story_chapter'
  category TEXT NOT NULL,
  -- 'krw' | 'resonance_dust' | 'free'
  currency TEXT NOT NULL,
  price INTEGER NOT NULL CHECK (price >= 0),
  -- 효과 메타 (JSON) — 예: {"stamina":30} / {"reroll":1} / {"chapter":"ch1"}
  effect_json TEXT NOT NULL,
  -- 0 = 비활성, 1 = 활성
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_shop_active ON shop_items(active, sort_order);

CREATE TABLE IF NOT EXISTS user_inventory (
  user_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  acquired_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, item_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES shop_items(item_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_inventory_user ON user_inventory(user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS purchase_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  currency TEXT NOT NULL,
  price INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  -- 'pending' | 'confirmed' | 'failed' | 'refunded'
  status TEXT NOT NULL DEFAULT 'confirmed',
  external_payment_id TEXT,
  timestamp INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_purchase_user ON purchase_log(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_purchase_status ON purchase_log(status, timestamp DESC);

-- 사용자별 잔향가루 (Phase 2 — 게임 내 적립 화폐)
CREATE TABLE IF NOT EXISTS user_currency (
  user_id TEXT PRIMARY KEY,
  resonance_dust INTEGER NOT NULL DEFAULT 0 CHECK (resonance_dust >= 0),
  total_earned INTEGER NOT NULL DEFAULT 0,
  total_spent INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 시드 데이터 — Phase 2 초기 카탈로그 (사용자 결정 §5 기반)
INSERT OR IGNORE INTO shop_items (item_id, display_name, description, category, currency, price, effect_json, active, sort_order, created_at) VALUES
  -- 스테미나 포션 (잔향가루로 구매 — 광고 또는 잔잔 누적으로 적립)
  ('stamina_potion_30', '잔향 한 모금', '잔향이 30 회복된다.', 'stamina_potion', 'resonance_dust', 30, '{"stamina":30}', 1, 10, strftime('%s','now')*1000),
  ('stamina_potion_100', '잔향 한 잔', '잔향이 100 회복된다.', 'stamina_potion', 'resonance_dust', 90, '{"stamina":100}', 1, 11, strftime('%s','now')*1000),
  ('stamina_potion_300', '잔향 한 항아리', '잔향이 300 회복된다 (max 초과).', 'stamina_potion', 'krw', 4900, '{"stamina":300}', 1, 12, strftime('%s','now')*1000),
  -- 잔향 코드 슬롯 (친구 공유용)
  ('code_slot_extra', '잔향 코드 슬롯', '여분 코드 슬롯 1개 (Phase 3 다중 캐릭터).', 'code_slot', 'krw', 2900, '{"slots":1}', 1, 20, strftime('%s','now')*1000),
  -- 닉네임 재분석 토큰 (reroll 5 비용 면제)
  ('reroll_token_3', '잔향이 다시 듣기 — 3회', '재분석 시 스테미나 차감 면제 3회.', 'reroll_token', 'resonance_dust', 50, '{"reroll":3}', 1, 30, strftime('%s','now')*1000),
  -- 외형 (cosmetic) — Phase 3 본격, 우선 placeholder 5종
  ('cosmetic_grey', '잿빛 외투', '캐릭터 외형 — 기본 잿빛.', 'cosmetic', 'free', 0, '{"skin":"grey"}', 1, 100, strftime('%s','now')*1000),
  ('cosmetic_fog', '안개 자락', '캐릭터 외형 — 안개 결.', 'cosmetic', 'resonance_dust', 100, '{"skin":"fog"}', 1, 101, strftime('%s','now')*1000),
  -- 스토리 모드 (별도 구매)
  -- 임시: 잔향가루 100 (Toss 통합 후 KRW 4900 으로 전환 예정)
  ('story_chapter_1', '스토리 1장 — 남겨진 이들', '스토리 모드 1장 (스테미나 X, 5체 보스 + 잔잔 누적, 평생 소장).', 'story_chapter', 'resonance_dust', 100, '{"chapter":"ch1"}', 1, 200, strftime('%s','now')*1000);

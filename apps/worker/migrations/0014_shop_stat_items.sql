-- 0014_shop_stat_items.sql — Phase 2-5+
--
-- 스탯 부스터 5종 (영구 +1) + HP 회복 + cosmetic stat 보너스 갱신.
--
-- effect_json 형식:
--   stat_boost: { "stat": "strength" | ..., "amount": 1 } — wiki.stats 영구 +1
--   stat_bonus: { stat: amount } — cosmetic 보유 시 *동안* 보너스 (영구 X)
--   recovery: { "hp": 30 } 또는 { "stamina": 30 } — 즉시 회복

-- 영구 스탯 부스터 5종 (잔향가루 결제)
INSERT OR IGNORE INTO shop_items (item_id, display_name, description, category, currency, price, effect_json, active, sort_order, created_at) VALUES
  ('stat_str_lift', '결단이 깊어진다', '힘 +1 영구. 너의 손이 한 결 더 단호해진다.', 'stat_boost', 'resonance_dust', 80, '{"stat":"strength","amount":1}', 1, 50, strftime('%s','now')*1000),
  ('stat_dex_lift', '발이 가벼워진다', '민첩 +1 영구. 한 박자 더 빨리 거리에 닿는다.', 'stat_boost', 'resonance_dust', 80, '{"stat":"dexterity","amount":1}', 1, 51, strftime('%s','now')*1000),
  ('stat_int_lift', '사유가 깊어진다', '지능 +1 영구. 잔잔이 한 결 더 깊게 닿는다.', 'stat_boost', 'resonance_dust', 80, '{"stat":"intelligence","amount":1}', 1, 52, strftime('%s','now')*1000),
  ('stat_energy_lift', '호흡이 길어진다', '에너지 +1 영구. 거리가 한 결 더 멀리 늘어난다.', 'stat_boost', 'resonance_dust', 80, '{"stat":"energy","amount":1}', 1, 53, strftime('%s','now')*1000),
  ('stat_vit_lift', '온기가 깊어진다', '체력 +1 영구. 너의 결이 한 박자 더 견딘다.', 'stat_boost', 'resonance_dust', 80, '{"stat":"vitality","amount":1}', 1, 54, strftime('%s','now')*1000);

-- HP 회복 (체력 멀티 보너스 — runtime 적용)
INSERT OR IGNORE INTO shop_items (item_id, display_name, description, category, currency, price, effect_json, active, sort_order, created_at) VALUES
  ('recovery_hp_30', '거리의 한 잔', 'HP 30 회복 (체력 보너스 적용). 다음 전투 시작 전 HP가 차오른다.', 'recovery', 'resonance_dust', 30, '{"hp":30}', 1, 60, strftime('%s','now')*1000);

-- cosmetic stat 보너스 갱신 (외형 + 약한 보너스)
UPDATE shop_items
   SET effect_json = '{"skin":"grey","stat_bonus":{"vitality":1}}',
       description = '캐릭터 외형 — 기본 잿빛. 체력 +1 (장비 보유 시).'
 WHERE item_id = 'cosmetic_grey';

UPDATE shop_items
   SET effect_json = '{"skin":"fog","stat_bonus":{"dexterity":1,"intelligence":1}}',
       description = '캐릭터 외형 — 안개 결. 민첩 +1 · 지능 +1 (장비 보유 시).'
 WHERE item_id = 'cosmetic_fog';

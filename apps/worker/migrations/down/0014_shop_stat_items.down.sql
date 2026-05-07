DELETE FROM shop_items WHERE item_id LIKE 'stat_%_lift' OR item_id = 'recovery_hp_30';
UPDATE shop_items SET effect_json = '{"skin":"grey"}', description = '캐릭터 외형 — 기본 잿빛.' WHERE item_id = 'cosmetic_grey';
UPDATE shop_items SET effect_json = '{"skin":"fog"}', description = '캐릭터 외형 — 안개 결.' WHERE item_id = 'cosmetic_fog';

-- 0013_story_chapter_dust_pricing.sql — 스토리 챕터 임시 가격 (Phase 2-5)
--
-- Toss 결제 통합 (Phase 2-6) 전까지는 잔향가루 100 으로 임시 활성화.
-- 사용자가 잔잔/victory 누적으로 잔향가루 모아 1장 구매 가능.
-- Toss 활성 시 다시 KRW 4900 으로 격상.

UPDATE shop_items
   SET currency = 'resonance_dust',
       price = 100,
       display_name = '스토리 1장 — 남겨진 이들',
       description = '스토리 모드 1장 (스테미나 X, 5체 보스 + 잔잔 누적, 평생 소장).'
 WHERE item_id = 'story_chapter_1';

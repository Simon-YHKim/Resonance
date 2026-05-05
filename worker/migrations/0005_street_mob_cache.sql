-- 0005_street_mob_cache.sql — 헥스별 LLM 생성 몹 캐시
--
-- hex_id + time_slot + weather 단위로 최대 5변주 캐싱.
-- 6번째 호출부터 새 변주 생성. Lazy generation (헥스 진입 시에만).
--
-- 비용 절감: 활성 헥스만 생성. 5만 헥스 × 6시간대 × 3날씨 × 5변주 풀 사전 X.
--
-- Refs: 잔향_시스템명세_v1.4.md §3.2

CREATE TABLE IF NOT EXISTS street_mob_cache (
  -- "{hex_id}_{time_slot}_{weather}"
  -- time_slot ∈ {commute, lunch, afternoon, evening, night, dawn}
  -- weather ∈ {clear, rain, snow}
  cache_key TEXT PRIMARY KEY,

  hex_id TEXT NOT NULL,
  time_slot TEXT NOT NULL CHECK (time_slot IN ('commute', 'lunch', 'afternoon', 'evening', 'night', 'dawn')),
  weather TEXT NOT NULL CHECK (weather IN ('clear', 'rain', 'snow')),

  -- JSON array of 5 변주
  -- [{name, category, appearance, appear_dialogue, defeat_dialogue_voice, modaem_text, childhood_memory, hp, atk, stamina_cost, drop_items}]
  variants_json TEXT NOT NULL,

  generated_at INTEGER NOT NULL,
  use_count INTEGER NOT NULL DEFAULT 0 CHECK (use_count >= 0),
  last_used_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_mob_cache_hex ON street_mob_cache(hex_id);
CREATE INDEX IF NOT EXISTS idx_mob_cache_lru ON street_mob_cache(last_used_at);

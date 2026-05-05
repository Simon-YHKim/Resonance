-- 0006_hex_metadata.sql — H3 헥스 인구밀도·신호 강도
--
-- KOSIS 시군구 인구밀도 → H3 Resolution 9 매핑 (Phase 1 수동, Phase 2 자동).
-- 활성도 룰:
--   ≥1만/km²: 5분당 3체   (강남·종로)
--   1천~1만/km²: 5분당 1체  (일반 도시)
--   100~1천/km²: 10분당 1체 (외곽)
--   <100/km²: 30분당 1체   (시골·산악, 하한)
--
-- Refs: 잔향_시스템명세_v1.4.md §4.1

CREATE TABLE IF NOT EXISTS hex_metadata (
  hex_id TEXT PRIMARY KEY,

  -- 명/km²
  population_density INTEGER NOT NULL CHECK (population_density >= 0),

  -- 5분 = 5
  base_mob_frequency_minutes INTEGER NOT NULL CHECK (base_mob_frequency_minutes > 0),

  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),

  -- dBm 평균 (모니터링). NULL 허용 (미측정)
  signal_strength_avg INTEGER,

  -- 헥스 라벨 ("강남역", "종로 학원가" 같은 사람용)
  display_name TEXT,

  -- 헥스별 고유 해시태그 풀 ["#강남" "#출퇴근"]
  hashtags_json TEXT,

  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_hex_active ON hex_metadata(is_active, population_density DESC);

-- 0002_user_modaem_collection.sql — 모남 조각 영구 컬렉션
--
-- 길거리 몹·보스·미니이벤트 처치 시 획득. 어린 추억 LLM 생성.
-- 5체 보스마다 모남 조각 (대) 1개, 길거리 몹마다 모남 조각 (소) 1개.
--
-- Refs: 잔향_시스템명세_v1.4.md §1.1.1

CREATE TABLE IF NOT EXISTS user_modaem_collection (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,

  -- "오늘 못한 한 마디의 한 조각" 같은 텍스트
  modaem_text TEXT NOT NULL,

  -- 11카테고리 중 하나 또는 새 카테고리 (열린 생태계)
  category TEXT NOT NULL,

  -- 'small' (길거리 몹) | 'large' (보스)
  size TEXT NOT NULL CHECK (size IN ('small', 'large')),

  -- 'street_mob' | 'boss' | 'mini_event'
  source_type TEXT NOT NULL CHECK (source_type IN ('street_mob', 'boss', 'mini_event')),

  -- 처치한 몹·보스 ID (옵션)
  source_id TEXT,

  acquired_at INTEGER NOT NULL,

  -- v1.3 14번 — 어린 추억 LLM 생성
  childhood_memory TEXT,

  -- H3 hex_id (Resolution 9)
  hex_id TEXT,

  -- 획득 당시 컨텍스트 (시간·날씨·트렌드 키워드)
  context_snapshot_json TEXT,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_modaem_user_category ON user_modaem_collection(user_id, category);
CREATE INDEX IF NOT EXISTS idx_modaem_user_acquired ON user_modaem_collection(user_id, acquired_at DESC);
CREATE INDEX IF NOT EXISTS idx_modaem_size ON user_modaem_collection(user_id, size);

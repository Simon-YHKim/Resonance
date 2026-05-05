-- 0004_user_macro.sql — WoW식 매크로 등록
--
-- the Named가 자기만의 전투 페르소나를 빌드.
-- 1만 사용자 = 1만 매크로 라이브러리. 진짜 1인 1게임.
--
-- 매크로 이름은 슬래시 포함 ("/황당발언") 한글·영문·숫자 최대 10자.
--
-- Refs: 잔향_시스템명세_v1.4.md §1.1.3, §1.3

CREATE TABLE IF NOT EXISTS user_macro (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,

  -- "/황당발언" 형식. 슬래시 포함, 최대 11자 (/+10자).
  macro_name TEXT NOT NULL CHECK (length(macro_name) BETWEEN 2 AND 11),

  -- 등록된 프롬프트 템플릿 (최대 200자 — 시스템 명세 v1.4 §1.3.1)
  prompt_template TEXT NOT NULL CHECK (length(prompt_template) BETWEEN 1 AND 200),

  -- 사용하는 모남 카테고리 리스트 ["lunch", "overtime"]
  used_categories_json TEXT,

  use_count INTEGER NOT NULL DEFAULT 0 CHECK (use_count >= 0),
  created_at INTEGER NOT NULL,
  last_used_at INTEGER,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (user_id, macro_name)
);

CREATE INDEX IF NOT EXISTS idx_macro_user_use ON user_macro(user_id, use_count DESC);

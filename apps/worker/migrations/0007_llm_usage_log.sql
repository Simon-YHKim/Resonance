-- 0007_llm_usage_log.sql — LLM 토큰 사용량 측정
--
-- 모든 LLM 호출 시 input·output 토큰 + 비용 자동 기록.
-- 스테미나 포션 가격 알고리즘 (시스템 명세 v1.4 §4.3) 입력 데이터.
--
-- 무료 vs 프리미엄 토큰 평균 비교 → 가격 조정 트리거.
--
-- Refs: 잔향_시스템명세_v1.4.md §4.2

CREATE TABLE IF NOT EXISTS llm_usage_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,

  -- 'haiku-4.5' | 'sonnet-4.6' | 'flash-lite' | 'nano-banana-pro' | 'mock'
  llm_model TEXT NOT NULL,

  input_tokens INTEGER NOT NULL CHECK (input_tokens >= 0),
  output_tokens INTEGER NOT NULL CHECK (output_tokens >= 0),
  cost_usd REAL NOT NULL CHECK (cost_usd >= 0),

  -- 'battle' | 'story' | 'character_gen' | 'ending' | 'macro' | 'mob_gen'
  context TEXT NOT NULL,

  is_premium INTEGER NOT NULL DEFAULT 0 CHECK (is_premium IN (0, 1)),

  -- ms (UTC)
  timestamp INTEGER NOT NULL,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_usage_user_date ON llm_usage_log(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_usage_context ON llm_usage_log(context, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_usage_premium ON llm_usage_log(is_premium, timestamp DESC);

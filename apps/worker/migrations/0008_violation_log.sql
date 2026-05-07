-- 0008_violation_log.sql — 안전 위반 로그
--
-- 미성년자 NPC에게 부적절한 입력 / 자해 표현 / 개인정보 요구 등.
-- LLM 사전 분류 (Flash-Lite, ~50 토큰)로 감지.
-- 누적 룰:
--   1회: 경고 + 스테미나 5
--   2회 (24h): 경고 + 스테미나 30 + 5분 입력 제한
--   3회 (24h): 경고 + 1시간 일시 정지
--   5회 (7d): Anthropic AUP 검토 + 계정 제재
--
-- 자해·자살 표현은 *특별 처리* — 따뜻한 톤 팝업 + 1393 안내, 스테미나 소모 X.
--
-- Refs: 잔향_시스템명세_v1.4.md §5.1, §5.2

CREATE TABLE IF NOT EXISTS violation_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,

  -- 'sexual_minor' | 'violent_minor' | 'self_harm' | 'privacy' | 'other'
  violation_type TEXT NOT NULL CHECK (violation_type IN ('sexual_minor', 'violent_minor', 'self_harm', 'privacy', 'other')),

  -- 'low' | 'medium' | 'high'
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),

  -- 차단된 입력 (개인정보 검토용 — Phase 2+ PII 마스킹)
  input_text TEXT,

  timestamp INTEGER NOT NULL,

  -- 'warning' | 'stamina_loss' | 'input_block' | 'session_pause' | 'account_review' | 'safe_message'
  action_taken TEXT NOT NULL CHECK (action_taken IN ('warning', 'stamina_loss', 'input_block', 'session_pause', 'account_review', 'safe_message')),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_violation_user ON violation_log(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_violation_type ON violation_log(violation_type, severity);

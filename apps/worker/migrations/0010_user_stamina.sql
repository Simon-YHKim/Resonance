-- 0010_user_stamina.sql — 스테미나 시스템 (Phase 2 BM 핵심)
--
-- LLM 회사식 일일 사용량 캡:
--   - 신규/회복 시 max=100
--   - 일일 reset (KST 자정 = UTC 15:00 기준)
--   - 상점에서 스테미나 포션 구매 시 current ↑ (max 초과 가능, 누적 trackable)
--
-- 차감 룰:
--   - 닉네임 분석 (analyze)         : 5
--   - 닉네임 재분석 (reroll)        : 5
--   - 전투 1턴 (combat/turn)        : 1
--   - 스토리 모드                   : 0 (별도 구매)
--
-- Refs: 2026-05-06 사용자 결정 §5

CREATE TABLE IF NOT EXISTS user_stamina (
  user_id TEXT PRIMARY KEY,
  current INTEGER NOT NULL DEFAULT 100 CHECK (current >= 0),
  max_daily INTEGER NOT NULL DEFAULT 100 CHECK (max_daily > 0),
  last_reset_at INTEGER NOT NULL,
  total_purchased INTEGER NOT NULL DEFAULT 0,
  total_consumed INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_stamina_reset ON user_stamina(last_reset_at);

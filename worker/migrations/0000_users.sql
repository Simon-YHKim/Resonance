-- 0000_users.sql — users 테이블 (Phase 1 FK 의존성 해결)
--
-- Phase 1.5+에서 Clerk 통합으로 user_id를 Clerk JWT의 sub claim으로 매핑.
-- 현재는 인증 placeholder — getCurrentUserId() 헬퍼가 헤더 X-Dev-User-Id에서 추출.
--
-- 8개 후속 테이블의 FOREIGN KEY (user_id) REFERENCES users(id) 의 대상.
--
-- Refs: 잔향_시스템명세_v1.4.md §6.1, PHASE1_BUILD_PROMPT.md Day 1

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  -- Clerk 연동 시 sub claim 또는 임시 dev id
  email TEXT,
  display_name TEXT,
  -- ISO timestamp (ms)
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  -- 14세 이상 동의 (자살예방법 + 게임위 12세 정책)
  age_gate_passed INTEGER NOT NULL DEFAULT 0 CHECK (age_gate_passed IN (0, 1))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created ON users(created_at);

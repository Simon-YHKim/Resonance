-- 0012_story_progress.sql — 스토리 모드 (Phase 2-5)
--
-- 사용자별 스토리 진행도. 5체 보스 순차 (1→5).
-- 스토리 모드는 stamina X (사용자 §5 결정). 별도 구매 (story_chapter_N inventory).
--
-- 잔잔 누적이 다음 보스로 이월. 5체 격파 시 잔잔 ≥ 100 → 화해 결말 / < 100 → 재봉인.
--
-- Refs: 2026-05-06 사용자 결정 §5

CREATE TABLE IF NOT EXISTS story_progress (
  user_id TEXT NOT NULL,
  chapter TEXT NOT NULL,           -- 'ch1' | 'ch2' | ...
  current_boss INTEGER NOT NULL DEFAULT 1 CHECK (current_boss BETWEEN 1 AND 5),
  -- 누적 잔잔(殘殘) — 보스 간 이월
  cumulative_resonance INTEGER NOT NULL DEFAULT 0 CHECK (cumulative_resonance >= 0),
  -- 'in_progress' | 'reconciled' | 'resealed' | 'fled' | 'failed'
  status TEXT NOT NULL DEFAULT 'in_progress',
  started_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  completed_at INTEGER,
  PRIMARY KEY (user_id, chapter),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_story_user ON story_progress(user_id, updated_at DESC);

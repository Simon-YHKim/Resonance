-- 0003_user_skill_tree.sql — 11카테고리 × 4Tier 스킬 트리 진행도
--
-- 모남 조각 누적량으로 트리 깊이 결정 (Tier 1: 3조각, Tier 2: 4~7, Tier 3: 8~15, Tier 4: 16+).
-- 사용자가 11트리 동시 진행 가능 (특화 또는 균형 빌드).
--
-- composite primary key (user_id, category) — 사용자당 카테고리별 1행.
--
-- Refs: 잔향_시스템명세_v1.4.md §1.1.2, §1.2

CREATE TABLE IF NOT EXISTS user_skill_tree (
  user_id TEXT NOT NULL,

  -- 11카테고리 중 하나
  -- ('lunch', 'commute', 'cafe', 'dinner', 'overtime', 'workout',
  --  'meet', 'study', 'shopping', 'family', 'insomnia')
  category TEXT NOT NULL,

  -- 누적 조각 수
  total_shards INTEGER NOT NULL DEFAULT 0 CHECK (total_shards >= 0),

  -- 0=비활성, 1~4=활성 Tier
  current_tier INTEGER NOT NULL DEFAULT 0 CHECK (current_tier BETWEEN 0 AND 4),

  -- {"tier1": "skill_id", "tier2": "skill_id", ...}
  selected_skills_json TEXT,

  total_uses INTEGER NOT NULL DEFAULT 0 CHECK (total_uses >= 0),
  last_use_at INTEGER,

  PRIMARY KEY (user_id, category),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_skill_user_tier ON user_skill_tree(user_id, current_tier DESC);

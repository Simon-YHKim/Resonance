-- 0001_user_wiki.sql — 사용자별 영구 컨텍스트 (Wiki)
--
-- 닉네임 분석 결과 + 말투 + 이정표 + 3축 점수를 영구 저장.
-- 모든 LLM 호출 시 buildSystemPromptWithWiki()로 자동 주입.
--
-- Refs: 잔향_시스템명세_v1.4.md §2.2

CREATE TABLE IF NOT EXISTS user_wiki (
  user_id TEXT PRIMARY KEY,

  -- Section 1: 닉네임 분석 JSON (NicknameAnalysisSchema)
  -- 한국어 키 wire format 유지: {nickname, category, 추정직업, 추정연령, ...}
  nickname_analysis_json TEXT NOT NULL,

  -- Section 2: 말투 패턴
  -- {존댓말빈도, 이모지빈도, 자주쓰는어휘, ...}
  speech_pattern_json TEXT,
  frequent_words TEXT,

  -- Section 3: 이정표 (최근 50개 cap, 메인 보스 처치 등)
  -- [{event, ts, context, ...}]
  milestones_json TEXT,

  -- Section 5: 3축 점수 (개화/여전/항로)
  gaehwa_axis INTEGER NOT NULL DEFAULT 0,
  yeojeon_axis INTEGER NOT NULL DEFAULT 0,
  hangno_axis INTEGER NOT NULL DEFAULT 0,
  -- 보스 4 처치 시점에 lock (50% 결정)
  axis_locked_at INTEGER,

  -- Section 6: 컨텍스트 변경 기록 (퇴사·결혼 등 신분 변경)
  context_change_log_json TEXT,

  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_wiki_updated ON user_wiki(updated_at DESC);

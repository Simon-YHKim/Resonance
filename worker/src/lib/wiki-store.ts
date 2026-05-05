/**
 * user_wiki D1 store — analysis 저장·조회.
 *
 * security-checklist: 모든 쿼리 prepare()로 SQL injection 방어.
 * code-health-guard: D1 접근은 이 파일만.
 *
 * Refs: 잔향_시스템명세_v1.4.md §2.2
 */

import type { NicknameAnalysis } from '../schemas/nickname-analysis';

export interface UserWikiRow {
  user_id: string;
  nickname_analysis_json: string;
  speech_pattern_json: string | null;
  frequent_words: string | null;
  milestones_json: string | null;
  gaehwa_axis: number;
  yeojeon_axis: number;
  hangno_axis: number;
  axis_locked_at: number | null;
  context_change_log_json: string | null;
  created_at: number;
  updated_at: number;
}

/**
 * upsert — 이미 있으면 nickname_analysis_json + updated_at 갱신, 없으면 INSERT.
 */
export async function upsertUserWiki(
  db: D1Database,
  userId: string,
  analysis: NicknameAnalysis,
): Promise<void> {
  const now = Date.now();
  const json = JSON.stringify(analysis);
  await db
    .prepare(
      `INSERT INTO user_wiki (user_id, nickname_analysis_json, created_at, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         nickname_analysis_json = excluded.nickname_analysis_json,
         updated_at = excluded.updated_at`,
    )
    .bind(userId, json, now, now)
    .run();
}

export async function getUserWikiRow(
  db: D1Database,
  userId: string,
): Promise<UserWikiRow | null> {
  const row = await db
    .prepare('SELECT * FROM user_wiki WHERE user_id = ?')
    .bind(userId)
    .first<UserWikiRow>();
  return row ?? null;
}

/**
 * Phase 1 인증 placeholder — 옵션 2-C.
 *
 * 현재: 헤더 X-Dev-User-Id 에서 추출.
 * Phase 1.5: Clerk JWT 검증으로 교체 (인터페이스 동일).
 *
 * code-health-guard:
 *   - 인증 책임은 이 단일 파일.
 *   - 라우트는 getCurrentUserId(c) 만 호출.
 */

import type { Context } from 'hono';
import type { Bindings } from '../types/bindings';

export type AuthContext = Context<{ Bindings: Bindings }>;

/**
 * 현재 요청의 user_id 추출.
 *
 * Phase 1: X-Dev-User-Id 헤더 (개발 friendly).
 * Phase 1.5: c.get('clerkUserId') (Clerk middleware 주입).
 */
export function getCurrentUserId(c: AuthContext): string | null {
  const devUserId = c.req.header('X-Dev-User-Id');
  if (devUserId && devUserId.trim().length > 0) {
    return devUserId.trim();
  }
  // Phase 1.5: Clerk
  // const clerkId = c.get('clerkUserId');
  // if (clerkId) return clerkId;
  return null;
}

/**
 * users 행 보장 — 없으면 생성 (Phase 1 placeholder).
 *
 * Phase 1.5: Clerk webhook 으로 미리 생성. 이 함수는 fallback.
 */
export async function ensureUserExists(db: D1Database, userId: string): Promise<void> {
  const now = Date.now();
  // INSERT OR IGNORE — 이미 있으면 no-op
  await db
    .prepare(
      `INSERT OR IGNORE INTO users (id, email, display_name, created_at, updated_at, age_gate_passed)
       VALUES (?, NULL, NULL, ?, ?, 0)`,
    )
    .bind(userId, now, now)
    .run();
}

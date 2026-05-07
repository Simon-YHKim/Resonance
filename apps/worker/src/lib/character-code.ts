/**
 * 캐릭터 코드 — 6자리 잔향 ID.
 *
 * plan9.kr/battle 의 *캐릭터 코드* 영감 + 잔향계 톤으로 리텍스처.
 * 친구가 코드를 입력하면 익명으로 다른 사람 wiki 일부를 볼 수 있음.
 * Phase 2에서 *공감 미션* (코드로 친구의 잊혀진 자 만나기) 로 확장.
 *
 * 알파벳: 32자 (0/1/I/O 제외 — 헷갈리기 쉬운 글자 빼서 사람이 읽기 쉬움).
 * 충돌 가능성: 32^6 = ~10억 조합 → UNIQUE 충돌 시 5회까지 재시도.
 *
 * Refs: 30일 sprint Week 2 (plan9.kr/battle 영감 도입)
 */

const ALPH = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const CODE_LEN = 6;
const MAX_RETRIES = 5;

export function generateCode(): string {
  const bytes = new Uint8Array(CODE_LEN);
  crypto.getRandomValues(bytes);
  let code = '';
  for (let i = 0; i < CODE_LEN; i++) code += ALPH[bytes[i] % 32];
  return code;
}

export function isValidCode(code: string): boolean {
  if (code.length !== CODE_LEN) return false;
  for (const ch of code) if (!ALPH.includes(ch)) return false;
  return true;
}

/**
 * 사용자에게 코드를 발급. 이미 있으면 그대로, 없으면 새로 생성 (UNIQUE 보장).
 */
export async function ensureCodeForUser(
  db: D1Database,
  userId: string,
): Promise<string> {
  const existing = await db
    .prepare('SELECT nickname_code FROM user_wiki WHERE user_id = ?')
    .bind(userId)
    .first<{ nickname_code: string | null }>();

  if (existing?.nickname_code) return existing.nickname_code;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const code = generateCode();
    const result = await db
      .prepare(
        `UPDATE user_wiki SET nickname_code = ? WHERE user_id = ? AND nickname_code IS NULL`,
      )
      .bind(code, userId)
      .run();
    if (result.meta.changes === 1) return code;

    const reread = await db
      .prepare('SELECT nickname_code FROM user_wiki WHERE user_id = ?')
      .bind(userId)
      .first<{ nickname_code: string | null }>();
    if (reread?.nickname_code) return reread.nickname_code;
  }
  throw new Error('캐릭터 코드 발급 실패 — 잠시 후 다시 시도해주세요');
}

export async function findUserByCode(
  db: D1Database,
  code: string,
): Promise<{ user_id: string; nickname_analysis_json: string } | null> {
  if (!isValidCode(code)) return null;
  const row = await db
    .prepare(
      'SELECT user_id, nickname_analysis_json FROM user_wiki WHERE nickname_code = ?',
    )
    .bind(code)
    .first<{ user_id: string; nickname_analysis_json: string }>();
  return row ?? null;
}

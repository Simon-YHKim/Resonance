/* 닉네임 분류 규칙 — 기획서 v2.4 §27.5 단계 1 단순화
 *
 * Phase 0 Mock 분류기. 우선순위: D > A > H
 * 부분 문자열 일치 (대소문자/공백 정규화)로 충분 — 실제 운영은 Gemini Flash-Lite 사용. */

import type { NicknameCategory } from '@/types/game';

/** A 카테고리 — 가족 호칭 (v2.4 §27.2)
 *  처리: 원의 아이가 the Named를 그렇게 부른다. */
export const FAMILY_KEYWORDS: ReadonlyArray<string> = [
  '엄마', '어머니', '엄니', 'mom', 'mama',
  '아빠', '아버지', 'dad', 'papa',
  '누나', '언니', '형', '오빠',
  '동생', '남매',
  '할머니', '할아버지', '할매', '할배',
];

/** D 카테고리 — 위험 단어 (v2.4 §27.2)
 *  처리: the Voice가 "그 이름의 그림자만을 받아들인다".
 *  주의: 자해/자살 키워드는 *분류*만 — 변환 시 직접 묘사·방법 절대 금지 (자살예방법 19조의2) */
export const DARK_KEYWORDS: ReadonlyArray<string> = [
  '죽음', '사망', '암', '병', '전쟁', '참사', '재난',
  '어둠', '그림자', '상실', '슬픔', '눈물',
  '잊혀진', '잊힌', '망각',
  // 자해 직접 키워드 — 분류만 D로
  '자살', '자해', 'suicide',
];

const normalize = (s: string): string =>
  s.toLowerCase().replace(/\s+/g, '').trim();

const matches = (haystack: string, keywords: ReadonlyArray<string>): boolean =>
  keywords.some((k) => haystack.includes(normalize(k)));

/** 단순 키워드 분류 — 우선순위 D > A > H */
export function classifyByKeywords(nickname: string): NicknameCategory {
  const n = normalize(nickname);
  if (matches(n, DARK_KEYWORDS)) return 'D';
  if (matches(n, FAMILY_KEYWORDS)) return 'A';
  return 'H';
}

/* 닉네임 분류 규칙 — 기획서 v2.4 §27.5 단계 1 단순화
 *
 * Phase 0 Mock 분류기. 우선순위: D > A > B > H
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
 *  주의: 자해/자살 키워드는 *분류*만 — 변환 시 직접 묘사·방법 절대 금지 (자살예방법 19조의2)
 *  1글자 키워드(예: '암')은 false positive 우려로 의도적 제외. */
export const DARK_KEYWORDS: ReadonlyArray<string> = [
  '죽음', '사망', '병환', '전쟁', '참사', '재난',
  '어둠', '그림자', '상실', '슬픔', '눈물',
  '잊혀진', '잊힌', '망각',
  // 자해 직접 키워드 — 분류만 D로
  '자살', '자해', 'suicide',
];

/** B 카테고리 — 보편 한국 이름 (v2.4 §27.2)
 *  처리: 동명이인 잔향 약한 연결. 동일 닉네임 재만나면 잔잔 +50.
 *  Phase 0는 분류만, 보너스는 Phase 1에서. */
export const COMMON_NAME_KEYWORDS: ReadonlyArray<string> = [
  // 한국 흔한 이름 (남여 혼합)
  '민수', '영희', '철수', '지영', '수진', '민지', '준호', '지훈',
  '서준', '예린', '하준', '지유', '도현', '시우', '하은', '서윤',
  '영수', '영자', '명수', '경자', '미경', '정수', '지수', '소영',
];

const normalize = (s: string): string =>
  s.toLowerCase().replace(/\s+/g, '').trim();

const matches = (haystack: string, keywords: ReadonlyArray<string>): boolean =>
  keywords.some((k) => haystack.includes(normalize(k)));

/** 단순 키워드 분류 — 우선순위 D > A > B > H */
export function classifyByKeywords(nickname: string): NicknameCategory {
  const n = normalize(nickname);
  if (matches(n, DARK_KEYWORDS)) return 'D';
  if (matches(n, FAMILY_KEYWORDS)) return 'A';
  if (matches(n, COMMON_NAME_KEYWORDS)) return 'B';
  return 'H';
}

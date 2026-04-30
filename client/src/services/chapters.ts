/* 챕터 진입 — v2.3 §챕터 진입 트리거 (멀티 트리거 OR 조건) Phase 0 단순화.
 *
 * Phase 0: tier 임계 = 챕터 임계 (1:1 매핑)
 *   1장 = novice (0)
 *   2장 = echo (50)
 *   3장 = resonant (150)
 *   4장 = origin entry (400)
 *   5장 = origin deeper (1000) — 어린 너 등장
 *
 * Phase 1+ (v2.3 §챕터 트리거):
 *   - 잔잔량 게이트 + 구조적 게이트 + 시간/탐험 게이트 OR
 *   - LLM emotion_tag 강도 ≥ 7 자동 트리거
 *   - 사투 답파 / NPC 합류 시 강제 챕터 전환
 */

import type { ResonanceTier } from './resonanceTiers';

export type ChapterId = 1 | 2 | 3 | 4 | 5;

interface ChapterMeta {
  id: ChapterId;
  /** "1장" 같은 짧은 표시 */
  numeral: string;
  /** 챕터 부제 */
  title: string;
  /** 첫 진입 시 시적 한 줄 */
  intro: string;
}

export const CHAPTERS: Record<ChapterId, ChapterMeta> = {
  1: {
    id: 1,
    numeral: '1장',
    title: '첫 거리',
    intro: '거리는 너를 처음 본다. 너도 거리를 처음 본다.',
  },
  2: {
    id: 2,
    numeral: '2장',
    title: '잔향이 머무는 골목',
    intro: '거리가 너의 발자국을 한 박자 늦게 따라온다.',
  },
  3: {
    id: 3,
    numeral: '3장',
    title: '더 깊은 자리',
    intro: '잔향은 더 이상 너를 객으로 두지 않는다.',
  },
  4: {
    id: 4,
    numeral: '4장',
    title: '원의 자리 가까이',
    intro: '원의 자리가, 한 발짝씩 너에게로 다가온다.',
  },
  5: {
    id: 5,
    numeral: '5장',
    title: '원의 자리',
    intro: '너는 가장 처음 잊은 자의 손에 닿을 만큼 가까이 있다.',
  },
};

/** tier → ChapterId. origin tier는 잔잔으로 4·5장 분기. */
export function chapterForTier(
  tier: ResonanceTier,
  totalResonance: number,
): ChapterId {
  switch (tier) {
    case 'novice':
      return 1;
    case 'echo':
      return 2;
    case 'resonant':
      return 3;
    case 'origin':
      return totalResonance >= 1000 ? 5 : 4;
  }
}

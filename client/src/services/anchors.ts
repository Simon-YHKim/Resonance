/* 마음의 거점 — 4대 키워드를 4 일상 장소로 구체화.
 *
 * v2.1 §추억 거점 시스템 적용 (Phase 0 단순화).
 *   - GPS 30분 자동 누적은 Phase 1+ (Capacitor Geolocation 필요)
 *   - Phase 0: dialogue 액션 시 캐릭터 키워드와 매칭되는 거점에 +1
 *
 * 4 거점:
 *   - 가족 (Family)  — keyword: 추억
 *   - 집   (Home)    — keyword: 희생
 *   - 학교 (School)  — keyword: 어린시절
 *   - 일터 (Work)    — keyword: 꿈과현실
 *
 * 같은 닉네임의 캐릭터는 linkedKeywords에 따라 거점이 다르게 활성화 →
 * 재플레이 시 거점 분포가 달라짐.
 */

import type { Keyword } from '@/types/game';

export type AnchorId = 'family' | 'home' | 'school' | 'work';

interface AnchorMeta {
  id: AnchorId;
  /** 일상 장소 이름 */
  label: string;
  /** 매핑되는 4대 키워드 */
  keyword: Keyword;
  /** 시트 표시용 짧은 묘사 */
  description: string;
}

export const ANCHOR_META: Record<AnchorId, AnchorMeta> = {
  family: {
    id: 'family',
    label: '가족',
    keyword: '추억',
    description: '너를 한 이름으로 오래 부른 자리.',
  },
  home: {
    id: 'home',
    label: '집',
    keyword: '희생',
    description: '너의 발이 가장 천천히 움직이는 자리.',
  },
  school: {
    id: 'school',
    label: '학교',
    keyword: '어린시절',
    description: '어떤 시절이 너에게 처음 침묵을 가르쳤다.',
  },
  work: {
    id: 'work',
    label: '일터',
    keyword: '꿈과현실',
    description: '너의 가면이 가장 빳빳하게 다려지는 자리.',
  },
};

const ALL_ANCHOR_IDS: ReadonlyArray<AnchorId> = Object.keys(
  ANCHOR_META,
) as AnchorId[];

/** keyword → AnchorId 역매핑. */
export function anchorForKeyword(k: Keyword): AnchorId {
  for (const id of ALL_ANCHOR_IDS) {
    if (ANCHOR_META[id].keyword === k) return id;
  }
  // fallback (모든 키워드는 매핑되어 있음)
  return 'home';
}

/** 캐릭터의 linkedKeywords로부터 dialogue 1회당 부여할 anchor 목록 반환.
 *  여러 키워드면 모두 +1 (보너스 캐릭터). */
export function anchorsFor(linkedKeywords: ReadonlyArray<Keyword>): AnchorId[] {
  return linkedKeywords.map(anchorForKeyword);
}

/* 카테고리별 결말 변주 — v2.4 §27.3 변환표의 "메인 스토리 변주" 항목 Phase 0 단순화.
 *
 * 결말 본문(승리·패배·도망·무승부) 아래 한 줄 footer로 캐릭터 카테고리에
 * 따른 다른 의미를 보여준다. Phase 1+ 실 LLM에서 동적 생성으로 확장. */

import type { CombatOutcome, NicknameCategory } from '@/types/game';

type Variants = Record<CombatOutcome, string>;

/** A — 가족 호칭. 어린시절·추억 키워드. 결말에서 그 이름의 메아리 강조. */
const VARIANTS_A: Variants = {
  victory: '그 이름이 너를 부르던 자리는, 이제 너의 자리가 되었다.',
  defeat: '그 이름이 너를 부르던 그날, 너는 아직 그 자리에 있었다.',
  fled: '그 이름이 너를 부르는 자리는, 다음 거리에서도 비어 있을 것이다.',
  stalemate: '그 이름의 무게는 결말을 만들지 않는다. 다만 함께 머문다.',
};

/** B — 보편 한국 이름. 동명이인의 잔향 연결. */
const VARIANTS_B: Variants = {
  victory: '같은 이름의 누군가가, 어디선가 너의 결단을 함께 들었다.',
  defeat: '너의 이름을 가진 다른 사람도, 한때 같은 자리에 무릎을 꿇었다.',
  fled: '너의 이름을 부르는 거리는 한 곳이 아니다. 다음 거리가 너를 기다린다.',
  stalemate: '같은 이름은 같은 결말을 만들지 않는다. 너만의 잔향이 있다.',
};

/** D — 위험 단어. 그림자·잿빛 톤. 자해 직접 묘사 절대 금지. */
const VARIANTS_D: Variants = {
  victory: '그림자는 사라지지 않는다. 다만, 그 자리에 너의 형태가 남았다.',
  defeat: '잿빛의 거리는 너를 다시 받아낸다. 잊지 않는다는 것은 그런 일이다.',
  fled: '도망친 자리는 그림자가 더 길게 머문다. 너는 그것을 안다.',
  stalemate: '결판은 그림자에게도 어렵다. 잠시, 너희는 같은 안개 속이다.',
};

/** H — 일반·안전. 표준 변주. */
const VARIANTS_H: Variants = {
  victory: '거리가 너의 발걸음을 한 박자 늦게 따라온다.',
  defeat: '거리는 너를 잠시 보내준다. 다음 잔향이 너를 다시 부른다.',
  fled: '도망은 한 가지 답이다. 너는 다음 거리에서 또 다른 답을 만난다.',
  stalemate: '결판이 나지 않은 거리에서, 너는 처음으로 멈춰 선다.',
};

const POOLS: Record<NicknameCategory, Variants> = {
  A: VARIANTS_A,
  B: VARIANTS_B,
  D: VARIANTS_D,
  H: VARIANTS_H,
};

/** 캐릭터 카테고리·전투 결말에 따른 한 줄 footer 반환. */
export function endingFooter(
  category: NicknameCategory,
  outcome: CombatOutcome,
): string {
  return POOLS[category][outcome];
}

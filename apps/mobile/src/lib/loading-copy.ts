/**
 * 로딩 카피 다양화 — LLM 호출 1.5초 동안 *닉네임 결*에 맞춘 한 줄.
 *
 * Refs: CEO+DX agent 보고 (잔향계 톤 일관성)
 */

const ANALYZE_COPIES = [
  '잔향이 너의 이름을 듣고 있어요',
  '거리의 끝에서 — 너의 결을 더듬는다',
  '안개 사이로 — 호칭이 떠올라요',
  '잿빛 외투가 — 너의 이름을 받아낸다',
];

const COMBAT_COPIES_BY_ACTION = {
  attack: [
    '너의 손이 호선을 그린다',
    '잿빛 외투가 너의 결단을 받아낸다',
    '안개가 한 박자 흩어진다',
  ],
  dialogue: [
    '너의 말이 안개에 닿는다',
    '잊혀진 자가 잠시 멈춘다',
    '한 마디가 거리에 남는다',
  ],
  flee: [
    '너의 발이 거리를 떠난다',
    '잔향이 너를 놓아준다',
  ],
};

const COMBAT_START_COPIES = [
  '거리의 끝에서 그림자가 일어선다',
  '안개 너머에서 — 누군가 너를 본다',
  '잊혀진 자가 자리에서 일어난다',
];

const SHOP_COPIES = [
  '상점이 잔향을 펼친다',
  '잿빛 가게 주인이 너를 기다린다',
];

const STORY_COPIES = [
  '5체의 거리가 너를 부른다',
  '잿빛 마을이 자리에서 일어선다',
];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function loadingForAnalyze(): string {
  return pick(ANALYZE_COPIES);
}

export function loadingForCombatTurn(action: 'attack' | 'dialogue' | 'flee'): string {
  return pick(COMBAT_COPIES_BY_ACTION[action]);
}

export function loadingForCombatStart(): string {
  return pick(COMBAT_START_COPIES);
}

export function loadingForShop(): string {
  return pick(SHOP_COPIES);
}

export function loadingForStory(): string {
  return pick(STORY_COPIES);
}

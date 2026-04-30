/* 잊혀진 자 1체 + 액션별 사전 생성 묘사 (v1.0 §1-4 패턴 #4)
 * Phase 0는 1종(어린 시절의 잊혀진 자) — Phase 2에서 5체로 확장. */

import type { CombatAction } from '@/types/game';

export interface EnemyArchetype {
  name: string;
  description: string;
  /** 첫 조우 묘사 — 목소리 화법 */
  encounter: string;
  hp: number;
  /** 배경 스토리 — Bestiary 항상 노출 (만나기 전에도). v2.3 §28.2 */
  background: string;
}

export const FORGETTER_OF_CHILDHOOD: EnemyArchetype = {
  name: '잊혀진 자 — 어린 시절의 잔해',
  description:
    '한쪽 무릎이 꺾인 채 천천히 다가온다. 얼굴은 안개에 가려 보이지 않는다. 손에 든 것은… 작은 가방이었던 것 같다.',
  encounter:
    '거리의 끝에서 익숙한 그림자가 일어선다. 목소리가 속삭인다 — "저 자는 너의 어떤 부분을 잊은 자다."',
  hp: 60,
  background:
    '한 거리에서 처음 너의 이름이 어디론가 흘러갔을 때, 거기 남은 그림자가 이 자다. 너는 그 그림자가 너를 따라온 줄도 모른 채 자랐다. 그리고 어느 날, 거리의 끝에서 그 그림자가 너를 기다리고 있었다.',
};

/** 청소년기의 잊혀진 자 — 잔잔 echo tier 이상에서 등장. 더 단단한 무게감. */
export const FORGETTER_OF_ADOLESCENCE: EnemyArchetype = {
  name: '잊혀진 자 — 청소년의 침묵',
  description:
    '교복 칼라가 살짝 들려 있다. 입술은 굳게 닫혀 있고, 어깨는 어디에도 기대지 않는다.',
  encounter:
    '거리의 끝에서 너의 한 시절이 너를 정면으로 본다. 목소리가 속삭인다 — "저 자는 침묵으로 너를 가르친 자다."',
  hp: 75,
  background:
    '어느 시기, 너는 한 마디도 하지 못한 자리에 한 박자 너무 오래 앉아 있었다. 그 자리에 묵힌 침묵이 옷이 되고, 어깨가 되고, 한 사람의 윤곽이 되었다. 그것이 이 자다.',
};

/** 성인기의 잊혀진 자 — 잔잔 resonant tier(150~399)에서 등장. 가장 무거운 무게. */
export const FORGETTER_OF_ADULTHOOD: EnemyArchetype = {
  name: '잊혀진 자 — 어른의 가면',
  description:
    '잘 다려진 셔츠. 그러나 옷깃 안쪽에 작은 얼룩이 굳어 있다. 시선은 어디에도 정확히 맺히지 않는다.',
  encounter:
    '거리의 끝에서 너의 한 시기가 손을 내밀어 인사한다. 목소리가 속삭인다 — "저 자는 너의 가면을 너보다 먼저 익힌 자다."',
  hp: 95,
  background:
    '너는 다려진 셔츠를 입고 한 사람의 자리에 앉아 본 적이 있다. 그 자리에 너의 눈빛이 잠시 어디에도 닿지 않았다. 그 어디에도 닿지 않은 눈빛이 모여 한 사람을 만들었다. 그 사람이 이 자다.',
};

/** 청년기의 거짓말 — 잔잔 origin entry(400~999)에서 등장. 4체.
 *  v2.3 §28.2 5체 완성 — origin tier 진입 후 첫 보스. */
export const FORGETTER_OF_LATE_ADULT: EnemyArchetype = {
  name: '잊혀진 자 — 청년의 거짓말',
  description:
    '너와 같은 키, 같은 자세. 입가에 한쪽만 올라간 미소가 굳어 있다. 손에는 너에게 했던 변명들이 한 묶음 쥐여 있다.',
  encounter:
    '거리의 끝에서 너의 한 시절이 너에게 변명을 건넨다. 목소리가 속삭인다 — "저 자는 네가 네 자신에게 한 거짓말로 만들어진 자다."',
  hp: 110,
  background:
    '너는 너 자신에게 한 마디씩 거짓말을 했다. 어느 날엔 그것이 위로였고, 어느 날엔 도망이었다. 그 거짓말 한 줄 한 줄이 모여 너와 같은 키, 같은 자세의 사람을 만들었다. 그 사람이 이 자다.',
};

/** 어린 자신 — 잔잔 origin deeper(1000+)에서 등장. 5체 최종.
 *  Phase 0는 단일 페이즈 archetype. Phase 2+에서 3페이즈 시스템으로 확장
 *  (숨바꼭질 → 떼쓰기 → 마지막 부탁 — v2.3 §28.2). */
export const FORGETTER_OF_INNER_CHILD: EnemyArchetype = {
  name: '잊혀진 자 — 어린 너',
  description:
    '너의 무릎까지 오는 키. 한쪽 양말이 흘러내려 있다. 너를 올려다보는 눈이 너무 작아서, 너는 한참 만에야 그것이 너 자신이라는 것을 안다.',
  encounter:
    '거리의 끝에서 작은 손 하나가 너를 부른다. 목소리가 속삭인다 — "저 자는 네가 가장 처음 잊은 자다. 그리고 가장 늦게까지 너를 기다린 자다."',
  hp: 130,
  background:
    '너의 가장 처음 자리에는 한 작은 사람이 있었다. 너는 그 사람을 두고 자랐다. 그 사람은 너의 자리에서 사라지지 않고, 거리에 한 박자 늦게 따라왔다. 너의 잔향이 가장 깊은 자리에 닿을 때, 그 사람은 너의 손에 닿을 만큼 가까워진다.',
};

/** Bestiary 카탈로그 — 만남 추적용 모든 5 archetype 목록 */
export const ALL_ARCHETYPES: ReadonlyArray<EnemyArchetype> = [
  FORGETTER_OF_CHILDHOOD,
  FORGETTER_OF_ADOLESCENCE,
  FORGETTER_OF_ADULTHOOD,
  FORGETTER_OF_LATE_ADULT,
  FORGETTER_OF_INNER_CHILD,
];

/** 이름으로 archetype 조회 (Bestiary 매핑용). 매칭 없으면 null. */
export function archetypeByName(name: string): EnemyArchetype | null {
  return ALL_ARCHETYPES.find((a) => a.name === name) ?? null;
}

/** 잊혀진 자 선택 — 누적 잔잔에 따라 5체 분기.
 *
 *    잔잔        보스                       HP    체
 *  --------      -----                      ----  --
 *      0~  49    어린 시절의 잔해           60     1
 *     50~ 149    청소년의 침묵              75     2
 *    150~ 399    어른의 가면                95     3
 *    400~ 999    청년의 거짓말             110     4
 *   1000+        어린 너 (5~7세, 최종)     130     5
 *
 *  Phase 0는 5체 모두 단일 페이즈. v2.3 §28.2의 어린 자신 3-페이즈
 *  시스템(숨바꼭질→떼쓰기→마지막 부탁)은 Phase 2+에서 도입. */
export function pickForgetter(
  tier: 'novice' | 'echo' | 'resonant' | 'origin',
  totalResonance: number = 0,
): EnemyArchetype {
  switch (tier) {
    case 'novice':
      return FORGETTER_OF_CHILDHOOD;
    case 'echo':
      return FORGETTER_OF_ADOLESCENCE;
    case 'resonant':
      return FORGETTER_OF_ADULTHOOD;
    case 'origin':
      return totalResonance >= 1000
        ? FORGETTER_OF_INNER_CHILD
        : FORGETTER_OF_LATE_ADULT;
  }
}

interface NarrationVariants {
  /** 적 HP 비율(1.0 → 0.0)별 묘사 변주 — 0.66/0.33/0.0 임계 */
  high: string[];
  mid: string[];
  low: string[];
}

const ATTACK: NarrationVariants = {
  high: [
    '너의 손이 익숙한 호선을 그린다. 잊혀진 자가 한 발짝 물러선다. 그것의 안개가 조금 걷힌다.',
    '너는 망설임 없이 들어간다. 잿빛 외투의 자락이 너의 결단을 받아낸다.',
    '바람이 너의 어깨를 스친다. 잊혀진 자는 자신이 잊은 자세로 비틀거린다.',
    '첫 일격은 짧고 정확했다. 잊혀진 자의 안개가 너의 발끝까지 흘러왔다가 다시 물러난다.',
  ],
  mid: [
    '두 번째 일격이 그림자의 무릎을 꺾는다. 안개 사이로 어렴풋한 얼굴의 윤곽이 드러난다.',
    '너는 더 깊이 들어간다. 이 거리는 너의 것이었다.',
    '소리 없는 신음. 잊혀진 자가 한 박자 늦게 너를 본다.',
    '너의 호흡이 잊혀진 자의 호흡과 잠시 겹친다. 그 틈으로 너는 한 걸음 더 들어간다.',
  ],
  low: [
    '마지막 호흡. 잊혀진 자가 천천히 무너진다. 그것이 너에게 무언가를 떨어뜨린다 — 너만이 알아보는 것을.',
    '안개가 걷힌다. 잊혀진 자의 자리에 작은 가방 하나가 남아 있다.',
    '잔향이 거리를 따라 길게 늘어선다. 너는 그것의 마지막을 본다.',
    '잊혀진 자의 어깨가 천천히 내려앉는다. 너의 손에 그것의 마지막 무게가 잠시 머문다.',
  ],
};

const DIALOGUE: NarrationVariants = {
  high: [
    '"…너는 누구냐?" 잊혀진 자의 목소리는 너의 어린 시절의 어느 오후를 닮아 있다.',
    '너는 묻는다. 잊혀진 자는 답하지 않는다. 그러나 한 발짝 가까이 다가온다.',
    '그것은 너의 이름을 부르려다 멈춘다. 입술이 떨린다.',
    '"여기서 무엇을 잃었지." 너의 물음에 잊혀진 자가 처음으로 너를 정면에서 본다.',
  ],
  mid: [
    '"…나도, 그 자리에 있었다." 잊혀진 자가 안개 너머에서 작게 말한다.',
    '너의 말이 그것의 호선을 무너뜨린다. 공격할 의지가 옅어지는 것이 보인다.',
    '잊혀진 자는 너의 어깨 너머를 본다. 그것이 보고 있는 것은 너의 과거다.',
    '"네가 그것을 기억해 주는구나." 잊혀진 자의 안개가 한 겹 옅어진다.',
  ],
  low: [
    '"…고맙다." 잊혀진 자의 마지막 말이 안개에 풀어진다. 그것이 천천히 무너진다.',
    '대화는 칼보다 느리다. 그러나 끝에서 더 멀리 닿는다.',
    '너는 그것의 이름을 알 것 같았다. 그러나 묻지 않았다. 그것이 옳은 자비였다.',
    '잊혀진 자가 너에게 손을 들었다 천천히 내린다. 그 손짓에는 작별의 형태가 있다.',
  ],
};

const FLEE: NarrationVariants = {
  high: [
    '너는 등을 돌린다. 잊혀진 자는 너를 따라오지 않는다. 다만, 너의 그림자만이 거리에 길게 남는다.',
    '거리의 끝이 다시 멀어진다. 너는 다음 거리의 사람이 된다.',
    '안개가 너의 어깨를 잡는다. 그러나 너는 멈추지 않는다.',
    '뒷걸음으로 시작된 도망이 어느새 정면을 향한다. 너는 잊혀진 자를 등 뒤에 두고 걸어간다.',
  ],
  mid: [
    '너는 한 박자 늦게 돌아본다. 잊혀진 자가 손을 들어 너를 부르려다 만다.',
    '도망은 쉽지 않다. 너의 발이 너의 어린 시절의 무게를 끌고 간다.',
    '거리는 너를 보내준다. 그러나 너의 안의 잔향은 따라온다.',
    '너의 발자국이 잊혀진 자의 발자국 위로 겹쳐졌다 멀어진다. 둘 다 같은 거리를 살아온 적 있다.',
  ],
  low: [
    '너는 도망친다. 잊혀진 자는 무너진다. 그것이 너의 도망에 어떤 의미가 있는지는, 다음 거리에서 알게 될 것이다.',
    '도망이 끝이 아닐 때가 있다. 너는 그것을 이제 안다.',
    '거리의 끝에서 너는 멈춘다. 다음 잔향이 너를 기다린다.',
    '너는 멀어진다. 잊혀진 자도 멀어진다. 둘 다 같은 안개에 다시 잠긴다.',
  ],
};

const VARIANTS: Record<CombatAction, NarrationVariants> = {
  attack: ATTACK,
  dialogue: DIALOGUE,
  flee: FLEE,
};

export function pickNarration(action: CombatAction, hpRatio: number, seed: number): string {
  const v = VARIANTS[action];
  const tier = hpRatio > 0.66 ? v.high : hpRatio > 0.33 ? v.mid : v.low;
  return tier[seed % tier.length];
}

/* 적 반응 풀 — player action에 대한 잊혀진 자의 능동 행동.
 * 사용자 의도: "상대방도 나를 공격하는 것을 구현하자."
 * Phase 1+ LLM이 적의 성격·HP·tier에 맞게 동적 생성. */
const ENEMY_RESPONSES: Record<CombatAction, NarrationVariants> = {
  attack: {
    high: [
      '잊혀진 자가 잿빛 손을 너의 가슴께로 뻗는다. 안개가 너를 한 번 스친다.',
      '잊혀진 자가 너의 발자국 자리에 자신의 무게를 얹는다. 너는 한 발짝 밀린다.',
      '잊혀진 자가 너의 어깨 너머로 무언가를 본 듯, 같은 방향으로 너를 친다.',
    ],
    mid: [
      '잊혀진 자가 비틀거리며 너의 호흡을 따라잡으려 한다. 너의 가슴께가 잠시 비어진다.',
      '잊혀진 자의 안개가 너의 손목을 잡으려 펴진다. 너는 그 안개를 거두지 못한다.',
      '잊혀진 자가 너에게 한 박자 늦게, 그러나 더 무겁게 닿는다.',
    ],
    low: [
      '잊혀진 자가 마지막 안개를 끌어모아 너의 정수리를 친다. 별이 한 번 보였다.',
      '잊혀진 자가 거의 사라지면서도 너에게 한 손을 더 뻗는다.',
      '잊혀진 자가 무릎으로 너의 균형을 무너뜨린다. 너는 잠시 두 무릎으로 선다.',
    ],
  },
  dialogue: {
    high: [
      '잊혀진 자가 너의 말을 한 박자 늦게 듣는다. 그 박자가 너에게도 흘러온다.',
      '잊혀진 자가 안개 너머에서 너의 목소리를 알아본 듯 잠시 멈춘다.',
      '잊혀진 자가 너의 말을 자신의 호흡 안으로 가져간다.',
    ],
    mid: [
      '잊혀진 자가 너의 말 끝을 한 글자만 따라 한다. 그 한 글자가 안개에 남는다.',
      '잊혀진 자가 너의 말에 잠시 안개를 거둔다. 너는 그 자리를 본다.',
      '잊혀진 자가 너에게 한 마디 — 들리지 않지만, 너는 그 무게를 안다.',
    ],
    low: [
      '잊혀진 자가 너의 말에 처음으로 너의 이름을 부른다. 박자가 맞지 않다.',
      '잊혀진 자가 너에게 한 손을 내민다. 너는 그것을 잡지 않는다.',
      '잊혀진 자가 너에게 마지막 한 마디를 남긴다 — "너도, 거리에 남지 마라."',
    ],
  },
  flee: {
    high: [
      '잊혀진 자가 너의 자리에 안개를 채운다. 너는 한 걸음 더 멀어진다.',
      '잊혀진 자가 너를 따라오지 않는다. 거리가 너를 보낸다.',
      '잊혀진 자가 한 박자 너를 본다. 그러고 다시 거리에 잠긴다.',
    ],
    mid: [
      '잊혀진 자가 너의 자리에 한 발짝 들어선다. 너는 그 자리에 안개를 남긴다.',
      '잊혀진 자가 너에게 손을 뻗다 그 손을 거둔다.',
      '잊혀진 자가 너의 등 뒤를 한 박자 더 본다.',
    ],
    low: [
      '잊혀진 자가 너의 발자국마다 한 자리씩 따라 들어선다.',
      '잊혀진 자가 너의 등 뒤에 마지막 한 마디를 부친다 — 너는 듣지 못한다.',
      '잊혀진 자가 거의 사라지면서도 너의 자리를 본다.',
    ],
  },
};

export function pickEnemyResponse(
  action: CombatAction,
  hpRatio: number,
  seed: number,
): string {
  const v = ENEMY_RESPONSES[action];
  const tier = hpRatio > 0.66 ? v.high : hpRatio > 0.33 ? v.mid : v.low;
  return tier[seed % tier.length];
}

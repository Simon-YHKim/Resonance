/**
 * 5체 잊혀진 자 풀 — Phase 2 스토리 모드.
 *
 * 본질 (Design+Story agent 권장):
 *   1체 = 이름 — *어떤 호칭으로 너를 부르지 못했지*
 *   2체 = 관계 — *너에게 다가오지 못했던 사람*
 *   3체 = 꿈   — *너가 미루다 잃은 자리*
 *   4체 = 우정 — *손을 놓아버린 사람들*
 *   5체 = 원의 아이 — *지우고 시작한 첫 자기*
 *
 * 잔잔 임계:
 *   - cumulative ≥ 100 + 5체 격파 → 화해 결말 (reconciled)
 *   - cumulative < 100 + 5체 격파 → 재봉인 결말 (resealed)
 *
 * 5턴 한도 + 액션 3종은 일반 combat 와 동일.
 *
 * Refs: 2026-05-06 Design+Story agent 보고
 */

export interface ForgetterDefinition {
  number: 1 | 2 | 3 | 4 | 5;
  theme: string;
  name: string;
  description: string;
  encounter: string;
  hp: number;
  maxHp: number;
}

export const FORGETTERS: ForgetterDefinition[] = [
  {
    number: 1,
    theme: '이름',
    name: '잊혀진 자 — 이름의 잔해',
    description:
      '한쪽 무릎이 꺾인 채 천천히 다가온다. 얼굴은 안개에 가려 보이지 않지만, 그가 부르려던 *어떤 호칭*이 입술에 머문다.',
    encounter:
      '거리의 끝에서 익숙한 그림자가 일어선다. 목소리가 속삭인다 — "저 자는 너를 어떤 이름으로도 부르지 못한 자다."',
    hp: 60,
    maxHp: 60,
  },
  {
    number: 2,
    theme: '관계',
    name: '잊혀진 자 — 다가오지 못한 자',
    description:
      '한 발짝 앞으로 내딛으려다 멈춘다. 손이 너의 어깨에 닿을 듯, 결국 닿지 않는다.',
    encounter:
      '광장의 등불 아래, 한 사람이 너를 향해 돌아본다. 그가 너에게 *건네지 못한 인사*가 안개 속에 떠다닌다.',
    hp: 80,
    maxHp: 80,
  },
  {
    number: 3,
    theme: '꿈',
    name: '잊혀진 자 — 미룬 자리',
    description:
      '책상 앞에 앉아있다. 펜을 들었다 놓고, 종이 위에 흐릿한 자국만 남았다.',
    encounter:
      '도서관의 마지막 등불 아래, 한 자리가 비어있다. 그 자리에 앉으려다 *돌아선 너*가 있다.',
    hp: 100,
    maxHp: 100,
  },
  {
    number: 4,
    theme: '우정',
    name: '잊혀진 자 — 놓은 손들',
    description:
      '여럿이 어깨를 맞대고 서 있었다. 지금은 하나만 남았다. 나머지는 잿빛으로 바랜다.',
    encounter:
      '운동장 끝에서 한 무리의 그림자가 일어선다. *네가 마지막으로 손을 놓은 그 날*의 이름들.',
    hp: 120,
    maxHp: 120,
  },
  {
    number: 5,
    theme: '원의 아이',
    name: '잊혀진 자 — 원의 아이',
    description:
      '작은 발이 운동장 한가운데에 서 있다. 너를 본다. 그 눈이 *너의 첫 자기*를 닮았다.',
    encounter:
      '회색 운동장의 정중앙. 너는 멈춰 선다. *지우고 시작한 첫 너*가 거기 있었다.',
    hp: 150,
    maxHp: 150,
  },
];

export const STORY_CONSTANTS = {
  /** 5체 격파 시 화해(reconciled) 조건 — 누적 잔잔 임계 */
  RECONCILE_THRESHOLD: 100,
  /** 화해 결말 보상 (잔향가루) */
  RECONCILE_DUST: 200,
  /** 재봉인 결말 보상 */
  RESEAL_DUST: 50,
  /** 단발 보스 격파 보상 (1~4체) */
  PER_BOSS_DUST: 20,
  /** 일반 combat (스토리 X) victory 보상 */
  ARCADE_VICTORY_DUST: 20,
  /** 챕터 ID 매핑 */
  CHAPTERS: { ch1: '남겨진 이들 — 5체의 거리' },
} as const;

export function getForgetter(n: number): ForgetterDefinition {
  const idx = Math.max(1, Math.min(5, n)) - 1;
  return FORGETTERS[idx];
}

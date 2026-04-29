/* 잔잔 누적 임계값 — v2.4 §28.3 MVP "잔잔 누적 → 게임 효과" 연결
 *
 * 현재(Phase 0): 누적 잔잔이 결말 화면 + 캐릭터 시트의 메시지 변주에 영향.
 * Phase 1+: 임계값별 시작 HP 보너스, 액션 크리티컬 확률, 보스 추가 데미지로 확장. */

export type ResonanceTier = 'novice' | 'echo' | 'resonant' | 'origin';

/** Tier별 전투 액션 보정 — 같은 액션이라도 tier가 높으면 더 깊이 있는 결과. */
export interface TierActionBuffs {
  /** dialogue 액션 후 추가로 누적할 잔잔 (기본 0) */
  dialogueResonanceBonus: number;
  /** attack 액션의 적 HP 데미지 배율 (기본 1.0) */
  attackDamageMultiplier: number;
}

export interface ResonanceTierMeta {
  tier: ResonanceTier;
  /** 이 tier 진입 누적 임계값 (이상) */
  threshold: number;
  /** 목소리가 부르는 호칭 */
  label: string;
  /** 캐릭터 시트에 표시할 한 줄 (≥ echo부터) */
  sheetMessage?: string;
  /** 결말 화면에 footer로 추가할 한 줄 (≥ echo부터) */
  resultFooter?: string;
  /** 전투 액션 보정 — 모든 tier에 정의 (novice는 기본값) */
  actionBuffs: TierActionBuffs;
}

export const TIERS: ReadonlyArray<ResonanceTierMeta> = [
  {
    tier: 'novice',
    threshold: 0,
    label: '처음 온 자',
    actionBuffs: { dialogueResonanceBonus: 0, attackDamageMultiplier: 1.0 },
  },
  {
    tier: 'echo',
    threshold: 50,
    label: '잔향이 머무는 자',
    sheetMessage: '거리가 너를 알아본다. 너의 대화에 잔향이 더 깊이 머문다.',
    resultFooter: '잔향이 너의 발자국을 따라온다.',
    actionBuffs: { dialogueResonanceBonus: 3, attackDamageMultiplier: 1.0 },
  },
  {
    tier: 'resonant',
    threshold: 150,
    label: '잔향과 함께 걷는 자',
    sheetMessage:
      '잔향은 너에게 자리를 내어준다. 너의 대화는 더 깊고, 너의 손은 더 멀리 닿는다.',
    resultFooter: '거리는 너의 호흡과 같은 박자로 숨을 쉰다.',
    actionBuffs: { dialogueResonanceBonus: 6, attackDamageMultiplier: 1.15 },
  },
  {
    tier: 'origin',
    threshold: 400,
    label: '원의 자리에 가까워진 자',
    sheetMessage:
      '잔향은 더 이상 너를 시험하지 않는다. 너의 한 마디가 거리를 흔든다.',
    resultFooter: '잊혀진 자들이 너를 알아보고, 한 박자 늦게 길을 비킨다.',
    actionBuffs: { dialogueResonanceBonus: 10, attackDamageMultiplier: 1.3 },
  },
];

export function getTier(totalResonance: number): ResonanceTierMeta {
  // 가장 높은 충족 tier 반환
  let current = TIERS[0];
  for (const t of TIERS) {
    if (totalResonance >= t.threshold) current = t;
  }
  return current;
}

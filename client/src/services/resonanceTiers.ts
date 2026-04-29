/* 잔잔 누적 임계값 — v2.4 §28.3 MVP "잔잔 누적 → 게임 효과" 연결
 *
 * 현재(Phase 0): 누적 잔잔이 결말 화면 + 캐릭터 시트의 메시지 변주에 영향.
 * Phase 1+: 임계값별 시작 HP 보너스, 액션 크리티컬 확률, 보스 추가 데미지로 확장. */

export type ResonanceTier = 'novice' | 'echo' | 'resonant' | 'origin';

export interface ResonanceTierMeta {
  tier: ResonanceTier;
  /** 이 tier 진입 누적 임계값 (이상) */
  threshold: number;
  /** the Voice가 부르는 호칭 */
  label: string;
  /** 캐릭터 시트에 표시할 한 줄 (≥ echo부터) */
  sheetMessage?: string;
  /** 결말 화면에 footer로 추가할 한 줄 (≥ echo부터) */
  resultFooter?: string;
}

export const TIERS: ReadonlyArray<ResonanceTierMeta> = [
  {
    tier: 'novice',
    threshold: 0,
    label: '처음 온 자',
  },
  {
    tier: 'echo',
    threshold: 50,
    label: '잔향이 머무는 자',
    sheetMessage: '거리가 너를 알아본다.',
    resultFooter: '잔향이 너의 발자국을 따라온다.',
  },
  {
    tier: 'resonant',
    threshold: 150,
    label: '잔향과 함께 걷는 자',
    sheetMessage: '잔향은 너에게 자리를 내어준다. 너는 더 이상 객이 아니다.',
    resultFooter: '거리는 너의 호흡과 같은 박자로 숨을 쉰다.',
  },
  {
    tier: 'origin',
    threshold: 400,
    label: '원의 자리에 가까워진 자',
    sheetMessage: '잔향은 더 이상 너를 시험하지 않는다. 원의 자리가 보인다.',
    resultFooter: '잊혀진 자들이 너를 알아보고, 한 박자 늦게 길을 비킨다.',
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

/* Bestiary — 잊혀진 자 만남 기록 (v2.3 §28.2 + 사용자 의도 결합).
 *
 * 사용자 의도:
 *   "처음 만나는 거라면은 모든 것을 다 물음표로 띄워.
 *    단 모브의 배경 스토리는 볼 수 있게끔 소개하는 페이지를 만들자.
 *    처음 만난 몹이 아니라면 과거에 만났던 몹의 스탯 스킬 체력 이런 것들을 보여주자."
 *
 * Phase 0: 5 archetype 카탈로그 + 만남 시점 store 누적.
 * Phase 1+: 서버 동기화 (D1) + 길드 멤버 만남 공유.
 */

export interface EncounteredInfo {
  /** 보스 이름 (matching key) */
  bossName: string;
  /** 처음 본 시각 (ms) */
  firstSeenAt: number;
  /** 마지막 본 시각 (ms) */
  lastSeenAt: number;
  /** 누적 만남 횟수 */
  encounterCount: number;
  /** 마지막 전투 종료 시점의 적 maxHp (관찰값 — Phase 0는 archetype.hp와 동일,
   *  #62에서 stat variation 도입 시 실제 값) */
  lastObservedMaxHp: number;
  /** 마지막 직전 본 outcome */
  lastOutcome: 'victory' | 'defeat' | 'fled' | 'stalemate';
}

/** 새 만남 기록 — 결말 시점에 store action에서 호출 */
export function recordEncounter(
  prev: EncounteredInfo | undefined,
  bossName: string,
  observedMaxHp: number,
  outcome: EncounteredInfo['lastOutcome'],
): EncounteredInfo {
  const now = Date.now();
  if (!prev) {
    return {
      bossName,
      firstSeenAt: now,
      lastSeenAt: now,
      encounterCount: 1,
      lastObservedMaxHp: observedMaxHp,
      lastOutcome: outcome,
    };
  }
  return {
    ...prev,
    lastSeenAt: now,
    encounterCount: prev.encounterCount + 1,
    lastObservedMaxHp: observedMaxHp,
    lastOutcome: outcome,
  };
}

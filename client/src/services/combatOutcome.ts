/* 전투 결말 판정 — CombatScreen에서 추출.
 *
 * 액션 적용 후의 상태와 액션 종류를 받아 결말(또는 미결)을 결정.
 * 순수 함수 — 테스트 가능. */

import type { CombatAction, CombatOutcome, CombatState } from '@/types/game';

/** 5턴 hard cap (Phase 0 단순화). Phase 1+에서 캐릭터 stamina/보스에 따라 가변 */
export const TURN_LIMIT = 5;

export interface OutcomeInput {
  /** 액션 적용 후의 다음 턴 number (1부터) */
  nextTurn: number;
  /** 적용 후 플레이어 HP */
  playerHp: number;
  /** 적용 후 적 HP */
  enemyHp: number;
  /** 방금 사용된 액션 */
  action: CombatAction;
}

/** null = 전투 계속, non-null = 결말 확정 */
export function evaluateOutcome({
  nextTurn,
  playerHp,
  enemyHp,
  action,
}: OutcomeInput): CombatOutcome | null {
  // flee는 결과와 무관하게 즉시 종료
  if (action === 'flee') return 'fled';

  // HP 0 결말 우선 (턴 한도와 동시 도달해도 사망/승리 우선)
  if (enemyHp <= 0) return 'victory';
  if (playerHp <= 0) return 'defeat';

  // 턴 한도 도달 — 양쪽 다 살아있으면 stalemate (= 다음 거리로, 잔잔만 누적)
  if (nextTurn >= TURN_LIMIT) return 'stalemate';

  return null;
}

/** 결말별 잔잔 보너스 — endCombat의 두번째 인자에 더할 값 */
export function resonanceBonusFor(outcome: CombatOutcome): number {
  switch (outcome) {
    case 'victory':
      return 10;
    case 'stalemate':
      return 3; // 도망보다 살짝 위
    case 'fled':
    case 'defeat':
      return 0;
  }
}

/** 결말 발생 시 화면 전환에 필요한 시점/메시지 */
export function isContinuing(state: Pick<CombatState, 'turn'>, outcome: CombatOutcome | null): boolean {
  return outcome === null && state.turn < TURN_LIMIT;
}

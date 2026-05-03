/* 종합 기여도 — 한 전투의 결의 형태 분류.
 * v2.3 §22.3 종합 기여도(DPS/힐/유틸/연계성 30%) Phase 0 단순화.
 *
 * Phase 0:
 *   - attack 횟수 / dialogue 횟수 / 도망 사용으로 결의 형태 4종 분류
 *   - 각 형태마다 짧은 한 줄 + 색조
 *
 * Phase 1+:
 *   - DPS · 힐 · 유틸 · 연계성 4축 정량 점수
 *   - 길드/팀 컨텍스트 시 동료 기여 비교
 */

import type { CombatOutcome } from '@/types/game';

export interface CombatStats {
  attackCount: number;
  dialogueCount: number;
  fleeCount: number;
  totalTurns: number;
}

export type ContributionShape = 'sword' | 'word' | 'balance' | 'pause';

interface ShapeMeta {
  id: ContributionShape;
  label: string;
  description: string;
  /** Tailwind 색조 — origin(검) / resonance(말) / fg-primary(균형) / fg-muted(잠시) */
  color: string;
}

export const SHAPE_META: Record<ContributionShape, ShapeMeta> = {
  sword: {
    id: 'sword',
    label: '검의 결',
    description: '너의 손이 먼저 답을 정했다.',
    color: 'text-origin',
  },
  word: {
    id: 'word',
    label: '말의 결',
    description: '너의 입이 먼저 거리에 닿았다.',
    color: 'text-resonance',
  },
  balance: {
    id: 'balance',
    label: '균형의 결',
    description: '검과 말이 한 박자에 함께 움직였다.',
    color: 'text-fg-primary',
  },
  pause: {
    id: 'pause',
    label: '잠시의 결',
    description: '너는 거리에 결을 두지 않고 보내주었다.',
    color: 'text-fg-muted',
  },
};

/** 전투 통계 → 결의 형태 분류.
 *  - 도망 사용 또는 양쪽 합 < 2: pause
 *  - attack > dialogue + 2: sword
 *  - dialogue > attack + 2: word
 *  - 그 외 (비등): balance */
export function classifyShape(
  stats: CombatStats,
  outcome: CombatOutcome,
): ContributionShape {
  const total = stats.attackCount + stats.dialogueCount;
  if (outcome === 'fled' || stats.fleeCount > 0 || total < 2) return 'pause';
  if (stats.attackCount > stats.dialogueCount + 2) return 'sword';
  if (stats.dialogueCount > stats.attackCount + 2) return 'word';
  return 'balance';
}

/* enemyVariation — 같은 이름의 잊혀진 자도 매번 조금씩 다르게.
 *
 * 사용자 의도:
 *   "같은 이름의 몹일지라도 조금씩 변화를 주자. 작은 레인지 안에서 스탯과
 *    스킬 같은 것들의 랜덤성을 부여하자. 똑같은 몹을 또 만났을 때 과거
 *    만났던 몹의 스탯과 스킬을 보여주지만 실제로 그것과 일치하는지는
 *    아무도 알 수 없는 걸로 하자. 전투하다가 서서히 드러나게 하자."
 *
 * Phase 0:
 *   - HP ±10% variance (Math.random 기반 — 매 만남마다 다름)
 *   - 도감의 lastObservedMaxHp는 마지막 만남의 어림 — 새 instance는 다를 수 있음
 *
 * Phase 1+:
 *   - 스킬 풀에서 랜덤 1~2개 (LLM이 캐릭터 컨텍스트 기반 선택)
 *   - 약점 / 저항 변동
 *   - 결정적 seed (사용자별 + 위치별 H3 hex)
 */

import type { EnemyArchetype } from '@/services/llm/mockData/combatNarrations';

export interface EnemyInstance {
  name: string;
  description: string;
  encounter: string;
  hp: number;
  maxHp: number;
}

const HP_VARIANCE = 0.1; // ±10%

/** archetype + seed → EnemyInstance with stat variation. */
export function instantiateEnemy(
  archetype: EnemyArchetype,
  seed: number = Math.random(),
): EnemyInstance {
  // seed [0, 1) → variance [-0.1, +0.1)
  const variance = (seed * 2 - 1) * HP_VARIANCE;
  const variedHp = Math.max(1, Math.round(archetype.hp * (1 + variance)));
  return {
    name: archetype.name,
    description: archetype.description,
    encounter: archetype.encounter,
    hp: variedHp,
    maxHp: variedHp,
  };
}

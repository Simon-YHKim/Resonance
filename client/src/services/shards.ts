/* 기억의 조각 — 5체 보스 각각의 드롭. 엘든링식 Remembrance 시스템.
 *
 * v2.2 §18.2 적용:
 *   - 첫 클리어: 100% 보장 드롭
 *   - 이후: 4% 드롭률
 *   - 잡몹: 0% (Phase 0는 보스만)
 *
 * Phase 0: 컬렉션 의미만 (5/5 모음의 보상감).
 * Phase 1+: 1조각 = 스킬 1슬롯 흡수 (v2.2 §18.2 후속).
 */

import type { ShardId } from '@/types/game';

interface ShardMeta {
  id: ShardId;
  /** 5체 보스 archetype 이름과 대응 */
  bossName: string;
  /** 인벤토리 표시 이름 */
  label: string;
  /** 짧은 묘사 — 시트 인벤토리에 노출 */
  description: string;
}

export const SHARD_META: Record<ShardId, ShardMeta> = {
  'shed-namecard': {
    id: 'shed-namecard',
    bossName: '잊혀진 자 — 남겨진 거인',
    label: '못 건넨 명함의 조각',
    description:
      '누구에게도 닿지 못한 채 굳어버린 명함의 한 모서리. 회의실의 빈 자리 냄새가 옅게 남아 있다.',
  },
  'river-glance': {
    id: 'river-glance',
    bossName: '잊혀진 자 — 흐르는 그림자',
    label: '강물의 한 자국',
    description:
      '한 사람의 윤곽이 비치다 사라진 자리에 남은 결. 손에 닿으면 한 박자 늦게 차다.',
  },
  'folded-page': {
    id: 'folded-page',
    bossName: '잊혀진 자 — 미루는 학자',
    label: '미뤄둔 페이지의 조각',
    description:
      '펼쳐두고 끝내 덮어버린 책의 한 모서리. 다음으로 미뤄둔 답이 거기 적혀 있었던 것 같다.',
  },
  'half-wave': {
    id: 'half-wave',
    bossName: '잊혀진 자 — 떠난 친구들',
    label: '흔들다 만 손의 조각',
    description:
      '인사하다 닿지 못한 손짓이 굳어 만들어진 결정. 골목의 모퉁이 자국이 함께 굳어 있다.',
  },
  'first-step': {
    id: 'first-step',
    bossName: '잊혀진 자 — 원의 아이',
    label: '가장 처음 자리의 조각',
    description:
      '회색 운동장 한가운데 작은 발자국이 한 번 찍혔다 사라진 자리. 가장 처음 잊은 자의 흔적.',
  },
};

const ALL_SHARD_IDS: ReadonlyArray<ShardId> = Object.keys(SHARD_META) as ShardId[];

/** 보스 archetype 이름으로부터 해당 ShardId 조회. 매칭 없으면 null. */
export function shardForBoss(bossName: string): ShardId | null {
  for (const id of ALL_SHARD_IDS) {
    if (SHARD_META[id].bossName === bossName) return id;
  }
  return null;
}

/** 드롭 판정 — v2.2 §18.2 룰.
 *  @param alreadyOwned 이 조각을 이미 가지고 있는지
 *  @param rng 0~1 랜덤 (테스트 가능하게 주입)
 *  @returns true = 드롭 */
export function rollShardDrop(alreadyOwned: boolean, rng: number): boolean {
  if (!alreadyOwned) return true; // 첫 클리어 100%
  return rng < 0.04; // 이후 4%
}

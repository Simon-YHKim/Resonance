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
  'lost-bag': {
    id: 'lost-bag',
    bossName: '잊혀진 자 — 어린 시절의 잔해',
    label: '잃은 가방의 조각',
    description: '한 번도 메지 못한 가방 어깨끈의 끝자락. 안에 든 것은 더 이상 보이지 않는다.',
  },
  'sealed-lips': {
    id: 'sealed-lips',
    bossName: '잊혀진 자 — 청소년의 침묵',
    label: '굳은 입술의 조각',
    description: '말을 한 번도 흘리지 않은 채로 굳어버린 입술의 한 조각. 차갑다.',
  },
  'pressed-shirt': {
    id: 'pressed-shirt',
    bossName: '잊혀진 자 — 어른의 가면',
    label: '다려진 셔츠의 조각',
    description: '옷깃 안쪽의 작은 얼룩이 굳은 셔츠 자락. 너의 손에 익숙한 빳빳함.',
  },
  'half-smile': {
    id: 'half-smile',
    bossName: '잊혀진 자 — 청년의 거짓말',
    label: '한쪽만 올라간 미소의 조각',
    description: '거짓 위로의 미소가 굳어 만들어진 작은 결정. 만지면 한 박자 늦게 따뜻하다.',
  },
  'small-hand': {
    id: 'small-hand',
    bossName: '잊혀진 자 — 어린 너',
    label: '작은 손의 조각',
    description: '너의 손바닥보다 작은 손이 한 번 너를 잡았다 놓은 자리. 가장 처음 잊은 자의 흔적.',
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

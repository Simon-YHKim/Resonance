/* ShopItem — 기억의 시장 (v2.2 §18 좌판 거래).
 *
 * Phase 0: 3 아이템, 기억의 조각으로 즉시 효과.
 * Phase 1+:
 *   - 시장의 노파(NPC)와 직접 대화로 거래
 *   - 영구 인벤토리 (드롭/사용 분리)
 *   - LLM이 "그 조각으로 무엇을 살 수 있을까?" 동적 안내
 *
 * 효과는 store action으로 분리 — 변경 시점이 명확.
 */

export type ShopItemId = 'small-comfort' | 'one-silence' | 'short-breath';

export interface ShopItem {
  id: ShopItemId;
  name: string;
  description: string;
  /** 구매 비용 (기억의 조각 개수) */
  costShards: number;
  /** 효과 한 줄 — UI에 노출 */
  effectLabel: string;
  /** 구매 후 알림 한 줄 (시적) */
  flavorOnPurchase: string;
}

export const SHOP_ITEMS: ReadonlyArray<ShopItem> = [
  {
    id: 'small-comfort',
    name: '작은 위로',
    description:
      '노파가 한 손으로 너의 어깨를 짧게 두드린다. 그것이 너의 잔향을 한 박자 더 흘러가게 한다.',
    costShards: 1,
    effectLabel: '잔잔 +30',
    flavorOnPurchase: '너의 어깨에 한 박자의 무게가 잠시 얹혔다. 그러고 곧 가벼워진다.',
  },
  {
    id: 'one-silence',
    name: '한 번의 침묵',
    description:
      '잿빛 천 한 조각. 너의 사라진 자국 위에 잠시 덮인다. 한 번의 사라짐을 지운다.',
    costShards: 2,
    effectLabel: '사라진 자국 −1',
    flavorOnPurchase: '한 번의 사라짐이, 거리에서도 너에게서도 잠시 벗겨진다.',
  },
  {
    id: 'short-breath',
    name: '잠시 숨 고름',
    description:
      '향로의 연기를 한 모금. 너의 잔향이 깊은 한 자리만큼 더 흘러간다.',
    costShards: 3,
    effectLabel: '잔잔 +100',
    flavorOnPurchase: '한 모금의 향이 너의 안에서 한 자리를 더 만들어낸다.',
  },
];

export function findShopItem(id: ShopItemId): ShopItem | null {
  return SHOP_ITEMS.find((it) => it.id === id) ?? null;
}

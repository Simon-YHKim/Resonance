import { describe, expect, it } from 'vitest';
import { SHOP_ITEMS, findShopItem } from '../shop';

describe('SHOP_ITEMS', () => {
  it('has 3 items with required fields', () => {
    expect(SHOP_ITEMS).toHaveLength(3);
    for (const item of SHOP_ITEMS) {
      expect(item.id.length).toBeGreaterThan(0);
      expect(item.name.length).toBeGreaterThan(0);
      expect(item.description.length).toBeGreaterThan(0);
      expect(item.costShards).toBeGreaterThan(0);
      expect(item.effectLabel.length).toBeGreaterThan(0);
      expect(item.flavorOnPurchase.length).toBeGreaterThan(0);
    }
  });

  it('all 3 ids are unique', () => {
    const ids = new Set(SHOP_ITEMS.map((it) => it.id));
    expect(ids.size).toBe(3);
  });

  it('costs are 1 / 2 / 3 (ascending)', () => {
    const costs = SHOP_ITEMS.map((it) => it.costShards).sort();
    expect(costs).toEqual([1, 2, 3]);
  });

  it('expected items by id', () => {
    expect(findShopItem('small-comfort')?.name).toBe('작은 위로');
    expect(findShopItem('one-silence')?.name).toBe('한 번의 침묵');
    expect(findShopItem('short-breath')?.name).toBe('잠시 숨 고름');
  });
});

describe('findShopItem', () => {
  it('returns null for unknown id', () => {
    // @ts-expect-error invalid id 테스트
    expect(findShopItem('unknown')).toBeNull();
  });
});

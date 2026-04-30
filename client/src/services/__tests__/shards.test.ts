import { describe, expect, it } from 'vitest';
import { SHARD_META, rollShardDrop, shardForBoss } from '../shards';

describe('SHARD_META', () => {
  it('has all 5 shards with non-empty fields', () => {
    const ids = Object.keys(SHARD_META) as Array<keyof typeof SHARD_META>;
    expect(ids).toHaveLength(5);
    for (const id of ids) {
      const meta = SHARD_META[id];
      expect(meta.id).toBe(id);
      expect(meta.bossName.length).toBeGreaterThan(0);
      expect(meta.label.length).toBeGreaterThan(0);
      expect(meta.description.length).toBeGreaterThan(0);
    }
  });

  it('all boss names start with 잊혀진 자', () => {
    for (const meta of Object.values(SHARD_META)) {
      expect(meta.bossName).toContain('잊혀진 자');
    }
  });
});

describe('shardForBoss (v1.2 5체)', () => {
  it('returns matching shard id for each boss', () => {
    expect(shardForBoss('잊혀진 자 — 남겨진 거인')).toBe('shed-namecard');
    expect(shardForBoss('잊혀진 자 — 흐르는 그림자')).toBe('river-glance');
    expect(shardForBoss('잊혀진 자 — 미루는 학자')).toBe('folded-page');
    expect(shardForBoss('잊혀진 자 — 떠난 친구들')).toBe('half-wave');
    expect(shardForBoss('잊혀진 자 — 원의 아이')).toBe('first-step');
  });

  it('returns null for unknown boss', () => {
    expect(shardForBoss('알 수 없는 적')).toBeNull();
    expect(shardForBoss('')).toBeNull();
  });

  it('returns null for old (pre-v1.2) boss names', () => {
    expect(shardForBoss('잊혀진 자 — 어린 시절의 잔해')).toBeNull();
    expect(shardForBoss('잊혀진 자 — 어린 너')).toBeNull();
  });
});

describe('rollShardDrop', () => {
  it('always drops on first clear (alreadyOwned = false)', () => {
    expect(rollShardDrop(false, 0)).toBe(true);
    expect(rollShardDrop(false, 0.5)).toBe(true);
    expect(rollShardDrop(false, 0.99)).toBe(true);
  });

  it('drops at 4% rate when already owned', () => {
    expect(rollShardDrop(true, 0)).toBe(true);
    expect(rollShardDrop(true, 0.039)).toBe(true);
    expect(rollShardDrop(true, 0.04)).toBe(false);
    expect(rollShardDrop(true, 0.5)).toBe(false);
    expect(rollShardDrop(true, 0.99)).toBe(false);
  });
});

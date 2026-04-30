import { describe, expect, it } from 'vitest';
import { recordEncounter } from '../bestiary';

describe('recordEncounter', () => {
  it('creates new entry on first encounter', () => {
    const e = recordEncounter(undefined, '잊혀진 자 — 어린 시절의 잔해', 60, 'victory');
    expect(e.bossName).toBe('잊혀진 자 — 어린 시절의 잔해');
    expect(e.encounterCount).toBe(1);
    expect(e.lastObservedMaxHp).toBe(60);
    expect(e.lastOutcome).toBe('victory');
    expect(e.firstSeenAt).toBeGreaterThan(0);
    expect(e.lastSeenAt).toBe(e.firstSeenAt);
  });

  it('increments count and updates last seen on subsequent encounters', () => {
    const first = recordEncounter(undefined, 'X', 60, 'victory');
    // 시간 차이 보장 — 1ms 대기
    const later = { ...first, firstSeenAt: first.firstSeenAt - 1000 };
    const next = recordEncounter(later, 'X', 65, 'defeat');
    expect(next.encounterCount).toBe(2);
    expect(next.firstSeenAt).toBe(later.firstSeenAt); // 첫 만남 시각 유지
    expect(next.lastSeenAt).toBeGreaterThanOrEqual(later.firstSeenAt);
    expect(next.lastObservedMaxHp).toBe(65); // 마지막 관찰값 갱신
    expect(next.lastOutcome).toBe('defeat');
  });

  it('preserves firstSeenAt across multiple encounters', () => {
    const first = recordEncounter(undefined, 'Y', 75, 'fled');
    const second = recordEncounter(first, 'Y', 80, 'victory');
    const third = recordEncounter(second, 'Y', 78, 'stalemate');
    expect(third.firstSeenAt).toBe(first.firstSeenAt);
    expect(third.encounterCount).toBe(3);
  });
});

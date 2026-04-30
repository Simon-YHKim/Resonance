import { describe, expect, it } from 'vitest';
import { mockLocation, GRID, cellLabelAt } from '../MockLocationService';

describe('MockLocationService.getInitialState', () => {
  it('returns 4 pins on a 4×4 grid', () => {
    const s = mockLocation.getInitialState('novice');
    expect(s.pins).toHaveLength(4);
    expect(s.cells).toHaveLength(GRID.w * GRID.h);
    expect(s.cells).toHaveLength(16);
  });

  it('player starts at (1, 2) — 횡단보도 사거리', () => {
    const s = mockLocation.getInitialState('novice');
    expect(s.player).toEqual({ x: 1, y: 2 });
  });

  it('all pins have unique IDs and 4 corners positions', () => {
    const s = mockLocation.getInitialState('novice');
    const ids = new Set(s.pins.map((p) => p.id));
    expect(ids.size).toBe(4);
    const corners = s.pins.map((p) => `${p.position.x},${p.position.y}`);
    expect(corners).toContain('0,0');
    expect(corners).toContain('3,0');
    expect(corners).toContain('0,3');
    expect(corners).toContain('3,3');
  });

  it('pins inherit currentTier as bossTier', () => {
    const s = mockLocation.getInitialState('resonant');
    expect(s.pins.every((p) => p.bossTier === 'resonant')).toBe(true);
  });
});

describe('MockLocationService.move', () => {
  it('moves player by dx/dy', () => {
    const s = mockLocation.getInitialState('novice');
    const next = mockLocation.move(s, 1, 0);
    expect(next.player).toEqual({ x: 2, y: 2 });
  });

  it('clamps to grid boundaries', () => {
    const s = mockLocation.getInitialState('novice');
    // start (1,2). 9 steps right → clamped to x=3
    let cur = s;
    for (let i = 0; i < 9; i++) cur = mockLocation.move(cur, 1, 0);
    expect(cur.player.x).toBe(3);
    // 9 steps up → clamped to y=0
    for (let i = 0; i < 9; i++) cur = mockLocation.move(cur, 0, -1);
    expect(cur.player.y).toBe(0);
  });

  it('preserves pins on move', () => {
    const s = mockLocation.getInitialState('novice');
    const next = mockLocation.move(s, 1, 0);
    expect(next.pins).toHaveLength(4);
  });
});

describe('MockLocationService.pinAt', () => {
  it('returns pin when player is on its position', () => {
    const s = mockLocation.getInitialState('novice');
    expect(mockLocation.pinAt(s, { x: 0, y: 0 })?.id).toBe('p-nw');
    expect(mockLocation.pinAt(s, { x: 3, y: 3 })?.id).toBe('p-se');
  });

  it('returns null when no pin', () => {
    const s = mockLocation.getInitialState('novice');
    expect(mockLocation.pinAt(s, { x: 1, y: 2 })).toBeNull(); // 시작 위치
    expect(mockLocation.pinAt(s, { x: 2, y: 1 })).toBeNull();
  });
});

describe('MockLocationService.removePin', () => {
  it('removes pin by id', () => {
    const s = mockLocation.getInitialState('novice');
    const next = mockLocation.removePin(s, 'p-nw');
    expect(next.pins).toHaveLength(3);
    expect(next.pins.some((p) => p.id === 'p-nw')).toBe(false);
  });

  it('no-op for unknown id', () => {
    const s = mockLocation.getInitialState('novice');
    const next = mockLocation.removePin(s, 'p-unknown');
    expect(next.pins).toHaveLength(4);
  });
});

describe('cellLabelAt', () => {
  it('returns label for grid position', () => {
    expect(cellLabelAt({ x: 0, y: 0 })).toContain('옥상');
    expect(cellLabelAt({ x: 1, y: 1 })).toContain('편의점');
    expect(cellLabelAt({ x: 1, y: 2 })).toContain('횡단보도');
  });

  it('falls back to "거리" for out-of-grid', () => {
    expect(cellLabelAt({ x: 99, y: 99 })).toBe('거리');
  });
});

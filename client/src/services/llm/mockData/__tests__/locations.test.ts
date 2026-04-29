import { describe, expect, it } from 'vitest';
import { pickLocation, withLocation } from '../locations';

describe('pickLocation', () => {
  it('returns a non-empty string', () => {
    expect(pickLocation(0).length).toBeGreaterThan(0);
  });

  it('is deterministic — same seed → same location', () => {
    expect(pickLocation(42)).toBe(pickLocation(42));
  });

  it('different seeds typically produce different locations across the pool', () => {
    const picks = new Set<string>();
    for (let i = 0; i < 16; i++) picks.add(pickLocation(i));
    expect(picks.size).toBeGreaterThanOrEqual(4);
  });

  it('handles negative seeds without crashing (totalResonance never negative anyway)', () => {
    expect(() => pickLocation(-1)).not.toThrow();
    expect(pickLocation(-1).length).toBeGreaterThan(0);
  });
});

describe('withLocation', () => {
  it('prepends location prefix with newline separator', () => {
    const out = withLocation('잊혀진 자가 너를 본다.', 0);
    expect(out).toContain('잊혀진 자가 너를 본다.');
    expect(out.split('\n').length).toBe(2);
    expect(out.split('\n')[0].endsWith('.')).toBe(true);
  });

  it('does not strip the original encounter', () => {
    const original = '안개 속에서 그림자가 걸어 나온다.';
    expect(withLocation(original, 0)).toContain(original);
  });
});

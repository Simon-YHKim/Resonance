import { describe, expect, it } from 'vitest';
import {
  formatMomentTime,
  newMomentId,
  shortLineFor,
} from '../memoryMoments';

describe('shortLineFor — boss-specific (victory)', () => {
  it('어린 너 victory has 작은 손 motif', () => {
    expect(shortLineFor('victory', '잊혀진 자 — 어린 너')).toContain('작은 손');
  });

  it('청년의 거짓말 victory has 미소 motif', () => {
    expect(shortLineFor('victory', '잊혀진 자 — 청년의 거짓말')).toContain('미소');
  });

  it('어른의 가면 victory has 셔츠/얼룩 motif', () => {
    expect(shortLineFor('victory', '잊혀진 자 — 어른의 가면')).toMatch(/셔츠|얼룩/);
  });

  it('청소년의 침묵 victory has 입술 motif', () => {
    expect(shortLineFor('victory', '잊혀진 자 — 청소년의 침묵')).toContain('입술');
  });

  it('어린 시절의 잔해 victory has 가방 motif', () => {
    expect(shortLineFor('victory', '잊혀진 자 — 어린 시절의 잔해')).toContain('가방');
  });
});

describe('shortLineFor — non-victory outcomes', () => {
  it('defeat returns common line regardless of boss', () => {
    const a = shortLineFor('defeat', '잊혀진 자 — 어린 너');
    const b = shortLineFor('defeat', '잊혀진 자 — 어른의 가면');
    expect(a).toBe(b);
    expect(a).toContain('받아내지');
  });

  it('fled returns 도망 motif', () => {
    expect(shortLineFor('fled', '잊혀진 자 — 어린 너')).toContain('도망');
  });

  it('stalemate returns 안개 motif', () => {
    expect(shortLineFor('stalemate', '잊혀진 자 — 어른의 가면')).toContain('안개');
  });
});

describe('shortLineFor — D safety (no self-harm direct depiction)', () => {
  it('all returned lines avoid self-harm direct vocabulary', () => {
    const forbidden = ['자살', '자해', '죽었', '베었', '뛰어내'];
    const cases: Array<['victory' | 'defeat' | 'fled' | 'stalemate', string]> = [
      ['victory', '잊혀진 자 — 어린 너'],
      ['defeat', '잊혀진 자 — 어른의 가면'],
      ['fled', '잊혀진 자 — 어린 시절의 잔해'],
      ['stalemate', '잊혀진 자 — 청소년의 침묵'],
    ];
    for (const [outcome, boss] of cases) {
      const line = shortLineFor(outcome, boss);
      for (const word of forbidden) {
        expect(line).not.toContain(word);
      }
    }
  });
});

describe('newMomentId', () => {
  it('returns string with timestamp prefix', () => {
    const id = newMomentId();
    expect(typeof id).toBe('string');
    expect(id).toMatch(/^\d+-\d{4}$/);
  });

  it('produces different ids on rapid calls (random suffix)', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 50; i++) ids.add(newMomentId());
    // ts 충돌 가능성 있어도 random 4자리로 대부분 unique — 30+ unique이면 충분
    expect(ids.size).toBeGreaterThanOrEqual(30);
  });
});

describe('formatMomentTime', () => {
  it('formats as MM/DD HH:mm', () => {
    const ts = new Date(2026, 4, 30, 14, 5).getTime();
    expect(formatMomentTime(ts)).toBe('05/30 14:05');
  });

  it('pads single-digit values', () => {
    const ts = new Date(2026, 0, 1, 9, 7).getTime();
    expect(formatMomentTime(ts)).toBe('01/01 09:07');
  });
});

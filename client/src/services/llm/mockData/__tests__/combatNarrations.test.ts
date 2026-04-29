import { describe, expect, it } from 'vitest';
import {
  FORGETTER_OF_CHILDHOOD,
  FORGETTER_OF_ADOLESCENCE,
  FORGETTER_OF_ADULTHOOD,
  FORGETTER_OF_LATE_ADULT,
  FORGETTER_OF_INNER_CHILD,
  pickForgetter,
} from '../combatNarrations';

describe('5-체 잊혀진 자 archetypes', () => {
  it('all 5 archetypes have non-empty name/description/encounter and ascending HP', () => {
    const all = [
      FORGETTER_OF_CHILDHOOD,
      FORGETTER_OF_ADOLESCENCE,
      FORGETTER_OF_ADULTHOOD,
      FORGETTER_OF_LATE_ADULT,
      FORGETTER_OF_INNER_CHILD,
    ];
    for (const a of all) {
      expect(a.name.length).toBeGreaterThan(0);
      expect(a.description.length).toBeGreaterThan(0);
      expect(a.encounter.length).toBeGreaterThan(0);
      expect(a.hp).toBeGreaterThan(0);
    }
    // 시간 역순으로 깊어지는 정점 — HP 단조 증가 (어려워짐)
    expect(FORGETTER_OF_CHILDHOOD.hp).toBeLessThan(FORGETTER_OF_ADOLESCENCE.hp);
    expect(FORGETTER_OF_ADOLESCENCE.hp).toBeLessThan(FORGETTER_OF_ADULTHOOD.hp);
    expect(FORGETTER_OF_ADULTHOOD.hp).toBeLessThan(FORGETTER_OF_LATE_ADULT.hp);
    expect(FORGETTER_OF_LATE_ADULT.hp).toBeLessThan(FORGETTER_OF_INNER_CHILD.hp);
  });
});

describe('pickForgetter — tier 매핑', () => {
  it('novice → 어린 시절의 잔해', () => {
    expect(pickForgetter('novice', 0)).toBe(FORGETTER_OF_CHILDHOOD);
    expect(pickForgetter('novice', 25)).toBe(FORGETTER_OF_CHILDHOOD);
  });

  it('echo → 청소년의 침묵', () => {
    expect(pickForgetter('echo', 50)).toBe(FORGETTER_OF_ADOLESCENCE);
    expect(pickForgetter('echo', 120)).toBe(FORGETTER_OF_ADOLESCENCE);
  });

  it('resonant → 어른의 가면', () => {
    expect(pickForgetter('resonant', 150)).toBe(FORGETTER_OF_ADULTHOOD);
    expect(pickForgetter('resonant', 350)).toBe(FORGETTER_OF_ADULTHOOD);
  });

  it('origin (400~999) → 청년의 거짓말 (4체)', () => {
    expect(pickForgetter('origin', 400)).toBe(FORGETTER_OF_LATE_ADULT);
    expect(pickForgetter('origin', 700)).toBe(FORGETTER_OF_LATE_ADULT);
    expect(pickForgetter('origin', 999)).toBe(FORGETTER_OF_LATE_ADULT);
  });

  it('origin (1000+) → 어린 너 (5체 최종)', () => {
    expect(pickForgetter('origin', 1000)).toBe(FORGETTER_OF_INNER_CHILD);
    expect(pickForgetter('origin', 5000)).toBe(FORGETTER_OF_INNER_CHILD);
  });

  it('totalResonance default 0 → origin tier 도달 자체가 불가능 (방어적 기본값 OK)', () => {
    // tier가 origin이면 totalResonance >= 400 보장되므로
    // 기본값 0은 사실상 호출 불가능. 하지만 default 동작이 4체로 감 (무한 루프/에러 X).
    expect(pickForgetter('origin')).toBe(FORGETTER_OF_LATE_ADULT);
  });
});

describe('5체 보스 안전 정책', () => {
  it('어린 너 묘사에 자해 직접 어휘 미포함 (자살예방법 §19조의2)', () => {
    const text = `${FORGETTER_OF_INNER_CHILD.description} ${FORGETTER_OF_INNER_CHILD.encounter}`;
    const forbidden = ['자살', '자해', '죽었', '베었', '뛰어내'];
    for (const word of forbidden) {
      expect(text).not.toContain(word);
    }
  });
});

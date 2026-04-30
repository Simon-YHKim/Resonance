import { describe, expect, it } from 'vitest';
import {
  BOSS_LEFT_GIANT,
  BOSS_FLOWING_SHADOW,
  BOSS_PROCRASTINATING_SCHOLAR,
  BOSS_DEPARTED_FRIENDS,
  BOSS_CHILD_OF_ORIGIN,
  ALL_ARCHETYPES,
  pickForgetter,
} from '../combatNarrations';

describe('v1.2 5체 보스 archetypes', () => {
  it('all 5 archetypes have non-empty name/description/encounter and ascending HP', () => {
    const all = [
      BOSS_LEFT_GIANT,
      BOSS_FLOWING_SHADOW,
      BOSS_PROCRASTINATING_SCHOLAR,
      BOSS_DEPARTED_FRIENDS,
      BOSS_CHILD_OF_ORIGIN,
    ];
    for (const a of all) {
      expect(a.name.length).toBeGreaterThan(0);
      expect(a.description.length).toBeGreaterThan(0);
      expect(a.encounter.length).toBeGreaterThan(0);
      expect(a.background.length).toBeGreaterThan(0);
      expect(a.hp).toBeGreaterThan(0);
    }
    // 시간 역순으로 깊어지는 정점 — HP 단조 증가 (어려워짐)
    expect(BOSS_LEFT_GIANT.hp).toBeLessThan(BOSS_FLOWING_SHADOW.hp);
    expect(BOSS_FLOWING_SHADOW.hp).toBeLessThan(BOSS_PROCRASTINATING_SCHOLAR.hp);
    expect(BOSS_PROCRASTINATING_SCHOLAR.hp).toBeLessThan(BOSS_DEPARTED_FRIENDS.hp);
    expect(BOSS_DEPARTED_FRIENDS.hp).toBeLessThan(BOSS_CHILD_OF_ORIGIN.hp);
  });

  it('all 5 carry era + place metadata (v1.2)', () => {
    expect(BOSS_LEFT_GIANT.era).toBe('30~40대');
    expect(BOSS_LEFT_GIANT.place).toBe('강남');
    expect(BOSS_FLOWING_SHADOW.era).toBe('20대');
    expect(BOSS_FLOWING_SHADOW.place).toBe('한강');
    expect(BOSS_PROCRASTINATING_SCHOLAR.era).toBe('17~19세');
    expect(BOSS_PROCRASTINATING_SCHOLAR.place).toBe('종로');
    expect(BOSS_DEPARTED_FRIENDS.era).toBe('8~12세');
    expect(BOSS_DEPARTED_FRIENDS.place).toBe('동네 골목');
    expect(BOSS_CHILD_OF_ORIGIN.era).toBe('5~7세');
    expect(BOSS_CHILD_OF_ORIGIN.place).toBe('회색 운동장');
  });

  it('ALL_ARCHETYPES contains all 5 in time-reverse order (oldest era first)', () => {
    expect(ALL_ARCHETYPES).toHaveLength(5);
    expect(ALL_ARCHETYPES[0]).toBe(BOSS_LEFT_GIANT);
    expect(ALL_ARCHETYPES[4]).toBe(BOSS_CHILD_OF_ORIGIN);
  });
});

describe('pickForgetter — tier 매핑 (v1.2)', () => {
  it('novice → 남겨진 거인', () => {
    expect(pickForgetter('novice', 0)).toBe(BOSS_LEFT_GIANT);
    expect(pickForgetter('novice', 25)).toBe(BOSS_LEFT_GIANT);
  });

  it('echo → 흐르는 그림자', () => {
    expect(pickForgetter('echo', 50)).toBe(BOSS_FLOWING_SHADOW);
    expect(pickForgetter('echo', 120)).toBe(BOSS_FLOWING_SHADOW);
  });

  it('resonant → 미루는 학자', () => {
    expect(pickForgetter('resonant', 150)).toBe(BOSS_PROCRASTINATING_SCHOLAR);
    expect(pickForgetter('resonant', 350)).toBe(BOSS_PROCRASTINATING_SCHOLAR);
  });

  it('origin (400~999) → 떠난 친구들 (4체 / 2/3 변곡점)', () => {
    expect(pickForgetter('origin', 400)).toBe(BOSS_DEPARTED_FRIENDS);
    expect(pickForgetter('origin', 700)).toBe(BOSS_DEPARTED_FRIENDS);
    expect(pickForgetter('origin', 999)).toBe(BOSS_DEPARTED_FRIENDS);
  });

  it('origin (1000+) → 원의 아이 (5체 최종)', () => {
    expect(pickForgetter('origin', 1000)).toBe(BOSS_CHILD_OF_ORIGIN);
    expect(pickForgetter('origin', 5000)).toBe(BOSS_CHILD_OF_ORIGIN);
  });

  it('totalResonance default 0 → origin tier 도달 자체가 불가능 (방어적 기본값 OK)', () => {
    // tier가 origin이면 totalResonance >= 400 보장되므로
    // 기본값 0은 사실상 호출 불가능. 하지만 default 동작이 4체로 감 (무한 루프/에러 X).
    expect(pickForgetter('origin')).toBe(BOSS_DEPARTED_FRIENDS);
  });
});

describe('5체 보스 안전 정책', () => {
  it('원의 아이 묘사에 자해 직접 어휘 미포함 (자살예방법 §19조의2)', () => {
    const text = `${BOSS_CHILD_OF_ORIGIN.description} ${BOSS_CHILD_OF_ORIGIN.encounter} ${BOSS_CHILD_OF_ORIGIN.background}`;
    const forbidden = ['자살', '자해', '죽었', '베었', '뛰어내'];
    for (const word of forbidden) {
      expect(text).not.toContain(word);
    }
  });
});

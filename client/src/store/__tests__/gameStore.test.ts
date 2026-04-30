import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useGame } from '../gameStore';
import type { CombatState } from '@/types/game';

const initialState = {
  screen: 'title' as const,
  totalResonance: 0,
  character: null,
  pendingNickname: null,
  combat: null,
  lastOutcome: null,
  lastCombatGain: null,
  resonanceBeforeLastCombat: null,
  combatCount: 0,
  shards: [],
  lastShardGained: null,
  anchorPoints: { family: 0, home: 0, school: 0, work: 0 },
  memoryMoments: [],
  lastCombatStats: null,
  vanishCount: 0,
  combatLog: [],
  encounteredBosses: {},
};

describe('gameStore', () => {
  beforeEach(() => {
    useGame.setState(initialState);
  });

  afterEach(() => {
    localStorage.removeItem('resonance:game');
  });

  it('starts on title with empty totals', () => {
    const s = useGame.getState();
    expect(s.screen).toBe('title');
    expect(s.totalResonance).toBe(0);
    expect(s.character).toBeNull();
    expect(s.pendingNickname).toBeNull();
  });

  it('goTo updates screen', () => {
    useGame.getState().goTo('nicknameInput');
    expect(useGame.getState().screen).toBe('nicknameInput');
  });

  it('setPendingNickname stores trimmed value', () => {
    useGame.getState().setPendingNickname('엄마');
    expect(useGame.getState().pendingNickname).toBe('엄마');
  });

  it('setCharacter clears pendingNickname', () => {
    useGame.getState().setPendingNickname('민수');
    useGame.getState().setCharacter({
      nickname: '민수',
      category: 'B',
      characterConcept: '동명의 행인',
      appearance: '...',
      startingClass: '동명의 행인',
      linkedKeywords: ['추억'],
      categoryBonuses: { resonanceLink: 50 },
      voiceFirstLine: '...',
      createdAt: 0,
    });
    const s = useGame.getState();
    expect(s.character?.nickname).toBe('민수');
    expect(s.pendingNickname).toBeNull();
  });

  it('startCombat sets combat and clears lastOutcome', () => {
    const combat: CombatState = {
      player: { hp: 100, maxHp: 100, stamina: 100, maxStamina: 100 },
      enemy: { name: 'X', description: 'Y', encounter: 'Z', hp: 60, maxHp: 60 },
      turn: 0,
      resonance: 0,
    };
    useGame.setState({ lastOutcome: 'defeat' });
    useGame.getState().startCombat(combat);
    expect(useGame.getState().combat).toEqual(combat);
    expect(useGame.getState().lastOutcome).toBeNull();
  });

  it('updateCombat patches existing combat', () => {
    const combat: CombatState = {
      player: { hp: 100, maxHp: 100, stamina: 100, maxStamina: 100 },
      enemy: { name: 'X', description: 'Y', encounter: 'Z', hp: 60, maxHp: 60 },
      turn: 0,
      resonance: 0,
    };
    useGame.getState().startCombat(combat);
    useGame.getState().updateCombat({ turn: 2, resonance: 5 });
    expect(useGame.getState().combat?.turn).toBe(2);
    expect(useGame.getState().combat?.resonance).toBe(5);
    expect(useGame.getState().combat?.player.hp).toBe(100);
  });

  it('updateCombat is no-op when combat is null', () => {
    useGame.getState().updateCombat({ turn: 99 });
    expect(useGame.getState().combat).toBeNull();
  });

  it('endCombat accumulates totalResonance and clears combat', () => {
    useGame.setState({ totalResonance: 30 });
    const combat: CombatState = {
      player: { hp: 100, maxHp: 100, stamina: 100, maxStamina: 100 },
      enemy: { name: 'X', description: 'Y', encounter: 'Z', hp: 60, maxHp: 60 },
      turn: 0,
      resonance: 0,
    };
    useGame.getState().startCombat(combat);
    useGame.getState().endCombat('victory', 25);
    const s = useGame.getState();
    expect(s.lastOutcome).toBe('victory');
    expect(s.totalResonance).toBe(55);
    expect(s.combat).toBeNull();
  });

  it('startCombat captures totalResonance into resonanceBeforeLastCombat', () => {
    useGame.setState({ totalResonance: 145 });
    const combat: CombatState = {
      player: { hp: 100, maxHp: 100, stamina: 100, maxStamina: 100 },
      enemy: { name: 'X', description: 'Y', encounter: 'Z', hp: 60, maxHp: 60 },
      turn: 0,
      resonance: 0,
    };
    useGame.getState().startCombat(combat);
    expect(useGame.getState().resonanceBeforeLastCombat).toBe(145);
  });

  it('endCombat records lastCombatGain', () => {
    const combat: CombatState = {
      player: { hp: 100, maxHp: 100, stamina: 100, maxStamina: 100 },
      enemy: { name: 'X', description: 'Y', encounter: 'Z', hp: 60, maxHp: 60 },
      turn: 0,
      resonance: 0,
    };
    useGame.getState().startCombat(combat);
    useGame.getState().endCombat('victory', 38);
    expect(useGame.getState().lastCombatGain).toBe(38);
  });

  it('endCombat increments combatCount', () => {
    const combat: CombatState = {
      player: { hp: 100, maxHp: 100, stamina: 100, maxStamina: 100 },
      enemy: { name: 'X', description: 'Y', encounter: 'Z', hp: 60, maxHp: 60 },
      turn: 0,
      resonance: 0,
    };
    expect(useGame.getState().combatCount).toBe(0);
    useGame.getState().startCombat(combat);
    useGame.getState().endCombat('victory', 10);
    expect(useGame.getState().combatCount).toBe(1);
    useGame.getState().startCombat(combat);
    useGame.getState().endCombat('defeat', 5);
    expect(useGame.getState().combatCount).toBe(2);
  });

  it('endCombat increments vanishCount only on defeat', () => {
    const combat: CombatState = {
      player: { hp: 100, maxHp: 100, stamina: 100, maxStamina: 100 },
      enemy: { name: 'X', description: 'Y', encounter: 'Z', hp: 60, maxHp: 60 },
      turn: 0,
      resonance: 0,
    };
    expect(useGame.getState().vanishCount).toBe(0);
    useGame.getState().startCombat(combat);
    useGame.getState().endCombat('victory', 10);
    expect(useGame.getState().vanishCount).toBe(0); // victory는 X
    useGame.getState().startCombat(combat);
    useGame.getState().endCombat('defeat', 0);
    expect(useGame.getState().vanishCount).toBe(1);
    useGame.getState().startCombat(combat);
    useGame.getState().endCombat('fled', 0);
    expect(useGame.getState().vanishCount).toBe(1); // fled는 X
    useGame.getState().startCombat(combat);
    useGame.getState().endCombat('defeat', 0);
    expect(useGame.getState().vanishCount).toBe(2);
  });

  it('addShard appends and sets lastShardGained', () => {
    useGame.getState().addShard('shed-namecard');
    expect(useGame.getState().shards).toHaveLength(1);
    expect(useGame.getState().shards[0].id).toBe('shed-namecard');
    expect(useGame.getState().lastShardGained).toBe('shed-namecard');

    useGame.getState().addShard('river-glance');
    expect(useGame.getState().shards).toHaveLength(2);
    expect(useGame.getState().lastShardGained).toBe('river-glance');
  });

  it('addShard allows duplicates (4% drops accumulate)', () => {
    useGame.getState().addShard('shed-namecard');
    useGame.getState().addShard('shed-namecard');
    expect(useGame.getState().shards).toHaveLength(2);
    expect(useGame.getState().shards.every((s) => s.id === 'shed-namecard')).toBe(true);
  });

  it('startCombat resets lastShardGained', () => {
    useGame.getState().addShard('shed-namecard');
    expect(useGame.getState().lastShardGained).toBe('shed-namecard');
    const combat: CombatState = {
      player: { hp: 100, maxHp: 100, stamina: 100, maxStamina: 100 },
      enemy: { name: 'X', description: 'Y', encounter: 'Z', hp: 60, maxHp: 60 },
      turn: 0,
      resonance: 0,
    };
    useGame.getState().startCombat(combat);
    expect(useGame.getState().lastShardGained).toBeNull();
    expect(useGame.getState().shards).toHaveLength(1);
  });

  it('addAnchorPoints increments specified anchors', () => {
    useGame.getState().addAnchorPoints(['family']);
    expect(useGame.getState().anchorPoints.family).toBe(1);
    useGame.getState().addAnchorPoints(['family', 'school']);
    expect(useGame.getState().anchorPoints.family).toBe(2);
    expect(useGame.getState().anchorPoints.school).toBe(1);
    expect(useGame.getState().anchorPoints.home).toBe(0);
    expect(useGame.getState().anchorPoints.work).toBe(0);
  });

  it('addAnchorPoints with empty array is no-op', () => {
    useGame.setState({ anchorPoints: { family: 5, home: 0, school: 0, work: 0 } });
    useGame.getState().addAnchorPoints([]);
    expect(useGame.getState().anchorPoints.family).toBe(5);
  });

  it('addMemoryMoment prepends (latest first)', () => {
    const m1 = {
      id: 'a',
      ts: 1,
      outcome: 'victory' as const,
      bossName: 'B1',
      resonanceAt: 10,
      nickname: '엄마',
    };
    const m2 = { ...m1, id: 'b', ts: 2 };
    useGame.getState().addMemoryMoment(m1);
    useGame.getState().addMemoryMoment(m2);
    expect(useGame.getState().memoryMoments[0].id).toBe('b');
    expect(useGame.getState().memoryMoments[1].id).toBe('a');
  });

  it('addMemoryMoment caps at 50 (oldest dropped)', () => {
    for (let i = 0; i < 60; i++) {
      useGame.getState().addMemoryMoment({
        id: `m${i}`,
        ts: i,
        outcome: 'victory',
        bossName: 'B',
        resonanceAt: i,
        nickname: '엄마',
      });
    }
    expect(useGame.getState().memoryMoments).toHaveLength(50);
    expect(useGame.getState().memoryMoments[0].id).toBe('m59');
    expect(useGame.getState().memoryMoments.some((m) => m.id === 'm0')).toBe(false);
  });

  it('reset clears shards / anchorPoints / memoryMoments', () => {
    useGame.getState().addShard('shed-namecard');
    useGame.setState({ anchorPoints: { family: 10, home: 5, school: 3, work: 1 } });
    useGame.getState().addMemoryMoment({
      id: 'a', ts: 1, outcome: 'victory', bossName: 'B', resonanceAt: 1, nickname: '엄마',
    });
    useGame.getState().reset();
    const s = useGame.getState();
    expect(s.shards).toHaveLength(0);
    expect(s.lastShardGained).toBeNull();
    expect(s.anchorPoints).toEqual({ family: 0, home: 0, school: 0, work: 0 });
    expect(s.memoryMoments).toHaveLength(0);
  });

  it('spendShards removes oldest shards (FIFO)', () => {
    useGame.getState().addShard('shed-namecard');
    useGame.getState().addShard('river-glance');
    useGame.getState().addShard('folded-page');
    expect(useGame.getState().shards).toHaveLength(3);
    useGame.getState().spendShards(2);
    expect(useGame.getState().shards).toHaveLength(1);
    expect(useGame.getState().shards[0].id).toBe('folded-page');
  });

  it('addResonance adds delta to totalResonance', () => {
    useGame.setState({ totalResonance: 100 });
    useGame.getState().addResonance(30);
    expect(useGame.getState().totalResonance).toBe(130);
    useGame.getState().addResonance(100);
    expect(useGame.getState().totalResonance).toBe(230);
  });

  it('restoreOneVanish decrements vanishCount, clamped at 0', () => {
    useGame.setState({ vanishCount: 2 });
    useGame.getState().restoreOneVanish();
    expect(useGame.getState().vanishCount).toBe(1);
    useGame.getState().restoreOneVanish();
    expect(useGame.getState().vanishCount).toBe(0);
    useGame.getState().restoreOneVanish();
    expect(useGame.getState().vanishCount).toBe(0); // 0 미만 X
  });

  it('reset preserves totalResonance (생애 누적)', () => {
    useGame.setState({ totalResonance: 100 });
    useGame.getState().reset();
    expect(useGame.getState().totalResonance).toBe(100);
  });
});

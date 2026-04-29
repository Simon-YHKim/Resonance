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
    // 다른 필드 유지
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

  it('reset clears character/combat/outcome but not implementation', () => {
    useGame.setState({ totalResonance: 100 });
    useGame.getState().reset();
    const s = useGame.getState();
    expect(s.screen).toBe('title');
    expect(s.character).toBeNull();
    expect(s.combat).toBeNull();
    expect(s.lastOutcome).toBeNull();
    expect(s.pendingNickname).toBeNull();
    // totalResonance는 reset에서 보존 (생애 누적)
    expect(s.totalResonance).toBe(100);
  });
});

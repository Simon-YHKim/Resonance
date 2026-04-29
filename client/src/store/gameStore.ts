import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  CharacterSheet,
  CombatOutcome,
  CombatState,
  Screen,
} from '@/types/game';

interface GameState {
  /** 현재 화면 */
  screen: Screen;
  /** 누적 잔잔 (생애 전체) */
  totalResonance: number;
  /** 마지막 생성된 캐릭터 (디바이스 1캐릭터 — Phase 0) */
  character: CharacterSheet | null;
  /** 닉네임 입력 → 캐릭터 생성 사이의 임시 보관값 */
  pendingNickname: string | null;
  /** 진행 중 전투 */
  combat: CombatState | null;
  /** 직전 전투 결말 */
  lastOutcome: CombatOutcome | null;
  /** 직전 전투에서 얻은 잔잔 (결말 화면 +N 표시용) */
  lastCombatGain: number | null;
  /** 직전 전투 시작 시점의 누적 잔잔 (tier 승급 감지용) */
  resonanceBeforeLastCombat: number | null;

  /* actions */
  goTo: (screen: Screen) => void;
  setPendingNickname: (n: string | null) => void;
  setCharacter: (c: CharacterSheet) => void;
  startCombat: (c: CombatState) => void;
  updateCombat: (patch: Partial<CombatState>) => void;
  endCombat: (outcome: CombatOutcome, resonanceGain: number) => void;
  reset: () => void;
}

export const useGame = create<GameState>()(
  persist(
    (set) => ({
      screen: 'title',
      totalResonance: 0,
      character: null,
      pendingNickname: null,
      combat: null,
      lastOutcome: null,
      lastCombatGain: null,
      resonanceBeforeLastCombat: null,

      goTo: (screen) => set({ screen }),
      setPendingNickname: (pendingNickname) => set({ pendingNickname }),
      setCharacter: (character) => set({ character, pendingNickname: null }),
      startCombat: (combat) =>
        set((s) => ({
          combat,
          lastOutcome: null,
          resonanceBeforeLastCombat: s.totalResonance,
        })),
      updateCombat: (patch) =>
        set((s) => (s.combat ? { combat: { ...s.combat, ...patch } } : s)),
      endCombat: (outcome, gain) =>
        set((s) => ({
          lastOutcome: outcome,
          totalResonance: s.totalResonance + gain,
          lastCombatGain: gain,
          combat: null,
        })),
      reset: () =>
        set({
          screen: 'title',
          character: null,
          pendingNickname: null,
          combat: null,
          lastOutcome: null,
          lastCombatGain: null,
          resonanceBeforeLastCombat: null,
        }),
    }),
    {
      name: 'resonance:game',
      partialize: (s) => ({
        character: s.character,
        totalResonance: s.totalResonance,
      }),
    },
  ),
);

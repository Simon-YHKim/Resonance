/**
 * Zustand store — apps/mobile 게임 상태.
 *
 * Phase 1.6: nickname analysis + combat (5턴) + outcome.
 */

import { create } from 'zustand';
import type {
  NicknameAnalysis,
  CombatState,
  CombatOutcome,
  CombatTurnResult,
} from '@resonance/shared';

interface GameState {
  pendingNickname: string | null;
  analysis: NicknameAnalysis | null;
  nicknameCode: string | null;
  isAnalyzing: boolean;
  error: string | null;

  // 전투
  combat: CombatState | null;
  isCombatBusy: boolean;
  finalOutcome: CombatOutcome | null;
  lastTurnResult: CombatTurnResult | null;

  // 안전 (자살예방법 §27조의8)
  safetyHigh: boolean;

  // 스테미나 (Phase 2 BM)
  stamina: { current: number; max_daily: number; willResetAtMs: number } | null;

  setPendingNickname: (n: string | null) => void;
  setAnalyzing: (v: boolean) => void;
  setAnalysis: (a: NicknameAnalysis | null, code?: string | null) => void;
  setError: (e: string | null) => void;

  setCombat: (s: CombatState | null) => void;
  setCombatBusy: (v: boolean) => void;
  setFinalOutcome: (o: CombatOutcome | null) => void;
  setLastTurnResult: (t: CombatTurnResult | null) => void;

  setSafetyHigh: (v: boolean) => void;

  setStamina: (s: { current: number; max_daily: number; willResetAtMs: number } | null) => void;

  resetCombat: () => void;
  reset: () => void;
}

export const useGame = create<GameState>((set) => ({
  pendingNickname: null,
  analysis: null,
  nicknameCode: null,
  isAnalyzing: false,
  error: null,

  combat: null,
  isCombatBusy: false,
  finalOutcome: null,
  lastTurnResult: null,

  safetyHigh: false,
  stamina: null,

  setPendingNickname: (n) => set({ pendingNickname: n }),
  setAnalyzing: (v) => set({ isAnalyzing: v }),
  setAnalysis: (a, code = null) => set({ analysis: a, nicknameCode: code, error: null }),
  setError: (e) => set({ error: e, isAnalyzing: false, isCombatBusy: false }),

  setCombat: (s) => set({ combat: s }),
  setCombatBusy: (v) => set({ isCombatBusy: v }),
  setFinalOutcome: (o) => set({ finalOutcome: o }),
  setLastTurnResult: (t) => set({ lastTurnResult: t }),

  setSafetyHigh: (v) => set({ safetyHigh: v }),
  setStamina: (s) => set({ stamina: s }),

  resetCombat: () =>
    set({
      combat: null,
      isCombatBusy: false,
      finalOutcome: null,
      lastTurnResult: null,
    }),

  reset: () =>
    set({
      pendingNickname: null,
      analysis: null,
      nicknameCode: null,
      isAnalyzing: false,
      error: null,
      combat: null,
      isCombatBusy: false,
      finalOutcome: null,
      lastTurnResult: null,
      safetyHigh: false,
      stamina: null,
    }),
}));

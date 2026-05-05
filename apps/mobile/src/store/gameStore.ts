/**
 * Zustand store — apps/mobile 게임 상태.
 *
 * Phase 1: nickname analysis 상태만.
 * Phase 2+: combat / shards / wiki milestones 추가.
 */

import { create } from 'zustand';
import type { NicknameAnalysis } from '@resonance/shared';

interface GameState {
  pendingNickname: string | null;
  analysis: NicknameAnalysis | null;
  isAnalyzing: boolean;
  error: string | null;

  setPendingNickname: (n: string | null) => void;
  setAnalyzing: (v: boolean) => void;
  setAnalysis: (a: NicknameAnalysis | null) => void;
  setError: (e: string | null) => void;
  reset: () => void;
}

export const useGame = create<GameState>((set) => ({
  pendingNickname: null,
  analysis: null,
  isAnalyzing: false,
  error: null,

  setPendingNickname: (n) => set({ pendingNickname: n }),
  setAnalyzing: (v) => set({ isAnalyzing: v }),
  setAnalysis: (a) => set({ analysis: a, error: null }),
  setError: (e) => set({ error: e, isAnalyzing: false }),
  reset: () =>
    set({
      pendingNickname: null,
      analysis: null,
      isAnalyzing: false,
      error: null,
    }),
}));

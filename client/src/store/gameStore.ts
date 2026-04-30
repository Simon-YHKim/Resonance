import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AnchorId } from '@/services/anchors';
import type { CombatStats } from '@/services/contribution';
import type { MemoryMoment } from '@/services/memoryMoments';
import type { EncounteredInfo } from '@/services/bestiary';
import { recordEncounter } from '@/services/bestiary';
import type {
  CharacterSheet,
  CombatOutcome,
  CombatState,
  Screen,
  Shard,
  ShardId,
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
  /** 누적 전투 횟수 (캐릭터 시트 만남 N회 표시용) */
  combatCount: number;
  /** 보유 기억의 조각 (v2.2 §18.2) — 시간순 누적 */
  shards: Shard[];
  /** 직전 전투에서 새로 획득한 조각 (결말 화면 알림용, 1전투에 최대 1개) */
  lastShardGained: ShardId | null;
  /** 마음의 거점 누적 점수 (v2.1 §추억 거점 Phase 0) */
  anchorPoints: Record<AnchorId, number>;
  /** 기억 순간 — 매 결말 자동 캡처 (v2.3 §22.3). 최신이 앞 (unshift). */
  memoryMoments: MemoryMoment[];
  /** 직전 전투 통계 — 결말 화면 종합 기여도 표시용 */
  lastCombatStats: CombatStats | null;
  /** 사라짐(Vanishing) 누적 — defeat 시마다 +1 (v2.0 §사망 시스템).
   *  Phase 0는 카운터만 (캐릭터 영구 사망 X). Phase 2+ 영구 사망. */
  vanishCount: number;
  /** 현재 전투의 도스 풍 누적 로그 (turn 별 한 줄, startCombat 시 비움) */
  combatLog: string[];
  /** 만남 기록 — bossName → EncounteredInfo (Bestiary).
   *  처음 만나기 전엔 entry 없음 → ??? 마스킹. */
  encounteredBosses: Record<string, EncounteredInfo>;

  /* actions */
  goTo: (screen: Screen) => void;
  setPendingNickname: (n: string | null) => void;
  setCharacter: (c: CharacterSheet) => void;
  startCombat: (c: CombatState) => void;
  updateCombat: (patch: Partial<CombatState>) => void;
  endCombat: (outcome: CombatOutcome, resonanceGain: number) => void;
  /** 조각 획득 — 같은 id 중복 허용 (4% 드롭 풀 활용 가능). */
  addShard: (id: ShardId) => void;
  /** 4 거점 중 1+ 에 1점씩 가산 (dialogue 액션 시 호출). */
  addAnchorPoints: (ids: AnchorId[]) => void;
  /** 기억 순간 추가 — 결말 시 자동 호출. 최신이 앞으로. */
  addMemoryMoment: (moment: MemoryMoment) => void;
  /** 결말 직전 호출 — 직전 전투 통계 기록 */
  setLastCombatStats: (stats: CombatStats) => void;
  /** 전투 로그 한 줄 추가 (도스 풍 누적). */
  appendCombatLog: (line: string) => void;
  /** 만남 기록 — endCombat 시 자동 호출 (Bestiary 누적). */
  recordBossEncounter: (
    bossName: string,
    observedMaxHp: number,
    outcome: 'victory' | 'defeat' | 'fled' | 'stalemate',
  ) => void;
  /** 기억의 시장 — 조각 N개 소비 (FIFO, 가장 오래된 것부터). */
  spendShards: (count: number) => void;
  /** 잔잔 즉시 가산 (시장 효과 등). */
  addResonance: (delta: number) => void;
  /** 사라짐 카운터 -1 (한 번의 침묵 효과). 0 미만으로 안 감. */
  restoreOneVanish: () => void;
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
      combatCount: 0,
      shards: [],
      lastShardGained: null,
      anchorPoints: { family: 0, home: 0, school: 0, work: 0 },
      memoryMoments: [],
      lastCombatStats: null,
      vanishCount: 0,
      combatLog: [],
      encounteredBosses: {},

      goTo: (screen) => set({ screen }),
      setPendingNickname: (pendingNickname) => set({ pendingNickname }),
      setCharacter: (character) => set({ character, pendingNickname: null }),
      startCombat: (combat) =>
        set((s) => ({
          combat,
          lastOutcome: null,
          resonanceBeforeLastCombat: s.totalResonance,
          lastShardGained: null,
          combatLog: [],
        })),
      updateCombat: (patch) =>
        set((s) => (s.combat ? { combat: { ...s.combat, ...patch } } : s)),
      endCombat: (outcome, gain) =>
        set((s) => ({
          lastOutcome: outcome,
          totalResonance: s.totalResonance + gain,
          lastCombatGain: gain,
          combatCount: s.combatCount + 1,
          // defeat 시 사라짐 +1 (v2.0 §사망)
          vanishCount: outcome === 'defeat' ? s.vanishCount + 1 : s.vanishCount,
          combat: null,
        })),
      addShard: (id) =>
        set((s) => ({
          shards: [...s.shards, { id, acquiredAt: Date.now() }],
          lastShardGained: id,
        })),
      addAnchorPoints: (ids) =>
        set((s) => {
          const next = { ...s.anchorPoints };
          for (const id of ids) {
            next[id] = (next[id] ?? 0) + 1;
          }
          return { anchorPoints: next };
        }),
      addMemoryMoment: (moment) =>
        set((s) => ({
          memoryMoments: [moment, ...s.memoryMoments].slice(0, 50),
        })),
      setLastCombatStats: (stats) => set({ lastCombatStats: stats }),
      appendCombatLog: (line) =>
        set((s) => ({ combatLog: [...s.combatLog, line] })),
      recordBossEncounter: (bossName, observedMaxHp, outcome) =>
        set((s) => {
          const next = recordEncounter(
            s.encounteredBosses[bossName],
            bossName,
            observedMaxHp,
            outcome,
          );
          return {
            encounteredBosses: { ...s.encounteredBosses, [bossName]: next },
          };
        }),
      spendShards: (count) =>
        set((s) => ({ shards: s.shards.slice(count) })),
      addResonance: (delta) =>
        set((s) => ({ totalResonance: s.totalResonance + delta })),
      restoreOneVanish: () =>
        set((s) => ({ vanishCount: Math.max(0, s.vanishCount - 1) })),
      reset: () =>
        set({
          screen: 'title',
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
        }),
    }),
    {
      name: 'resonance:game',
      partialize: (s) => ({
        character: s.character,
        totalResonance: s.totalResonance,
        combatCount: s.combatCount,
        shards: s.shards,
        anchorPoints: s.anchorPoints,
        memoryMoments: s.memoryMoments,
        vanishCount: s.vanishCount,
        encounteredBosses: s.encounteredBosses,
      }),
    },
  ),
);

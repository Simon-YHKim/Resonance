/* MapScreen — GPS 거리 모드 (Phase 0 mock).
 *
 * 4×4 그리드 + 사용자 핀 + 잊혀진 자 4 핀.
 * 사용자가 화살표/스와이프로 이동 → 같은 셀의 잊혀진 자 만남 → 전투.
 *
 * Phase 1+: MockLocationService → CapacitorLocationService swap.
 *   - 실 GPS 좌표 → H3 hex 매핑 → 같은 hex의 서버 잊혀진 자 fetch
 *   - UI 컴포넌트는 동일
 */

import { useState } from 'react';
import { ActionButton } from '@/components/ActionButton';
import { useGame } from '@/store/gameStore';
import { getTier } from '@/services/resonanceTiers';
import { mockLocation, GRID, cellLabelAt } from '@/services/location/MockLocationService';
import { pickForgetter } from '@/services/llm/mockData/combatNarrations';
import { withLocation } from '@/services/llm/mockData/locations';
import type { LocationState } from '@/services/location/LocationService';
import { haptic } from '@/utils/haptic';

export function MapScreen() {
  const totalResonance = useGame((s) => s.totalResonance);
  const goTo = useGame((s) => s.goTo);
  const startCombat = useGame((s) => s.startCombat);
  const tier = getTier(totalResonance);

  // 진입 시 1회 초기화. Phase 1+ navigator.geolocation으로 교체
  const [state, setState] = useState<LocationState>(() =>
    mockLocation.getInitialState(tier.tier),
  );

  const move = (dx: number, dy: number) => {
    haptic('tap');
    const next = mockLocation.move(state, dx, dy);
    setState(next);
    // 같은 셀에 핀이 있으면 자동 조우
    const pin = mockLocation.pinAt(next, next.player);
    if (pin) {
      haptic('soft');
      const archetype = pickForgetter(pin.bossTier, totalResonance);
      // 핀 제거 후 전투 진입 (핀은 한 번만 만남)
      setState(mockLocation.removePin(next, pin.id));
      startCombat({
        player: { hp: 100, maxHp: 100, stamina: 100, maxStamina: 100 },
        enemy: {
          name: archetype.name,
          description: archetype.description,
          encounter: withLocation(archetype.encounter, totalResonance),
          hp: archetype.hp,
          maxHp: archetype.hp,
        },
        turn: 0,
        resonance: 0,
      });
      goTo('combat');
    }
  };

  return (
    <div className="vignette min-h-full flex flex-col px-6 py-8 game-ui">
      <div className="max-w-sm w-full mx-auto flex-1 flex flex-col">
        <div className="mb-4">
          <p className="text-fg-dim text-[0.65rem] tracking-[0.3em] uppercase mb-1">
            거리
          </p>
          <p className="display-text text-lg text-fg-primary">
            {cellLabelAt(state.player)}
          </p>
          <p className="text-fg-muted text-xs mt-1">
            잊혀진 자 {state.pins.length}체가 거리에 있다.
          </p>
        </div>

        {/* 4×4 그리드 — Phase 1+ 실 GPS hex 시각화로 교체 */}
        <div
          className="mx-auto mb-6 border border-bg-elevated p-2 rounded-md bg-bg-secondary/30"
          role="grid"
          aria-label="거리 지도"
        >
          {Array.from({ length: GRID.h }).map((_, y) => (
            <div key={y} className="flex">
              {Array.from({ length: GRID.w }).map((_, x) => {
                const isPlayer = state.player.x === x && state.player.y === y;
                const pin = mockLocation.pinAt(state, { x, y });
                return (
                  <div
                    key={x}
                    className="w-14 h-14 border border-bg-elevated/50 flex items-center justify-center relative"
                    aria-label={cellLabelAt({ x, y })}
                  >
                    {pin && !isPlayer && (
                      <span
                        className="text-danger/80 text-lg animate-breathe"
                        aria-label="잊혀진 자"
                        title="잊혀진 자"
                      >
                        ✕
                      </span>
                    )}
                    {isPlayer && (
                      <span
                        className="text-resonance text-xl"
                        aria-label="너의 자리"
                      >
                        ◎
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <p className="text-fg-dim text-[0.65rem] text-center italic leading-relaxed mb-4">
          ◎ 너 · ✕ 잊혀진 자 — 같은 자리에 닿으면 조우한다.
        </p>

        {/* D-pad 컨트롤 */}
        <div className="grid grid-cols-3 gap-1 max-w-[200px] mx-auto mb-6">
          <div />
          <button
            onClick={() => move(0, -1)}
            disabled={state.player.y === 0}
            className="aspect-square border border-bg-elevated rounded-sm
                       bg-bg-secondary text-fg-primary text-xl
                       enabled:hover:border-resonance/60
                       enabled:active:scale-95
                       disabled:opacity-30 disabled:cursor-not-allowed
                       transition-all"
            aria-label="위로"
          >
            ↑
          </button>
          <div />
          <button
            onClick={() => move(-1, 0)}
            disabled={state.player.x === 0}
            className="aspect-square border border-bg-elevated rounded-sm
                       bg-bg-secondary text-fg-primary text-xl
                       enabled:hover:border-resonance/60
                       enabled:active:scale-95
                       disabled:opacity-30 disabled:cursor-not-allowed
                       transition-all"
            aria-label="왼쪽"
          >
            ←
          </button>
          <div className="aspect-square flex items-center justify-center text-fg-dim text-[0.6rem]">
            ◎
          </div>
          <button
            onClick={() => move(1, 0)}
            disabled={state.player.x === GRID.w - 1}
            className="aspect-square border border-bg-elevated rounded-sm
                       bg-bg-secondary text-fg-primary text-xl
                       enabled:hover:border-resonance/60
                       enabled:active:scale-95
                       disabled:opacity-30 disabled:cursor-not-allowed
                       transition-all"
            aria-label="오른쪽"
          >
            →
          </button>
          <div />
          <button
            onClick={() => move(0, 1)}
            disabled={state.player.y === GRID.h - 1}
            className="aspect-square border border-bg-elevated rounded-sm
                       bg-bg-secondary text-fg-primary text-xl
                       enabled:hover:border-resonance/60
                       enabled:active:scale-95
                       disabled:opacity-30 disabled:cursor-not-allowed
                       transition-all"
            aria-label="아래로"
          >
            ↓
          </button>
          <div />
        </div>
      </div>

      <div className="max-w-sm w-full mx-auto space-y-3">
        <ActionButton variant="ghost" onClick={() => goTo('hearth')}>
          ← 기억의 향로
        </ActionButton>
      </div>
    </div>
  );
}

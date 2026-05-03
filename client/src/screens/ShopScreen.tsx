/* ShopScreen — 기억의 시장 (v2.2 §18 Phase 0).
 * 3 아이템 + 기억의 조각으로 즉시 효과.
 *
 * Phase 1+:
 *   - 시장의 노파 NPC와 직접 거래 (모달 → 좌판)
 *   - 영구 인벤토리 (드롭/사용 분리)
 *   - LLM이 "그 조각으로 무엇을 살 수 있을까?" 동적 안내
 */

import { useState } from 'react';
import { ActionButton } from '@/components/ActionButton';
import { useGame } from '@/store/gameStore';
import { SHOP_ITEMS, findShopItem } from '@/services/shop';
import type { ShopItem, ShopItemId } from '@/services/shop';
import { haptic } from '@/utils/haptic';

export function ShopScreen() {
  const goTo = useGame((s) => s.goTo);
  const shards = useGame((s) => s.shards);
  const vanishCount = useGame((s) => s.vanishCount);
  const spendShards = useGame((s) => s.spendShards);
  const addResonance = useGame((s) => s.addResonance);
  const restoreOneVanish = useGame((s) => s.restoreOneVanish);

  const [lastPurchase, setLastPurchase] = useState<{
    name: string;
    flavor: string;
  } | null>(null);

  const canAfford = (item: ShopItem): boolean => shards.length >= item.costShards;

  const buy = (id: ShopItemId) => {
    const item = findShopItem(id);
    if (!item || !canAfford(item)) return;

    // 한 번의 침묵은 사라짐이 있어야만 의미 — 0이면 차단
    if (id === 'one-silence' && vanishCount === 0) return;

    haptic('soft');
    spendShards(item.costShards);

    // 효과 적용
    if (id === 'small-comfort') addResonance(30);
    else if (id === 'one-silence') restoreOneVanish();
    else if (id === 'short-breath') addResonance(100);

    setLastPurchase({ name: item.name, flavor: item.flavorOnPurchase });
  };

  return (
    <div className="vignette min-h-full flex flex-col px-6 py-8 game-ui">
      <div className="max-w-sm w-full mx-auto flex-1 overflow-y-auto pb-6">
        <div className="text-center mb-6 animate-fade-in-slow">
          <p className="text-fg-dim text-[0.6rem] tracking-[0.4em] uppercase mb-2">
            기억의 시장
          </p>
          <h2 className="display-text text-xl text-fg-primary mb-1">
            노파의 좌판
          </h2>
          <p className="text-fg-muted text-xs italic mb-3">
            너의 손에 쥔 것을 내려 놓을 자리.
          </p>
          <p className="text-origin text-xs tabular-nums">
            보유 조각 · {shards.length}개
          </p>
        </div>

        {lastPurchase && (
          <div className="mb-5 rounded-md px-4 py-3 border border-origin/40 bg-origin/5 animate-fade-in">
            <p className="text-fg-dim text-[0.6rem] tracking-[0.3em] uppercase mb-1">
              {lastPurchase.name} 산다
            </p>
            <p className="text-fg-muted text-xs leading-relaxed italic">
              {lastPurchase.flavor}
            </p>
          </div>
        )}

        <ul className="space-y-3">
          {SHOP_ITEMS.map((item) => {
            const afford = canAfford(item);
            const blockedSilence =
              item.id === 'one-silence' && vanishCount === 0;
            const disabled = !afford || blockedSilence;
            return (
              <li
                key={item.id}
                className={
                  'p-4 border rounded-md ' +
                  (disabled
                    ? 'border-bg-elevated/40 bg-bg-secondary/20'
                    : 'border-bg-elevated bg-bg-secondary/40')
                }
              >
                <div className="flex justify-between items-baseline mb-1">
                  <p
                    className={
                      'display-text text-base ' +
                      (disabled ? 'text-fg-dim' : 'text-fg-primary')
                    }
                  >
                    {item.name}
                  </p>
                  <span
                    className={
                      'text-[0.7rem] tabular-nums ' +
                      (disabled ? 'text-fg-dim/60' : 'text-origin')
                    }
                  >
                    조각 {item.costShards}개
                  </span>
                </div>
                <p className="text-fg-muted text-xs leading-relaxed mb-2">
                  {item.description}
                </p>
                <div className="flex justify-between items-center">
                  <p className="text-resonance/70 text-[0.65rem] tracking-wider">
                    {item.effectLabel}
                  </p>
                  <button
                    onClick={() => buy(item.id)}
                    disabled={disabled}
                    className="text-xs px-3 py-1 border border-resonance/40 rounded-sm
                               text-resonance display-text
                               enabled:hover:bg-resonance/10 enabled:active:scale-95
                               disabled:opacity-30 disabled:cursor-not-allowed
                               transition-all"
                  >
                    {blockedSilence ? '필요 없음' : afford ? '산다' : '부족'}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>

        <p className="text-fg-dim text-[0.6rem] italic text-center mt-6">
          Phase 1+: 시장의 노파와 직접 거래 + 영구 인벤토리
        </p>
      </div>

      <div className="max-w-sm w-full mx-auto">
        <ActionButton variant="ghost" onClick={() => goTo('hearth')}>
          ← 기억의 향로
        </ActionButton>
      </div>
    </div>
  );
}

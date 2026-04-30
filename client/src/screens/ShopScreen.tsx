/* ShopScreen — 기억의 시장 (Phase 0 placeholder).
 * #58 PR에서 3 아이템 + 조각 거래 구현. */

import { ActionButton } from '@/components/ActionButton';
import { useGame } from '@/store/gameStore';

export function ShopScreen() {
  const goTo = useGame((s) => s.goTo);
  const shards = useGame((s) => s.shards);
  return (
    <div className="vignette min-h-full flex flex-col px-6 py-12 game-ui">
      <div className="max-w-sm w-full mx-auto flex-1 flex flex-col justify-center">
        <p className="text-fg-dim text-[0.6rem] tracking-[0.4em] uppercase mb-2">
          기억의 시장
        </p>
        <h2 className="display-text text-2xl text-fg-primary mb-6">
          좌판이 아직 비어 있다
        </h2>
        <p className="text-fg-muted leading-relaxed display-text mb-4">
          시장의 노파가 판을 깔고 있다. 너의 손에 쥔 조각{' '}
          <span className="text-origin tabular-nums">{shards.length}개</span>가
          그녀의 좌판 위로 곧 옮겨갈 것이다.
        </p>
        <p className="text-fg-dim text-xs italic leading-relaxed">
          작은 위로, 한 번의 침묵, 잠시 숨 고름 — 세 개의 좌판이 곧 열린다.
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

/* NPCScreen — 잊혀진 자들과의 만남 (Phase 0 placeholder).
 * #57 PR에서 4 NPC + 성격 + 대화 모달 구현. */

import { ActionButton } from '@/components/ActionButton';
import { useGame } from '@/store/gameStore';

export function NPCScreen() {
  const goTo = useGame((s) => s.goTo);
  return (
    <div className="vignette min-h-full flex flex-col px-6 py-12 game-ui">
      <div className="max-w-sm w-full mx-auto flex-1 flex flex-col justify-center">
        <p className="text-fg-dim text-[0.6rem] tracking-[0.4em] uppercase mb-2">
          잊혀진 자들과의 만남
        </p>
        <h2 className="display-text text-2xl text-fg-primary mb-6">
          향로의 옆자리
        </h2>
        <p className="text-fg-muted leading-relaxed display-text mb-4">
          향로의 옆자리에는 누구도 아직 앉아 있지 않다.
        </p>
        <p className="text-fg-dim text-xs italic leading-relaxed">
          곧 시장의 노파, 거리의 음유시인, 그리고 한 번도 본 적 없던 친구가
          이 자리에 앉을 것이다.
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

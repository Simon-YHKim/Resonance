/* BattleVisualPanel — 포켓몬식 전투 시각 영역 (Phase 0 placeholder).
 *
 * Phase 0: 한자/기호 avatar + 이름 + 짧은 묘사. 이미지 없음.
 * Phase 1+: Nano Banana Pro 이미지 (적/플레이어 캐릭터). 같은 컴포넌트 구조.
 *
 * 사용자 의도: "포켓몬처럼 전투하는 것을 보여주는 것도 좋을 것 같아.
 *               이것도 역시 ai의 힘이 필요하겠지. 일단 틀만 만들어 놓자."
 */

import type { CombatState } from '@/types/game';
import type { ResonanceTierMeta } from '@/services/resonanceTiers';

/* 적 보스 이름 → avatar 한자 매핑 (v1.2 5체).
 * Phase 1+ 이미지 swap 시 이 매핑은 fallback으로만 사용. */
function bossAvatar(name: string): string {
  if (name.includes('원의 아이')) return '童';        // 5체 — 5~7세
  if (name.includes('떠난 친구들')) return '友';      // 4체 — 8~12세
  if (name.includes('미루는 학자')) return '冊';      // 3체 — 17~19세
  if (name.includes('흐르는 그림자')) return '河';    // 2체 — 20대 / 한강
  if (name.includes('남겨진 거인')) return '巨';      // 1체 — 30~40대 / 강남
  return '影';
}

interface Props {
  combat: CombatState;
  tier: ResonanceTierMeta;
  playerNickname: string | null;
}

export function BattleVisualPanel({ combat, tier, playerNickname }: Props) {
  const { enemy, player } = combat;
  const enemyHpPct = Math.max(0, Math.min(100, (enemy.hp / enemy.maxHp) * 100));
  const playerHpPct = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));

  return (
    <div className="grid grid-cols-2 gap-2 mb-3">
      {/* 적 카드 — 좌측 상단 (포켓몬식 적 위치) */}
      <div className="border border-bg-elevated rounded-md bg-bg-secondary/40 p-3 flex flex-col items-center text-center">
        <p className="text-fg-dim text-[0.55rem] tracking-[0.2em] uppercase mb-1">
          잊혀진 자
        </p>
        {/* Phase 1+: <img src={enemy.imageUrl} /> 으로 교체 */}
        <div
          className="w-14 h-14 rounded-full border border-danger/40
                     flex items-center justify-center display-text text-2xl
                     text-danger/80 mb-2 animate-breathe"
          aria-hidden="true"
        >
          {bossAvatar(enemy.name)}
        </div>
        <p className="display-text text-danger text-xs leading-tight mb-1 line-clamp-2">
          {enemy.name.replace('잊혀진 자 — ', '')}
        </p>
        {/* 적 HP bar — 작게 */}
        <div className="w-full h-1 bg-bg-elevated rounded-full overflow-hidden">
          <div
            className="h-full bg-danger transition-[width] duration-500 ease-out"
            style={{ width: `${enemyHpPct}%` }}
          />
        </div>
        <p className="text-fg-dim text-[0.55rem] mt-1 tabular-nums">
          {enemy.hp}/{enemy.maxHp}
        </p>
      </div>

      {/* 플레이어 카드 — 우측 하단 (포켓몬식 자기 위치) */}
      <div className="border border-bg-elevated rounded-md bg-bg-secondary/40 p-3 flex flex-col items-center text-center">
        <p className="text-fg-dim text-[0.55rem] tracking-[0.2em] uppercase mb-1">
          이름을 가진 자
        </p>
        <div
          className="w-14 h-14 rounded-full border border-resonance/40
                     flex items-center justify-center display-text text-2xl
                     text-resonance mb-2"
          aria-hidden="true"
        >
          名
        </div>
        <p className="display-text text-fg-primary text-xs leading-tight mb-1 line-clamp-1">
          {playerNickname ?? '이름 없음'}
        </p>
        {/* 플레이어 HP bar — 작게 */}
        <div className="w-full h-1 bg-bg-elevated rounded-full overflow-hidden">
          <div
            className="h-full bg-danger transition-[width] duration-500 ease-out"
            style={{ width: `${playerHpPct}%` }}
          />
        </div>
        <p className="text-fg-dim text-[0.55rem] mt-1 tabular-nums">
          {player.hp}/{player.maxHp} · {tier.label}
        </p>
      </div>
    </div>
  );
}

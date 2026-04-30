/* HearthScreen — 기억의 향로 (캐릭터 정비 로비).
 *
 * 게임 정체성: "잔향(殘響)" — 기억의 향로는 캐릭터가 거리를 떠나
 * 잠시 머무는 자리. 4 진입 카드.
 *
 * Phase 0:
 *   1. 나의 기록 (CharacterSheet)        — 시트 + 인벤토리 + 거점 + 타임라인
 *   2. 거리로 나선다 (MapScreen)          — GPS Mock 4×4 그리드
 *   3. 잊혀진 자들 (NPC)                 — Phase 0 placeholder (#57에서 구현)
 *   4. 기억의 시장 (Shop)                — Phase 0 placeholder (#58에서 구현)
 *
 * Phase 1+:
 *   - 향로 자체에 시각 효과 (라벤더 연기 / 이미지)
 *   - NPC가 향로 주변에 시각화
 */

import { ActionButton } from '@/components/ActionButton';
import { useGame } from '@/store/gameStore';
import { getTier } from '@/services/resonanceTiers';
import { CHAPTERS, chapterForTier } from '@/services/chapters';

interface HearthCardProps {
  title: string;
  subtitle: string;
  body: string;
  onClick: () => void;
  disabled?: boolean;
  comingSoon?: boolean;
}

function HearthCard({
  title,
  subtitle,
  body,
  onClick,
  disabled,
  comingSoon,
}: HearthCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full text-left p-4 border border-bg-elevated rounded-md
                 bg-bg-secondary/50
                 enabled:hover:border-resonance/50 enabled:active:bg-bg-elevated
                 enabled:active:scale-[0.99]
                 disabled:opacity-50 disabled:cursor-not-allowed
                 transition-all duration-150"
    >
      <div className="flex justify-between items-baseline mb-1">
        <p className="display-text text-fg-primary text-base">{title}</p>
        {comingSoon && (
          <span className="text-fg-dim text-[0.6rem] tracking-wider uppercase">
            곧
          </span>
        )}
      </div>
      <p className="text-fg-dim text-[0.65rem] tracking-[0.2em] uppercase mb-2">
        {subtitle}
      </p>
      <p className="text-fg-muted text-xs leading-relaxed">{body}</p>
    </button>
  );
}

export function HearthScreen() {
  const character = useGame((s) => s.character);
  const totalResonance = useGame((s) => s.totalResonance);
  const goTo = useGame((s) => s.goTo);
  const tier = getTier(totalResonance);
  const chapter = CHAPTERS[chapterForTier(tier.tier, totalResonance)];

  if (!character) {
    return (
      <div className="vignette min-h-full flex items-center justify-center p-8">
        <ActionButton onClick={() => goTo('title')}>처음으로</ActionButton>
      </div>
    );
  }

  return (
    <div className="vignette min-h-full flex flex-col px-6 py-8 game-ui">
      <div className="max-w-sm w-full mx-auto flex-1 overflow-y-auto pb-6">
        {/* 헤더 — 향로 분위기 */}
        <div className="text-center mb-8 animate-fade-in-slow">
          <p className="text-fg-dim text-[0.6rem] tracking-[0.4em] uppercase mb-2">
            기억의 향로
          </p>
          <p className="display-text text-3xl text-resonance/70 mb-1">爐</p>
          <p className="text-fg-muted text-xs italic">
            {chapter.numeral} · {chapter.title}
          </p>
        </div>

        {/* 캐릭터 요약 */}
        <div className="border-l-2 border-resonance/40 pl-3 mb-8">
          <p className="display-text text-fg-primary text-xl">
            {character.nickname}
          </p>
          <p className="text-resonance/80 text-xs display-text">
            — {character.startingClass}
          </p>
          <p className="text-fg-dim text-[0.65rem] mt-1 tabular-nums">
            누적 잔잔 {totalResonance} · {tier.label}
          </p>
        </div>

        {/* 4 진입 카드 */}
        <div className="space-y-3">
          <HearthCard
            title="나의 기록"
            subtitle="잔향이 본 너"
            body="컨셉, 외형, 키워드, 거점, 기억의 조각, 기억 순간."
            onClick={() => goTo('characterSheet')}
          />
          <HearthCard
            title="거리로 나선다"
            subtitle="GPS · 4×4 거리"
            body="잊혀진 자들이 거리에 흐른다. 한 자리씩 너를 기다린다."
            onClick={() => goTo('map')}
          />
          <HearthCard
            title="잊혀진 자들과 만남"
            subtitle="NPC · 4명"
            body="시장의 노파, 거리의 음유시인, 그리고 한 번도 본 적 없던 친구."
            onClick={() => goTo('npc')}
          />
          <HearthCard
            title="기억의 시장"
            subtitle="조각 거래"
            body="네가 모은 조각으로 잠시의 위로를 산다."
            onClick={() => goTo('shop')}
          />
          <HearthCard
            title="잊혀진 자들의 도감"
            subtitle="만남으로 드러난다"
            body="너는 누구를 보았고, 누구를 아직 보지 못했는가."
            onClick={() => goTo('bestiary')}
          />
        </div>
      </div>

      <div className="max-w-sm w-full mx-auto space-y-3">
        <ActionButton variant="subtle" onClick={() => goTo('title')}>
          ← 처음으로
        </ActionButton>
      </div>
    </div>
  );
}

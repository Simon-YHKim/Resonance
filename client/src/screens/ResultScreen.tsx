import { ActionButton } from '@/components/ActionButton';
import { useGame } from '@/store/gameStore';
import { pickForgetter } from '@/services/llm/mockData/combatNarrations';
import { withLocation } from '@/services/llm/mockData/locations';
import { getTier } from '@/services/resonanceTiers';
import { endingFooter } from '@/services/categoryEndings';
import { crossedMilestone } from '@/services/milestones';
import { SHARD_META } from '@/services/shards';
import { SHAPE_META, classifyShape } from '@/services/contribution';
import { CHAPTERS, chapterForTier } from '@/services/chapters';
import { haptic } from '@/utils/haptic';
import { useCountUp } from '@/utils/useCountUp';
import { useEffect } from 'react';

const COPY = {
  victory: {
    title: '잊혀진 자가 무너졌다',
    body: '안개가 걷힌다. 너의 안에 무언가가 작게 자리를 잡는다 — 누구도 알아보지 못할 그 자리에.',
  },
  defeat: {
    title: '너는 무릎을 꿇었다',
    body: '거리는 너를 받아내지 못했다. 다시, 처음부터 — 이 잔향은 그렇게 흘러간다.',
  },
  fled: {
    title: '너는 거리를 떠났다',
    body: '도망이 끝이 아닐 때가 있다. 너는 그것을 이제 안다.',
  },
  stalemate: {
    title: '거리가 너를 보내준다',
    body: '결판은 나지 않았다. 잊혀진 자도, 너도 안개 속에 다시 잠긴다. 다음 거리가 너를 기다린다.',
  },
} as const;

export function ResultScreen() {
  const lastOutcome = useGame((s) => s.lastOutcome);
  const totalResonance = useGame((s) => s.totalResonance);
  const lastCombatGain = useGame((s) => s.lastCombatGain);
  const resonanceBeforeLastCombat = useGame((s) => s.resonanceBeforeLastCombat);
  const lastShardGained = useGame((s) => s.lastShardGained);
  const vanishCount = useGame((s) => s.vanishCount);
  const lastCombatStats = useGame((s) => s.lastCombatStats);
  const character = useGame((s) => s.character);
  const goTo = useGame((s) => s.goTo);
  const startCombat = useGame((s) => s.startCombat);
  const shardMeta = lastShardGained ? SHARD_META[lastShardGained] : null;
  const shape =
    lastCombatStats && lastOutcome
      ? SHAPE_META[classifyShape(lastCombatStats, lastOutcome)]
      : null;

  // 결말 없이 진입한 경우 보호
  useEffect(() => {
    if (!lastOutcome) goTo('title');
  }, [lastOutcome, goTo]);

  const c = lastOutcome ? COPY[lastOutcome] : null;
  const tier = getTier(totalResonance);
  const categoryFooter =
    character && lastOutcome ? endingFooter(character.category, lastOutcome) : null;

  // tier 승급 감지 — 전투 전 tier ≠ 전투 후 tier 인 경우
  const tierBefore =
    resonanceBeforeLastCombat !== null ? getTier(resonanceBeforeLastCombat) : null;
  const tierPromoted = tierBefore !== null && tierBefore.tier !== tier.tier;

  // 챕터 진입 — tier 승급 시 챕터 변경 여부
  const chapterBefore = tierBefore
    ? chapterForTier(tierBefore.tier, resonanceBeforeLastCombat ?? 0)
    : null;
  const chapterNow = chapterForTier(tier.tier, totalResonance);
  const chapterChanged = chapterBefore !== null && chapterBefore !== chapterNow;
  const newChapter = chapterChanged ? CHAPTERS[chapterNow] : null;

  // 마일스톤 — tier 승급 없을 때만 표시 (중첩 방지)
  const milestone =
    !tierPromoted && resonanceBeforeLastCombat !== null
      ? crossedMilestone(resonanceBeforeLastCombat, totalResonance)
      : null;

  // tier 승급 시 햅틱 — 결말 화면 진입 직후 1회
  useEffect(() => {
    if (tierPromoted) haptic('promotion');
  }, [tierPromoted]);

  // 누적 잔잔 카운트 업 — 이전값에서 현재값으로 부드럽게 상승
  const startCount =
    resonanceBeforeLastCombat !== null ? resonanceBeforeLastCombat : totalResonance;
  const displayedTotal = useCountUp(totalResonance, 900, startCount);

  if (!lastOutcome || !c) return null;

  const handleAgain = () => {
    const archetype = pickForgetter(tier.tier, totalResonance);
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
  };

  return (
    <div className="vignette min-h-full flex flex-col px-8 py-12 game-ui">
      <div className="max-w-sm w-full mx-auto flex-1 flex flex-col justify-center animate-fade-in-slow">
        <p className="text-fg-dim text-xs tracking-[0.3em] uppercase mb-3">기록</p>
        <h2 className="display-text text-2xl text-fg-primary mb-6">{c.title}</h2>
        <p className="text-fg-muted leading-relaxed display-text">{c.body}</p>

        {/* defeat 시 사라짐 카운터 노출 — v2.0 §사망 시스템 */}
        {lastOutcome === 'defeat' && vanishCount > 0 && (
          <p className="text-danger/70 text-xs mt-3 italic tabular-nums tracking-wider">
            {vanishCount}번째 사라짐 · 거리는 너를 또 한 번 잊지 않는다.
          </p>
        )}

        {categoryFooter && (
          <p className="text-fg-primary/90 leading-relaxed display-text mt-4 text-sm animate-fade-in">
            {categoryFooter}
          </p>
        )}

        {tier.resultFooter && (
          <p className="text-resonance/80 leading-relaxed display-text mt-4 text-sm italic animate-fade-in">
            {tier.resultFooter}
          </p>
        )}

        {tierPromoted && (
          <div className="mt-6 rounded-md px-4 py-4 bg-bg-elevated/40 border border-resonance/30 animate-pulse-resonance">
            {newChapter ? (
              <>
                <p className="text-fg-dim text-[0.6rem] tracking-[0.3em] uppercase mb-1">
                  {newChapter.numeral} 진입
                </p>
                <p className="display-text text-resonance text-base mb-2">
                  {newChapter.title}
                </p>
                <p className="text-fg-muted text-xs leading-relaxed italic">
                  {newChapter.intro}
                </p>
                <p className="text-resonance/60 text-[0.65rem] mt-3">
                  잔향이 너를 다시 부른다 — 이제 너는 <strong>{tier.label}</strong>.
                </p>
              </>
            ) : (
              <p className="text-resonance leading-relaxed display-text text-sm">
                잔향이 너를 다시 부른다 — 이제 너는 <strong>{tier.label}</strong>.
              </p>
            )}
          </div>
        )}

        {milestone && (
          <p className="text-resonance/70 leading-relaxed display-text mt-4 text-xs animate-fade-in-slow">
            ◦ {milestone.message}
          </p>
        )}

        {shardMeta && (
          <div className="mt-6 rounded-md px-4 py-3 border border-origin/40 bg-origin/5 animate-fade-in-slow">
            <p className="text-fg-dim text-[0.6rem] tracking-[0.3em] uppercase mb-1">
              기억의 조각
            </p>
            <p className="display-text text-origin text-sm mb-1">{shardMeta.label}</p>
            <p className="text-fg-muted text-xs leading-relaxed">
              {shardMeta.description}
            </p>
          </div>
        )}

        {shape && lastCombatStats && (
          <div className="mt-6 animate-fade-in-slow">
            <p className="text-fg-dim text-[0.6rem] tracking-[0.3em] uppercase mb-1">
              이번 결의 형태
            </p>
            <div className="flex justify-between items-baseline">
              <p className={`display-text text-sm ${shape.color}`}>{shape.label}</p>
              <p className="text-fg-dim text-[0.65rem] tabular-nums">
                공{lastCombatStats.attackCount} · 말{lastCombatStats.dialogueCount}
                {lastCombatStats.fleeCount > 0 && ` · 도${lastCombatStats.fleeCount}`}
              </p>
            </div>
            <p className="text-fg-muted text-xs leading-relaxed mt-1 italic">
              {shape.description}
            </p>
          </div>
        )}

        <div className="mt-12 border-t border-bg-elevated pt-6 space-y-2">
          <div className="flex justify-between text-sm items-baseline">
            <span className="text-fg-muted">누적 잔잔</span>
            <span className="text-resonance display-text tabular-nums">
              {displayedTotal}
              {lastCombatGain !== null && lastCombatGain !== 0 && (
                <span
                  className={
                    'ml-2 text-xs ' +
                    (lastCombatGain > 0 ? 'text-resonance/70' : 'text-fg-dim')
                  }
                >
                  ({lastCombatGain > 0 ? '+' : ''}
                  {lastCombatGain})
                </span>
              )}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-fg-dim">잔향이 부르는 호칭</span>
            <span className="text-fg-muted display-text">{tier.label}</span>
          </div>
        </div>
      </div>

      <div className="max-w-sm w-full mx-auto space-y-3">
        <ActionButton onClick={() => goTo('map')}>거리로 돌아간다</ActionButton>
        <ActionButton variant="ghost" onClick={handleAgain}>
          한 자리만 더 (방구석)
        </ActionButton>
        {character && (
          <ActionButton variant="ghost" onClick={() => goTo('characterSheet')}>
            나의 잔향
          </ActionButton>
        )}
        <ActionButton variant="ghost" onClick={() => goTo('title')}>
          처음으로
        </ActionButton>
      </div>
    </div>
  );
}

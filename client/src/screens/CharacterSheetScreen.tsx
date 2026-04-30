import { ActionButton } from '@/components/ActionButton';
import { useGame } from '@/store/gameStore';
import { pickForgetter } from '@/services/llm/mockData/combatNarrations';
import { withLocation } from '@/services/llm/mockData/locations';
import { getTier } from '@/services/resonanceTiers';
import { SHARD_META } from '@/services/shards';
import { ANCHOR_META } from '@/services/anchors';
import type { AnchorId } from '@/services/anchors';
import {
  formatMomentTime,
  shortLineFor,
} from '@/services/memoryMoments';
import type { ShardId } from '@/types/game';

const CATEGORY_LABEL: Record<'A' | 'B' | 'D' | 'H', string> = {
  A: '가족 호칭',
  B: '보편 한국 이름',
  D: '잿빛 단어',
  H: '일반',
};

function formatCreatedAt(ts: number): string {
  const d = new Date(ts);
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yy}년 ${mm}월 ${dd}일`;
}

const ANCHOR_ORDER: ReadonlyArray<AnchorId> = ['family', 'home', 'school', 'work'];
const ANCHOR_BAR_MAX = 30;

export function CharacterSheetScreen() {
  const character = useGame((s) => s.character);
  const totalResonance = useGame((s) => s.totalResonance);
  const combatCount = useGame((s) => s.combatCount);
  const shards = useGame((s) => s.shards);
  const anchorPoints = useGame((s) => s.anchorPoints);
  const memoryMoments = useGame((s) => s.memoryMoments);
  const goTo = useGame((s) => s.goTo);
  const startCombat = useGame((s) => s.startCombat);
  const tier = getTier(totalResonance);
  // 시트 타임라인은 최근 6개만 (스크롤 부담 방지)
  const recentMoments = memoryMoments.slice(0, 6);

  const shardCounts = shards.reduce<Record<string, number>>((acc, s) => {
    acc[s.id] = (acc[s.id] ?? 0) + 1;
    return acc;
  }, {});
  const ownedIds = Object.keys(shardCounts) as ShardId[];
  const totalShardKinds = Object.keys(SHARD_META).length;

  if (!character) {
    return (
      <div className="vignette min-h-full flex items-center justify-center p-8">
        <ActionButton onClick={() => goTo('title')}>처음으로</ActionButton>
      </div>
    );
  }

  const handleEnterCombat = () => {
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
    <div className="vignette min-h-full flex flex-col px-8 py-10 game-ui">
      <div className="max-w-sm w-full mx-auto flex-1 overflow-y-auto pb-6">
        <p className="text-fg-dim text-xs tracking-[0.3em] uppercase mb-2">이름을 가진 자</p>
        <h2 className="display-text text-3xl text-fg-primary mb-1">{character.nickname}</h2>
        <p className="text-resonance text-sm display-text mb-8">— {character.startingClass}</p>

        <Section label="잔향이 본 너">
          <p className="text-fg-primary leading-relaxed">{character.characterConcept}</p>
        </Section>

        <Section label="외형">
          <p className="text-fg-muted leading-relaxed text-sm">{character.appearance}</p>
        </Section>

        <Section label="연결된 키워드">
          <div className="flex flex-wrap gap-2">
            {character.linkedKeywords.map((k) => (
              <span
                key={k}
                className="px-3 py-1 text-xs border border-resonance/40 text-resonance rounded-sm"
              >
                {k}
              </span>
            ))}
          </div>
        </Section>

        {tier.sheetMessage && (
          <Section label={`잔향의 인장 · ${tier.label}`}>
            <p className="text-resonance/80 leading-relaxed display-text text-sm italic">
              {tier.sheetMessage}
            </p>
            <p className="text-fg-dim text-xs mt-2 tabular-nums">
              누적 잔잔 {totalResonance}
            </p>
          </Section>
        )}

        <Section label="잔향의 기록">
          <dl className="space-y-1.5 text-xs">
            <Row k="이름의 분류" v={`${character.category} · ${CATEGORY_LABEL[character.category]}`} />
            <Row k="잊혀진 자와 만남" v={`${combatCount}회`} />
            <Row k="잔향에 처음 발 들인 날" v={formatCreatedAt(character.createdAt)} />
          </dl>
        </Section>

        <Section label="마음의 거점">
          <ul className="space-y-2">
            {ANCHOR_ORDER.map((id) => {
              const meta = ANCHOR_META[id];
              const value = Math.min(anchorPoints[id] ?? 0, ANCHOR_BAR_MAX);
              const pct = (value / ANCHOR_BAR_MAX) * 100;
              const linked = character.linkedKeywords.includes(meta.keyword);
              return (
                <li key={id} className="text-xs">
                  <div className="flex justify-between items-baseline mb-1">
                    <span
                      className={
                        'display-text ' +
                        (linked ? 'text-resonance' : 'text-fg-muted')
                      }
                    >
                      {meta.label}
                      {linked && <span className="ml-1 text-fg-dim">· {meta.keyword}</span>}
                    </span>
                    <span className="text-fg-dim tabular-nums">
                      {anchorPoints[id] ?? 0}
                      {(anchorPoints[id] ?? 0) >= ANCHOR_BAR_MAX && ' ✓'}
                    </span>
                  </div>
                  <div className="h-1 bg-bg-elevated rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-[width] duration-500 ease-out ${linked ? 'bg-resonance/80' : 'bg-fg-dim/50'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="text-fg-dim text-[0.65rem] italic mt-3 leading-relaxed">
            대화 한 번 = 너의 키워드와 닿은 거점 +1.
          </p>
        </Section>

        <Section label={`기억의 조각 · ${ownedIds.length} / ${totalShardKinds}`}>
          {ownedIds.length === 0 ? (
            <p className="text-fg-dim text-xs italic leading-relaxed">
              아직 어떤 조각도 너의 손에 잡히지 않았다.
            </p>
          ) : (
            <ul className="space-y-3">
              {ownedIds.map((id) => {
                const meta = SHARD_META[id];
                const count = shardCounts[id];
                return (
                  <li key={id} className="border-l-2 border-origin/40 pl-3">
                    <div className="flex justify-between items-baseline">
                      <p className="display-text text-origin text-sm">{meta.label}</p>
                      {count > 1 && (
                        <span className="text-fg-dim text-[0.65rem] tabular-nums">
                          ×{count}
                        </span>
                      )}
                    </div>
                    <p className="text-fg-muted text-xs leading-relaxed mt-1">
                      {meta.description}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>

        {recentMoments.length > 0 && (
          <Section label={`기억 순간 · 최근 ${recentMoments.length} / ${memoryMoments.length}`}>
            <ul className="space-y-3">
              {recentMoments.map((m) => (
                <li key={m.id} className="border-l-2 border-resonance/30 pl-3">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-fg-dim text-[0.6rem] tabular-nums tracking-wider">
                      {formatMomentTime(m.ts)}
                    </span>
                    <span className="text-resonance/70 text-[0.6rem] tabular-nums">
                      잔잔 {m.resonanceAt}
                    </span>
                  </div>
                  <p className="text-fg-primary text-xs leading-relaxed display-text">
                    {shortLineFor(m.outcome, m.bossName)}
                  </p>
                  {m.nickname !== character.nickname && (
                    <p className="text-fg-dim text-[0.6rem] mt-1 italic">
                      이전 이름 — {m.nickname}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </Section>
        )}
      </div>

      <div className="max-w-sm w-full mx-auto space-y-3">
        <ActionButton onClick={handleEnterCombat}>원의 자리로</ActionButton>
        <ActionButton variant="subtle" onClick={() => goTo('title')}>
          ← 처음으로
        </ActionButton>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-6 animate-fade-in">
      <div className="text-fg-dim text-[0.65rem] tracking-[0.2em] uppercase mb-2">{label}</div>
      {children}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-fg-dim">{k}</dt>
      <dd className="text-fg-muted display-text">{v}</dd>
    </div>
  );
}

/* BestiaryScreen — 잊혀진 자들의 도감.
 *
 * 사용자 의도:
 *   "처음 만나는 거라면은 모든 것을 다 물음표로 띄워.
 *    단 모브의 배경 스토리는 볼 수 있게끔 소개하는 페이지를 만들자.
 *    처음 만난 몹이 아니라면 과거에 만났던 몹의 스탯 스킬 체력 이런 것들을 보여주자.
 *    같은 이름의 몹일지라도 조금씩 변화를 주자. 과거 만났던 몹의 스탯과 스킬을
 *    보여주지만 실제로 그것과 일치하는지는 아무도 알 수 없는 걸로 하자.
 *    전투하다가 서서히 드러나게 하자."
 *
 * Phase 0: 5 archetype + 만남 추적. 만난 적은 lastObservedMaxHp 노출.
 * #62 PR에서 stat variation 도입 — "어림짐작" 표시.
 */

import { ActionButton } from '@/components/ActionButton';
import { useGame } from '@/store/gameStore';
import {
  ALL_ARCHETYPES,
  archetypeByName,
} from '@/services/llm/mockData/combatNarrations';
import type { EnemyArchetype } from '@/services/llm/mockData/combatNarrations';
import type { EncounteredInfo } from '@/services/bestiary';

const QUESTION = '???';

const OUTCOME_LABEL: Record<EncounteredInfo['lastOutcome'], string> = {
  victory: '쓰러뜨림',
  defeat: '사라짐',
  fled: '도망',
  stalemate: '안개 속 헤어짐',
};

function formatLastSeen(ts: number): string {
  const d = new Date(ts);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${mm}/${dd}`;
}

interface BestiaryEntryProps {
  archetype: EnemyArchetype;
  info: EncounteredInfo | null;
}

function BestiaryEntry({ archetype, info }: BestiaryEntryProps) {
  const seen = info !== null;
  return (
    <li
      className={
        'p-4 border rounded-md bg-bg-secondary/40 ' +
        (seen ? 'border-bg-elevated' : 'border-bg-elevated/50 opacity-90')
      }
    >
      {/* 이름 — 처음 만나기 전엔 ??? */}
      <div className="flex justify-between items-baseline mb-2">
        <p
          className={
            'display-text text-base ' +
            (seen ? 'text-fg-primary' : 'text-fg-dim')
          }
        >
          {seen ? archetype.name : '잊혀진 자 — ' + QUESTION}
        </p>
        {seen && info && (
          <span className="text-fg-dim text-[0.6rem] tabular-nums">
            {info.encounterCount}회 · {formatLastSeen(info.lastSeenAt)}
          </span>
        )}
      </div>

      {/* 외형 묘사 — 만난 적만 */}
      <p
        className={
          'text-xs leading-relaxed mb-3 ' +
          (seen ? 'text-fg-muted' : 'text-fg-dim/70 italic')
        }
      >
        {seen ? archetype.description : QUESTION}
      </p>

      {/* 알게 된 정보 — Phase 0: HP만, Phase 1+ 스킬 추가 */}
      <div className="grid grid-cols-2 gap-2 text-[0.7rem] mb-3">
        <div className="border border-bg-elevated/50 rounded-sm px-2 py-1">
          <p className="text-fg-dim text-[0.6rem] tracking-wider">체력 (어림)</p>
          <p
            className={
              'tabular-nums display-text ' +
              (seen ? 'text-danger/90' : 'text-fg-dim')
            }
          >
            {seen && info ? `약 ${info.lastObservedMaxHp}` : QUESTION}
          </p>
        </div>
        <div className="border border-bg-elevated/50 rounded-sm px-2 py-1">
          <p className="text-fg-dim text-[0.6rem] tracking-wider">최근 결말</p>
          <p
            className={
              'display-text ' +
              (seen ? 'text-fg-muted' : 'text-fg-dim')
            }
          >
            {seen && info ? OUTCOME_LABEL[info.lastOutcome] : QUESTION}
          </p>
        </div>
      </div>

      {/* 배경 스토리 — 항상 노출 (사용자 의도: "단 모브의 배경 스토리는
          볼 수 있게끔") */}
      <div className="border-l-2 border-resonance/30 pl-3">
        <p className="text-fg-dim text-[0.6rem] tracking-[0.3em] uppercase mb-1">
          배경
        </p>
        <p className="text-fg-muted text-xs leading-relaxed italic">
          {archetype.background}
        </p>
      </div>

      {/* "어림짐작" 안내 — 만난 적만, #62 stat variation 사전 시그널 */}
      {seen && (
        <p className="text-fg-dim/70 text-[0.6rem] italic mt-2 leading-relaxed">
          기록은 마지막 만남의 어림. 같은 이름이어도 매번 조금씩 다르다.
        </p>
      )}
    </li>
  );
}

export function BestiaryScreen() {
  const goTo = useGame((s) => s.goTo);
  const encounteredBosses = useGame((s) => s.encounteredBosses);

  // 5 archetype 카탈로그 — Bestiary 누적
  const seenCount = ALL_ARCHETYPES.filter(
    (a) => !!encounteredBosses[a.name],
  ).length;

  return (
    <div className="vignette min-h-full flex flex-col px-6 py-8 game-ui">
      <div className="max-w-sm w-full mx-auto flex-1 overflow-y-auto pb-6">
        <div className="text-center mb-6 animate-fade-in-slow">
          <p className="text-fg-dim text-[0.6rem] tracking-[0.4em] uppercase mb-2">
            잊혀진 자들의 도감
          </p>
          <h2 className="display-text text-xl text-fg-primary mb-1">
            거리에 흐른 자들
          </h2>
          <p className="text-fg-muted text-xs italic">
            {seenCount} / {ALL_ARCHETYPES.length}체 — 만남으로 드러난다.
          </p>
        </div>

        <ul className="space-y-3">
          {ALL_ARCHETYPES.map((archetype) => (
            <BestiaryEntry
              key={archetype.name}
              archetype={archetype}
              info={encounteredBosses[archetype.name] ?? null}
            />
          ))}
        </ul>

        <p className="text-fg-dim text-[0.6rem] italic text-center mt-6 leading-relaxed">
          Phase 1+: 스킬·약점·기억 카탈로그 + 길드 멤버 만남 공유
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

// archetypeByName re-export — 향후 다른 화면에서 활용 가능
export { archetypeByName };

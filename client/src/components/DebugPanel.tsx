/* 디버그 패널 — Phase 0 검증용. ?debug=1 URL 쿼리로만 활성.
 *
 * 시몬님(또는 시드 CBT 친구)이 5체 보스/4 tier/장소 16종/카테고리
 * footer 16종 모두를 정상 플레이 시간(50+ 전투) 없이 즉시 검증할 수
 * 있게 하는 도구.
 *
 * 일반 사용자에게는 노출되지 않음. Phase 1+에서 admin 인증 게이트.
 */

import { useGame } from '@/store/gameStore';
import type { CharacterSheet, NicknameCategory } from '@/types/game';

export function isDebugMode(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return new URLSearchParams(window.location.search).get('debug') === '1';
  } catch {
    return false;
  }
}

const TIER_PRESETS: ReadonlyArray<{ label: string; value: number }> = [
  { label: 'novice', value: 0 },
  { label: 'echo (50)', value: 50 },
  { label: 'resonant (150)', value: 150 },
  { label: 'origin 4체 (400)', value: 400 },
  { label: 'origin 5체 (1000)', value: 1000 },
];

const CATEGORY_PRESETS: ReadonlyArray<{
  label: string;
  category: NicknameCategory;
  template: Pick<
    CharacterSheet,
    'nickname' | 'characterConcept' | 'appearance' | 'startingClass' | 'linkedKeywords' | 'categoryBonuses' | 'voiceFirstLine'
  >;
}> = [
  {
    label: 'A · 엄마',
    category: 'A',
    template: {
      nickname: '엄마',
      characterConcept: '그 이름으로 불리던 시절을 잃은 자',
      appearance: '회색 외투의 안주머니에 색이 바랜 사진 한 장.',
      startingClass: '잔재의 사도',
      linkedKeywords: ['어린시절', '추억'],
      categoryBonuses: { childhoodBossCrit: 0.2, autoReviveOnce: true },
      voiceFirstLine: '그 이름을… 그렇게 부르던 사람이 있었지.',
    },
  },
  {
    label: 'B · 민수',
    category: 'B',
    template: {
      nickname: '민수',
      characterConcept: '동명의 행인',
      appearance: '같은 이름을 가진 누군가의 발자국 위에 서 있다.',
      startingClass: '동명의 행인',
      linkedKeywords: ['추억'],
      categoryBonuses: { resonanceLink: 50 },
      voiceFirstLine: '같은 이름의 누군가가, 어디선가 너를 기다린다.',
    },
  },
  {
    label: 'D · 어둠',
    category: 'D',
    template: {
      nickname: '어둠',
      characterConcept: '잿빛 외투의 잔향',
      appearance: '그림자가 한 박자 늦게 너를 따라온다.',
      startingClass: '그림자의 사도',
      linkedKeywords: ['희생', '꿈과현실'],
      categoryBonuses: { shadowFormCrit: 0.2, forgetterDamageBonus: 0.15 },
      voiceFirstLine: '그 이름은… 너 자신이 너에게 한 약속이다.',
    },
  },
  {
    label: 'H · 테스트',
    category: 'H',
    template: {
      nickname: '테스트',
      characterConcept: '거리의 처음 온 자',
      appearance: '아무것도 들지 않은 손이 가볍다.',
      startingClass: '잔향의 객',
      linkedKeywords: ['꿈과현실'],
      categoryBonuses: { none: true },
      voiceFirstLine: '거리는 너를 처음 본다. 너도 거리를 처음 본다.',
    },
  },
];

export function DebugPanel() {
  const character = useGame((s) => s.character);
  const totalResonance = useGame((s) => s.totalResonance);
  const combatCount = useGame((s) => s.combatCount);

  const setTotal = (n: number) => {
    useGame.setState({ totalResonance: n });
  };

  const setCharacter = (preset: (typeof CATEGORY_PRESETS)[number]) => {
    useGame.getState().setCharacter({
      ...preset.template,
      category: preset.category,
      createdAt: Date.now(),
    });
  };

  const fullReset = () => {
    useGame.getState().reset();
    try {
      localStorage.removeItem('resonance:game');
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="fixed bottom-2 right-2 z-50 max-w-[280px] bg-bg-elevated/95 border border-resonance/40 rounded p-3 text-[0.65rem] text-fg-muted shadow-lg backdrop-blur">
      <div className="flex justify-between items-center mb-2">
        <span className="display-text text-resonance">debug</span>
        <span className="tabular-nums text-fg-dim">
          {combatCount}전 · {totalResonance}잔잔
        </span>
      </div>

      <div className="mb-2">
        <p className="text-fg-dim mb-1">잔잔 점프 (tier 검증)</p>
        <div className="flex flex-wrap gap-1">
          {TIER_PRESETS.map((p) => (
            <button
              key={p.value}
              onClick={() => setTotal(p.value)}
              className="px-1.5 py-0.5 border border-bg-elevated hover:border-resonance/60 rounded-sm"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-2">
        <p className="text-fg-dim mb-1">카테고리 캐릭터 즉시 생성</p>
        <div className="flex flex-wrap gap-1">
          {CATEGORY_PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => setCharacter(p)}
              className="px-1.5 py-0.5 border border-bg-elevated hover:border-resonance/60 rounded-sm"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-1">
        <button
          onClick={fullReset}
          className="flex-1 px-1.5 py-0.5 border border-danger/40 text-danger/90 hover:bg-danger/10 rounded-sm"
        >
          초기화
        </button>
        <a
          href={(window.location.pathname || '/') + window.location.search.replace(/[?&]debug=1/, '')}
          className="flex-1 px-1.5 py-0.5 border border-bg-elevated hover:border-resonance/60 rounded-sm text-center"
        >
          debug 끄기
        </a>
      </div>

      {character && (
        <p className="mt-2 text-fg-dim text-[0.6rem] text-center truncate">
          현재: {character.nickname} ({character.category})
        </p>
      )}
    </div>
  );
}

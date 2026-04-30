/* 기억 순간 — 결말 자동 캡처 (v2.3 §22.3 memory_moment 스키마 Phase 0).
 *
 * 매 전투 결말마다 짧은 한 줄과 메타가 누적 → 시트 타임라인.
 * Phase 1+ LLM emotion_tag 강도 ≥ 7 자동 감지 + 수동 "기억하기" 버튼
 * (v2.3 §22.2 멀티 트리거).
 */

import type { CombatOutcome } from '@/types/game';

export interface MemoryMoment {
  /** 단순 nanoid: ts + 랜덤 4자리 (Phase 0). Phase 1+ 서버 uuid. */
  id: string;
  /** 캡처 시각 (ms) */
  ts: number;
  /** 결말 종류 */
  outcome: CombatOutcome;
  /** 그 전투의 적 이름 */
  bossName: string;
  /** 캡처 시점의 누적 잔잔 */
  resonanceAt: number;
  /** 캐릭터 닉네임 (재플레이 후 다른 닉네임 비교 가능) */
  nickname: string;
}

interface MomentLineRule {
  outcome: CombatOutcome;
  /** boss 이름에 포함되는 키워드 (없으면 모든 보스 매칭) */
  bossKeyword?: string;
  line: string;
}

/* outcome × boss 매트릭스로 짧은 한 줄. 가장 구체적인 룰부터 매칭.
 * 원의 아이(5체) victory는 가장 깊은 결의. v1.2 5체 보스 시드. */
const LINE_RULES: ReadonlyArray<MomentLineRule> = [
  /* victory — 보스별 특화 (v1.2) */
  {
    outcome: 'victory',
    bossKeyword: '원의 아이',
    line: '회색 운동장 한가운데, 작은 손이 너의 손을 잠시 잡았다 놓았다.',
  },
  {
    outcome: 'victory',
    bossKeyword: '떠난 친구들',
    line: '흔들다 만 손이 마침내 한 번, 끝까지 흔들렸다.',
  },
  {
    outcome: 'victory',
    bossKeyword: '미루는 학자',
    line: '미뤄둔 페이지의 한 줄을, 너는 처음으로 끝까지 읽었다.',
  },
  {
    outcome: 'victory',
    bossKeyword: '흐르는 그림자',
    line: '강물에 비치다 사라진 그 이름을, 너는 한 박자 먼저 부르려 했다.',
  },
  {
    outcome: 'victory',
    bossKeyword: '남겨진 거인',
    line: '못 건넨 명함이 잠깐, 너의 손에 다시 머물렀다.',
  },
  /* defeat — 모든 보스 공통 */
  {
    outcome: 'defeat',
    line: '거리가 너를 받아내지 못했다. 너는 그것을 기억한다.',
  },
  {
    outcome: 'fled',
    line: '도망친 자리는 한 박자 더 길게 너를 따라온다.',
  },
  {
    outcome: 'stalemate',
    line: '안개 속에서 너희는 서로의 호흡을 한 번씩 들이마셨다.',
  },
];

/** outcome × boss → 짧은 한 줄 매칭. 가장 먼저 매칭되는 룰 반환. */
export function shortLineFor(outcome: CombatOutcome, bossName: string): string {
  for (const rule of LINE_RULES) {
    if (rule.outcome !== outcome) continue;
    if (rule.bossKeyword && !bossName.includes(rule.bossKeyword)) continue;
    return rule.line;
  }
  // 폴백 — 위 룰이 outcome 4종 모두 커버하므로 도달 불가능
  return '거리가 너를 한 박자 늦게 보낸다.';
}

/** 단순 ID — ts + Math.random 4자리. Phase 1+ 서버 uuid. */
export function newMomentId(): string {
  return `${Date.now()}-${Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0')}`;
}

/** 표시용 시각 — "MM/DD HH:mm". 같은 닉네임 여러 전투 비교 가능. */
export function formatMomentTime(ts: number): string {
  const d = new Date(ts);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${mm}/${dd} ${hh}:${mi}`;
}
